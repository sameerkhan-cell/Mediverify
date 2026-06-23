import { prisma } from "../db/client";
import { VerificationStatus } from "@prisma/client";
import { BlockchainService } from "./blockchain/blockchain.service";
import { RealtimeService } from "./realtime/realtime.service";
import { AIService } from "./ai/ai.service";

export interface VerificationRequest {
    code: string;
    location?: string;
    lat?: number;
    lng?: number;
    deviceInfo?: string;
    userId?: string;
}

export interface VerificationResponse {
    success: boolean;
    resultType: "GENUINE" | "FAKE" | "SUSPICIOUS" | "DUPLICATE" | "EXPIRED";
    medicine?: any;
    manufacturer?: any;
    batch?: any;
    pill?: any;
    verification: {
        id: string;
        scanTime: Date;
        scanLocation: string;
        deviceInfo: string;
        blockchainStatus: string;
    };
    blockchain: {
        txHash: string | null;
        status: string;
        verifiedOnChain: boolean;
    };
    warnings: string[];
    riskScore: number;
    message: string;
    // Optional Supply Chain Info
    supplyChain?: { boxNumber: string; pharmacyName: string | null; verifiedBy: string };
    pillInfo?: { pillNumber: string; boxNumber: string | null; sequencePosition: string };
    cartonInfo?: { cartonNumber: string; boxesCount: number; boxNumbers: string[] };
}

export class VerificationEngine {
    // ═══════════════════════════════════
    // PART 1 — Routing
    // ═══════════════════════════════════
    static async verify(req: VerificationRequest): Promise<VerificationResponse> {
        const { code } = req;

        if (code.startsWith("CARTON-")) {
            return this.verifyCarton(req);
        } else if (code.startsWith("BOX-")) {
            return this.verifyBox(req);
        } else if (code.startsWith("PILL-")) {
            return this.verifyPill(req);
        } else {
            return this.verifyBatchNumber(req);
        }
    }

    // ═══════════════════════════════════
    // PART 2 — Anomaly Detection & Batch Verification
    // ═══════════════════════════════════
    private static isAnomalous(batchNumber: string): { anomalous: boolean; reason: string; severity: "HIGH" | "MEDIUM" } {
        const parts = batchNumber.split("-");
        if (parts.length !== 3) {
            return { anomalous: true, reason: "Invalid batch number format.", severity: "HIGH" };
        }

        const year = parseInt(parts[1]);
        const num = parseInt(parts[2]);

        if (isNaN(year) || isNaN(num)) {
            return { anomalous: true, reason: "Invalid batch number format.", severity: "HIGH" };
        }

        const currentYear = new Date().getFullYear();

        if (year > currentYear) {
            return { anomalous: true, reason: "Batch year " + year + " is in the future.", severity: "HIGH" };
        }

        if (num > 5000) {
            return { anomalous: true, reason: "Batch sequence number " + num + " is far outside the normal manufacturing range.", severity: "HIGH" };
        }

        if (num === 0) {
            return { anomalous: true, reason: "Batch sequence number cannot be zero.", severity: "HIGH" };
        }

        if (year < currentYear - 6) {
            return { anomalous: true, reason: "Batch year " + year + " is unusually old.", severity: "MEDIUM" };
        }

        return { anomalous: false, reason: "", severity: "MEDIUM" };
    }

    private static async verifyBatchNumber(req: VerificationRequest): Promise<VerificationResponse> {
        const check = this.isAnomalous(req.code);

        if (check.anomalous && check.severity === "HIGH") {
            return this.handleFakeResult(req, "FAKE DETECTED: " + check.reason);
        }

        const batch = await prisma.batch.findUnique({
            where: { batchNumber: req.code },
            include: { medicine: { include: { manufacturer: true } } }
        });

        if (!batch) {
            if (check.anomalous) {
                return this.handleFakeResult(req, "SUSPICIOUS: " + check.reason + " Also not found in database.");
            }
            return this.handleFakeResult(req, "Batch not found in MediVerify database.");
        }

        const now = new Date();
        const isExpired = batch.expiryDate < now;
        const isRecalled = batch.isRecalled;

        const scanCount = await prisma.verificationLog.count({
            where: { code: req.code }
        });

        const riskLevel = this.calculateRisk(scanCount, req);
        const resultType = isExpired ? "EXPIRED" : (isRecalled || riskLevel.score > 70) ? "SUSPICIOUS" : scanCount > 0 ? "DUPLICATE" : "GENUINE";

        const log = await this.logVerification(req, resultType, batch.medicineId, null);

        // Side-effects
        BlockchainService.anchorVerification(req.code, req.location || "Unknown", resultType).catch(console.error);
        RealtimeService.broadcastVerification({ ...log, status: resultType } as any);
        if (req.location) AIService.predictFraudOutbreak(req.location).catch(console.error);

        return {
            success: true,
            resultType,
            medicine: batch.medicine,
            manufacturer: batch.medicine.manufacturer,
            batch: {
                batchNumber: batch.batchNumber,
                expiry: batch.expiryDate,
                status: batch.medicineStatus,
                category: batch.category
            },
            verification: {
                id: log.id,
                scanTime: log.createdAt,
                scanLocation: req.location || "Unknown",
                deviceInfo: req.deviceInfo || "Web Browser",
                blockchainStatus: batch.blockchainStatus
            },
            blockchain: {
                txHash: batch.txHash,
                status: batch.blockchainStatus,
                verifiedOnChain: !!batch.txHash
            },
            warnings: this.generateWarnings(resultType, isRecalled, isExpired, riskLevel.score),
            riskScore: riskLevel.score,
            message: this.generateMessage(resultType, batch.medicine.name)
        };
    }

