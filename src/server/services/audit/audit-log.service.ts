import { prisma } from "../../db/client";

export type AuditAction =
    | "BATCH_CREATED"
    | "QR_GENERATED"
    | "PDF_EXPORTED"
    | "ZIP_EXPORTED"
    | "ASSETS_DOWNLOADED";

export interface AuditLogEntry {
    manufacturerId: string;
    batchId?: string;
    action: AuditAction;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}

export class AuditLogService {
    /**
     * Record a single audit event.
     */
    static async log(entry: AuditLogEntry): Promise<void> {
        try {
            await prisma.auditLog.create({
                data: {
                    manufacturerId: entry.manufacturerId,
                    batchId: entry.batchId ?? null,
                    action: entry.action,
                    metadata: entry.metadata
                        ? JSON.stringify(entry.metadata)
                        : null,
                    ipAddress: entry.ipAddress ?? null,
                    userAgent: entry.userAgent ?? null,
                },
            });
        } catch (err) {
            // Audit failures must never crash business logic
            console.error("[AuditLog] Failed to record event:", err);
        }
    }

    /**
     * Retrieve audit logs for a manufacturer (last 200 events).
     */
    static async getManufacturerLogs(manufacturerId: string) {
        return prisma.auditLog.findMany({
            where: { manufacturerId },
            orderBy: { createdAt: "desc" },
            take: 200,
        });
    }

    /**
     * Retrieve audit logs for a specific batch.
     */
    static async getBatchLogs(batchId: string) {
        return prisma.auditLog.findMany({
            where: { batchId },
            orderBy: { createdAt: "desc" },
        });
    }
}
