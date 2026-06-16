import { prisma } from "../db/client";
import { ApiError } from "../utils/api-response";
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
    supplyChain?: {
        boxNumber: string;
        pharmacyName: string | null;
        verifiedBy: string;
    };
    pillInfo?: {
        pillNumber: string;
        boxNumber: string | null;
        sequencePosition: string;
    };
    cartonInfo?: {
        cartonNumber: string;
        boxesCount: number;
        boxNumbers: string[];
    };
}

export class VerificationEngine {
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

        const isExpired = box.batch.expiryDate < new Date();
        const isRecalled = box.batch.isRecalled;

        // Fetch scanning user role
        const scanningUser = req.userId ? await prisma.user.findUnique({
            where: { id: req.userId },
            include: { pharmacy: true }
        }) : null;

        // e. PHARMACY SCAN LOGIC
        if (scanningUser?.role === "PHARMACY") {
            if (box.pharmacyScannedAt) {
                const existingPharmacy = box.pharmacyId ? await prisma.pharmacy.findUnique({ where: { id: box.pharmacyId } }) : null;
                return this.handleFakeResult(req, `DUPLICATE: This box was already scanned by ${existingPharmacy?.name || "another pharmacy"} on ${box.pharmacyScannedAt.toISOString()}. This box cannot be re-verified by another pharmacy.`);
            }
            await prisma.box.update({
                where: { id: box.id },
                data: { pharmacyScannedAt: new Date(), pharmacyId: scanningUser.pharmacy?.id }
            });
        }

        // f. PATIENT SCAN LOGIC
        if (scanningUser?.role === "PATIENT" || !scanningUser) {
            if (box.patientScannedAt) {
                return this.handleFakeResult(req, `DUPLICATE: This box QR was already verified by a patient on ${box.patientScannedAt.toISOString()}. If you are seeing this on a sealed new box, please report this immediately.`);
            }
            await prisma.box.update({
                where: { id: box.id },
                data: { patientScannedAt: new Date(), patientUserId: scanningUser?.id ?? null }
            });
        }

        // g. ANY OTHER ROLE (e.g. MANUFACTURER, REGULATOR) — read-only, proceed.

        // h. Determine resultType
        const scanCount = await prisma.verificationLog.count({ where: { code: req.code } });
        const riskLevel = this.calculateRisk(scanCount, req);
        const resultType = isExpired ? "EXPIRED" : (isRecalled || riskLevel.score > 70) ? "SUSPICIOUS" : "GENUINE";

        // i. Log verification
        const log = await this.logVerification(req, resultType, box.batch.medicineId, null);

        // Fetch pharmacy name for patient response
        const pharmacyName = box.pharmacyId ? (await prisma.pharmacy.findUnique({ where: { id: box.pharmacyId } }))?.name || null : null;