    // ═══════════════════════════════════
    // PART 3 — verifyCarton (NEW)
    // ═══════════════════════════════════
    private static async verifyCarton(req: VerificationRequest): Promise<VerificationResponse> {
        const carton = await prisma.carton.findUnique({
            where: { qrCode: req.code },
            include: {
                batch: { include: { medicine: { include: { manufacturer: true } } } },
                boxes: true
            }
        });

        if (!carton) {
            return this.handleFakeResult(req, "Carton QR code not found in MediVerify database.");
        }

        if (carton.scannedAt) {
            return this.handleFakeResult(req, "DUPLICATE: This carton was already scanned on " + carton.scannedAt.toISOString() + ".");
        }

        await prisma.carton.update({
            where: { id: carton.id },
            data: {
                scannedAt: new Date(),
                scannedLocation: req.location || "Unknown",
                scannedByUserId: req.userId ?? null
            }
        });

        const isExpired = carton.batch.expiryDate < new Date();
        const isRecalled = carton.batch.isRecalled;
        const resultType = isExpired ? "EXPIRED" : isRecalled ? "SUSPICIOUS" : "GENUINE";

        const log = await this.logVerification(req, resultType, carton.batch.medicineId, null);

        // Side-effects
        BlockchainService.anchorVerification(req.code, req.location || "Unknown", resultType).catch(console.error);
        RealtimeService.broadcastVerification({ ...log, status: resultType } as any);
        if (req.location) AIService.predictFraudOutbreak(req.location).catch(console.error);

        return {
            success: true,
            resultType,
            medicine: carton.batch.medicine,
            manufacturer: carton.batch.medicine.manufacturer,
            batch: carton.batch,
            verification: {
                id: log.id,
                scanTime: log.createdAt,
                scanLocation: req.location || "Unknown",
                deviceInfo: req.deviceInfo || "Web Browser",
                blockchainStatus: carton.batch.blockchainStatus
            },
            blockchain: {
                txHash: carton.batch.txHash,
                status: carton.batch.blockchainStatus,
                verifiedOnChain: !!carton.batch.txHash
            },
            warnings: this.generateWarnings(resultType, isRecalled, isExpired, 0),
            riskScore: 0,
            message: this.generateMessage(resultType, carton.batch.medicine.name),
            cartonInfo: {
                cartonNumber: carton.cartonNumber,
                boxesCount: carton.boxesCount,
                boxNumbers: carton.boxes.map(b => b.boxNumber)
            }
        };
    }

