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
}

export class VerificationEngine {
    static async verify(req: VerificationRequest): Promise<VerificationResponse> {
        const { code } = req;

        if (code.startsWith("BOX-")) {
            return this.verifyBox(req);
        } else if (code.startsWith("PILL-")) {
            return this.verifyPill(req);
        } else {
            return this.handleFakeResult(req, "Malformed QR code format.");
        }
    }

    private static async verifyBox(req: VerificationRequest): Promise<VerificationResponse> {
        const batch = await prisma.batch.findUnique({
            where: { batchNumber: req.code.split("-")[1] }, // BOX-{BatchNumber}-...
            include: { medicine: { include: { manufacturer: true } } }
        });

        if (!batch) return this.handleFakeResult(req, "Batch not found in regulatory ledger.");

        const now = new Date();
        const isExpired = batch.expiryDate < now;
        const isRecalled = batch.isRecalled;

        // Check for duplicates (Multiple scans of the same BOX QR)
        const scanCount = await prisma.verificationLog.count({
            where: { code: req.code }
        });

        const riskLevel = this.calculateRisk(scanCount, req);
        const resultType = isExpired ? "EXPIRED" : (isRecalled || riskLevel.score > 70) ? "SUSPICIOUS" : scanCount > 0 ? "DUPLICATE" : "GENUINE";

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

    private static async verifyPill(req: VerificationRequest): Promise<VerificationResponse> {
        const pill = await prisma.pill.findUnique({
            where: { qrCode: req.code },
            include: { batch: { include: { medicine: { include: { manufacturer: true } } } } }
        });

        if (!pill) return this.handleFakeResult(req, "Individual pill identifier not found.");

        const now = new Date();
        const isExpired = pill.batch.expiryDate < now;
        const isRecalled = pill.batch.isRecalled;
        const isInvalidated = pill.status === "INVALIDATED";

        // Duplicate detection
        const scanCount = await prisma.verificationLog.count({
            where: { code: req.code, status: "GENUINE" }
        });

        const riskLevel = this.calculateRisk(scanCount, req);
        const resultType = isExpired ? "EXPIRED" : (isRecalled || isInvalidated || riskLevel.score > 70) ? "SUSPICIOUS" : scanCount > 0 ? "DUPLICATE" : "GENUINE";

        const log = await this.logVerification(req, resultType, pill.batch.medicineId, pill.id);

        // Async anchor to blockchain
        BlockchainService.anchorVerification(req.code, req.location || "Unknown", resultType).catch(console.error);

        // Real-time events
        RealtimeService.broadcastVerification({ ...log, status: resultType });

        // AI background processing
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
            warnings: this.generateWarnings(resultType, isRecalled, isExpired, riskLevel.score),
            riskScore: riskLevel.score,
            message: this.generateMessage(resultType, pill.batch.medicine.name, pill.pillNumber)
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
        return await prisma.verificationLog.create({
            data: {
                userId: req.userId,
                pillId,
                code: req.code,
                type: req.code.startsWith("BOX-") ? "BOX" : "PILL",
                status: status as VerificationStatus,
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
}