        return {
            success: true,
            resultType,
            medicine: box.batch.medicine,
            manufacturer: box.batch.medicine.manufacturer,
            batch: {
                batchNumber: box.batch.batchNumber,
                expiry: box.batch.expiryDate,
                status: box.batch.medicineStatus,
                category: box.batch.category
            },
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
                pharmacyName: pharmacyName,
                verifiedBy: scanningUser?.role || "PUBLIC"
            }
        };
    }

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

        // Fetch scanning user
        const scanningUser = req.userId ? await prisma.user.findUnique({ where: { id: req.userId } }) : null;

        // c. ONLY PATIENTS CAN SCAN PILLS
        if (scanningUser && (scanningUser.role === "PHARMACY" || scanningUser.role === "MANUFACTURER")) {
            return this.handleFakeResult(req, `Pill-level QR codes can only be verified by patients, not ${scanningUser.role} accounts.`);
        }

        // d. Duplicate detection
        if (pill.qrScanned) {
            return this.handleFakeResult(req, `DUPLICATE: This pill QR was already scanned on ${pill.scannedAt?.toISOString()}. Each pill can only be verified once — if you are seeing this on an unused pill, please report this immediately.`);
        }

        // e. Update scan status
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

        // f. Determine resultType
        const resultType = isExpired ? "EXPIRED" : isRecalled ? "SUSPICIOUS" : "GENUINE";

        // g. Log verification
        const log = await this.logVerification(req, resultType, pill.batch.medicineId, pill.id);

        // Async anchor to blockchain
        BlockchainService.anchorVerification(req.code, req.location || "Unknown", resultType).catch(console.error);

        return {
            success: true,
            resultType,
            medicine: pill.batch.medicine,
            manufacturer: pill.batch.medicine.manufacturer,
            batch: {
                batchNumber: pill.batch.batchNumber,
                expiry: pill.batch.expiryDate,
                status: pill.batch.medicineStatus,
                category: pill.batch.category
            },
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
                boxNumber: pill.box?.boxNumber || null,
                sequencePosition: `Pill ${pill.pillNumber} from batch ${pill.batch.batchNumber}`
            }
        };
    }

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
            return this.handleFakeResult(req, `DUPLICATE: This carton was already scanned on ${carton.scannedAt.toISOString()}.`);
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

        return {
            success: true,
            resultType,
            medicine: carton.batch.medicine,
            manufacturer: carton.batch.medicine.manufacturer,
            batch: {
                batchNumber: carton.batch.batchNumber,
                expiry: carton.batch.expiryDate,
                status: carton.batch.medicineStatus,
                category: carton.batch.category
            },
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

    private static calculateRisk(scanCount: number, req: VerificationRequest) {
        let score = 0;
        if (scanCount > 0) score += 40;
        if (scanCount > 5) score += 40;

        // Simulating geo-mismatch
        if (req.location === "Unknown") score += 10;

        return { score: Math.min(score, 100) };
    }

    private static async logVerification(req: VerificationRequest, status: string, medicineId: string, pillId: string | null) {
        const statusMap: Record<string, VerificationStatus> = {
            GENUINE: "GENUINE",
            DUPLICATE: "DUPLICATE",
            SUSPICIOUS: "SUSPECTED",
            EXPIRED: "INVALID",
            FAKE: "INVALID"
        };

        const dbStatus = statusMap[status] ?? "INVALID";

        return await prisma.verificationLog.create({
            data: {
                userId: req.userId,
                pillId,
                code: req.code,
                type: req.code.startsWith("BOX-") ? "BOX" : (req.code.startsWith("CARTON-") ? "CARTON" : "PILL"),
                status: dbStatus,
                location: req.location,
                lat: req.lat,
                lng: req.lng,
                userAgent: req.deviceInfo,
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
            message: "WARNING: This medicine is NOT FOUND in the MediVerify blockchain ledger. DO NOT CONSUME."
        };
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

    // ─── Anomaly Detection ────────────────────────────────────────────────────────

    private static isAnomalous(batchNumber: string): { anomalous: boolean; reason: string; severity: "HIGH" | "MEDIUM" } {
        const parts = batchNumber.split("-");

        // a. Must have exactly 3 parts: PREFIX-YEAR-NUM
        if (parts.length !== 3) {
            return { anomalous: true, reason: "Invalid batch number format.", severity: "HIGH" };
        }

        const [, yearStr, numStr] = parts;
        const year = parseInt(yearStr, 10);
        const num = parseInt(numStr, 10);

        // c. Non-numeric year or sequence
        if (isNaN(year) || isNaN(num)) {
            return { anomalous: true, reason: "Invalid batch number format.", severity: "HIGH" };
        }

        const currentYear = new Date().getFullYear();

        // e. Future year
        if (year > currentYear) {
            return { anomalous: true, reason: "Batch year " + year + " is in the future — this batch could not exist yet.", severity: "HIGH" };
        }

        // f. Sequence number impossibly large
        if (num > 5000) {
            return { anomalous: true, reason: "Batch sequence number " + num + " is far outside the normal manufacturing range.", severity: "HIGH" };
        }

        // g. Sequence number zero
        if (num === 0) {
            return { anomalous: true, reason: "Batch sequence number cannot be zero.", severity: "HIGH" };
        }

        // h. Unusually old (> 6 years)
        if (year < currentYear - 6) {
            return { anomalous: true, reason: "Batch year " + year + " is unusually old — possible repackaged or expired stock.", severity: "MEDIUM" };
        }

        // i. Clean
        return { anomalous: false, reason: "", severity: "MEDIUM" };
    }

    // ─── Plain Batch Number Verification ─────────────────────────────────────────

    private static async verifyBatchNumber(req: VerificationRequest): Promise<VerificationResponse> {
        // a. Run anomaly checks first
        const check = this.isAnomalous(req.code);

        // b. Hard block on HIGH severity anomalies — no DB write needed
        if (check.anomalous && check.severity === "HIGH") {
            return this.handleFakeResult(req, "FAKE DETECTED: " + check.reason);
        }

        // d. Database lookup
        const batch = await prisma.batch.findUnique({
            where: { batchNumber: req.code },
            include: { medicine: { include: { manufacturer: true } } }
        });

        // e. Batch not found
        if (!batch) {
            if (check.anomalous) {
                // MEDIUM anomaly + not in DB
                return this.handleFakeResult(
                    req,
                    "SUSPICIOUS: " + check.reason + " Additionally, this batch was not found in the MediVerify database."
                );
            }
            return this.handleFakeResult(
                req,
                "This batch number was not found in the MediVerify database. The medicine may be unregistered — verify with DRAP."
            );
        }

        // f. Batch found — run identical logic to verifyBox()
        const now = new Date();
        const isExpired = batch.expiryDate < now;
        const isRecalled = batch.isRecalled;

        const scanCount = await prisma.verificationLog.count({
            where: { code: req.code }
        });

        const riskLevel = this.calculateRisk(scanCount, req);
        const resultType = isExpired
            ? "EXPIRED"
            : (isRecalled || riskLevel.score > 70)
                ? "SUSPICIOUS"
                : scanCount > 0
                    ? "DUPLICATE"
                    : "GENUINE";

        const log = await this.logVerification(req, resultType, batch.medicineId, null);

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
}