    // ═══════════════════════════════════
    // PART 4 — verifyBox (REWRITE)
    // ═══════════════════════════════════
    private static async verifyBox(req: VerificationRequest): Promise<VerificationResponse> {
        const box = await prisma.box.findUnique({
            where: { qrCode: req.code },
            include: {
                batch: { include: { medicine: { include: { manufacturer: true } } } },
                pharmacy: true
            }
        });

        if (!box) {
            return this.handleFakeResult(req, "Box QR code not found in MediVerify database.");
        }

        const scanningUser = req.userId ? await prisma.user.findUnique({
            where: { id: req.userId },
            include: { pharmacy: true }
        }) : null;

        if (scanningUser?.role === "PHARMACY") {
            if (box.pharmacyScannedAt) {
                const existingPharmacy = box.pharmacyId ? await prisma.pharmacy.findUnique({ where: { id: box.pharmacyId } }) : null;
                return this.handleFakeResult(req, "DUPLICATE: This box was already scanned by " + (existingPharmacy?.name ?? "another pharmacy") + " on " + box.pharmacyScannedAt.toISOString() + ". Cannot be re-verified by another pharmacy.");
            }
            await prisma.box.update({
                where: { id: box.id },
                data: {
                    pharmacyScannedAt: new Date(),
                    pharmacyId: scanningUser.pharmacy?.id ?? null
                }
            });
        } else if (scanningUser?.role === "PATIENT" || !scanningUser) {
            if (box.patientScannedAt) {
                return this.handleFakeResult(req, "DUPLICATE: This box QR was already verified by a patient on " + box.patientScannedAt.toISOString() + ". If this is an unopened box, please report immediately.");
            }
            await prisma.box.update({
                where: { id: box.id },
                data: {
                    patientScannedAt: new Date(),
                    patientUserId: scanningUser?.id ?? null
                }
            });
        }

        const isExpired = box.batch.expiryDate < new Date();
        const isRecalled = box.batch.isRecalled;

        const scanCount = await prisma.verificationLog.count({ where: { code: req.code } });
        const riskLevel = this.calculateRisk(scanCount, req);
        const resultType = isExpired ? "EXPIRED" : (isRecalled || riskLevel.score > 70) ? "SUSPICIOUS" : scanCount > 0 ? "DUPLICATE" : "GENUINE";

        const log = await this.logVerification(req, resultType, box.batch.medicineId, null);

        // Side-effects
        BlockchainService.anchorVerification(req.code, req.location || "Unknown", resultType).catch(console.error);
        RealtimeService.broadcastVerification({ ...log, status: resultType } as any);
        if (req.location) AIService.predictFraudOutbreak(req.location).catch(console.error);

        const pharmacy = box.pharmacyId ? await prisma.pharmacy.findUnique({ where: { id: box.pharmacyId } }) : null;

        return {
            success: true,
            resultType,
            medicine: box.batch.medicine,
            manufacturer: box.batch.medicine.manufacturer,
            batch: box.batch,
            verification: {
                id: log.id,
                scanTime: log.createdAt,
                scanLocation: req.location || "Unknown",
                deviceInfo: req.deviceInfo || "Web Browser",
                blockchainStatus: box.batch.blockchainStatus
            },
            blockchain: {
                txHash: box.batch.txHash,
                status: box.batch.blockchainStatus,
                verifiedOnChain: !!box.batch.txHash
            },
            warnings: this.generateWarnings(resultType, isRecalled, isExpired, riskLevel.score),
            riskScore: riskLevel.score,
            message: this.generateMessage(resultType, box.batch.medicine.name),
            supplyChain: {
                boxNumber: box.boxNumber,
                pharmacyName: pharmacy?.name ?? null,
                verifiedBy: scanningUser?.role ?? "PUBLIC"
            }
        };
    }

    // ═══════════════════════════════════
    // PART 5 — verifyPill (REWRITE)
    // ═══════════════════════════════════
    private static async verifyPill(req: VerificationRequest): Promise<VerificationResponse> {
        const pill = await prisma.pill.findUnique({
            where: { qrCode: req.code },
            include: {
                batch: { include: { medicine: { include: { manufacturer: true } } } },
                box: true
            }
        });

        if (!pill) {
            return this.handleFakeResult(req, "Pill QR code not found in MediVerify database.");
        }

        const scanningUser = req.userId ? await prisma.user.findUnique({ where: { id: req.userId } }) : null;

        if (scanningUser?.role === "PHARMACY" || scanningUser?.role === "MANUFACTURER") {
            return this.handleFakeResult(req, "Pill-level QR codes can only be verified by patients, not " + scanningUser.role + " accounts.");
        }

        if (pill.qrScanned) {
            return this.handleFakeResult(req, "DUPLICATE: This pill was already scanned on " + pill.scannedAt?.toISOString() + ". Each pill can only be verified once.");
        }

        await prisma.pill.update({
            where: { id: pill.id },
            data: {
                qrScanned: true,
                scannedAt: new Date(),
                scannedLocation: req.location || "Unknown",
                verificationStatus: "VERIFIED"
            }
        });

        const isExpired = pill.batch.expiryDate < new Date();
        const isRecalled = pill.batch.isRecalled;
        const resultType = isExpired ? "EXPIRED" : isRecalled ? "SUSPICIOUS" : "GENUINE";

        const log = await this.logVerification(req, resultType, pill.batch.medicineId, pill.id);

        // Side-effects
        BlockchainService.anchorVerification(req.code, req.location || "Unknown", resultType).catch(console.error);
        RealtimeService.broadcastVerification({ ...log, status: resultType } as any);
        if (req.location) AIService.predictFraudOutbreak(req.location).catch(console.error);

        return {
            success: true,
            resultType,
            medicine: pill.batch.medicine,
            manufacturer: pill.batch.medicine.manufacturer,
            batch: pill.batch,
            pill: {
                serialNumber: pill.pillNumber,
                status: pill.status
            },
            verification: {
                id: log.id,
                scanTime: log.createdAt,
                scanLocation: req.location || "Unknown",
                deviceInfo: req.deviceInfo || "Web Browser",
                blockchainStatus: pill.batch.blockchainStatus
            },
            blockchain: {
                txHash: pill.blockchainTx || pill.batch.txHash,
                status: pill.batch.blockchainStatus,
                verifiedOnChain: !!(pill.blockchainTx || pill.batch.txHash)
            },
            warnings: this.generateWarnings(resultType, isRecalled, isExpired, 0),
            riskScore: 0,
            message: this.generateMessage(resultType, pill.batch.medicine.name, pill.pillNumber),
            pillInfo: {
                pillNumber: pill.pillNumber,
                boxNumber: pill.box?.boxNumber ?? null,
                sequencePosition: "Pill " + pill.pillNumber + " from batch " + pill.batch.batchNumber
            }
        };
    }

    // ═══════════════════════════════════
    // PART 6 — logVerification
    // ═══════════════════════════════════
    private static async logVerification(req: VerificationRequest, status: string, medicineId: string, pillId: string | null) {
        const statusMap: Record<string, VerificationStatus> = {
            GENUINE: "GENUINE",
            DUPLICATE: "DUPLICATE",
            SUSPICIOUS: "SUSPECTED",
            EXPIRED: "INVALID",
            FAKE: "INVALID"
        };
        const dbStatus = statusMap[status] ?? "INVALID";

        let type = "BATCH";
        if (req.code.startsWith("CARTON-")) type = "CARTON";
        else if (req.code.startsWith("BOX-")) type = "BOX";
        else if (req.code.startsWith("PILL-")) type = "PILL";

        return await prisma.verificationLog.create({
            data: {
                userId: req.userId,
                medicineId,
                pillId,
                code: req.code,
                type,
                status: dbStatus,
                location: req.location || "Unknown",
                lat: req.lat,
                lng: req.lng,
                userAgent: req.deviceInfo || "Web Browser",
            }
        });
    }

    private static handleFakeResult(req: VerificationRequest, reason: string): VerificationResponse {
        return {
            success: false,
            resultType: "FAKE",
            verification: {
                id: "ERR-" + Date.now(),
                scanTime: new Date(),
                scanLocation: req.location || "Unknown",
                deviceInfo: req.deviceInfo || "Unknown",
                blockchainStatus: "NOT_FOUND"
            },
            blockchain: { txHash: null, status: "UNVERIFIED", verifiedOnChain: false },
            warnings: ["CRYPTOGRAPHIC_MISMATCH", "UNAUTHORIZED_BATCH_ID"],
            riskScore: 100,
            message: reason || "WARNING: This medicine is NOT FOUND in the MediVerify blockchain ledger. DO NOT CONSUME."
        };
    }

    private static calculateRisk(scanCount: number, req: VerificationRequest) {
        let score = 0;
        if (scanCount > 0) score += 40;
        if (scanCount > 5) score += 40;
        if (req.location === "Unknown") score += 10;
        return { score: Math.min(score, 100) };
    }

    private static generateWarnings(type: string, recalled: boolean, expired: boolean, score: number) {
        const warnings = [];
        if (recalled) warnings.push("BATCH_RECALLED_BY_MANUFACTURER");
        if (expired) warnings.push("EXPIRED_MEDICINE_DETECTED");
        if (score > 50) warnings.push("HIGH_SCAN_FREQUENCY_DETECTED");
        if (type === "DUPLICATE") warnings.push("POTENTIAL_PACKAGING_REUSE");
        return warnings;
    }

    private static generateMessage(type: string, name: string, pillNum?: string) {
        if (type === "GENUINE") return `Success! ${name}${pillNum ? ' Pill #' + pillNum : ''} is authenticated and safe.`;
        if (type === "DUPLICATE") return `CAUTION: This ${pillNum ? 'pill' : 'box'} has been scanned multiple times. Integrity compromised.`;
        if (type === "EXPIRED") return `STOP: ${name} is past its expiry date. Contact your pharmacy.`;
        if (type === "SUSPICIOUS") return `ALERT: Anomalous activity detected. Contact DRAP immediately.`;
        return "Verification failed.";
    }
}
