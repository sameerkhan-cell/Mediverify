import { prisma } from "../../db/client";
import { ApiError } from "../../utils/api-response";

export class AdminService {
    static async issueRecall(adminId: string, data: any) {
        const { batchId, medicineId, severity, reason, regions } = data;

        return await prisma.$transaction(async (tx: any) => {
            // 1. Mark Batch as Recalled
            if (batchId) {
                await tx.batch.update({
                    where: { id: batchId },
                    data: { isRecalled: true, recallReason: reason }
                });
            }

            // 2. Create Recall Notice
            const recall = await tx.recall.create({
                data: {
                    batchId,
                    medicineId,
                    severity,
                    reason,
                    regions,
                    issuedBy: adminId,
                }
            });

            // 3. Log Admin Action
            await tx.adminActionLog.create({
                data: {
                    adminId,
                    actionType: "RECALL",
                    targetType: batchId ? "BATCH" : "MEDICINE",
                    targetId: batchId || medicineId,
                    metadata: JSON.stringify(data)
                }
            });

            return recall;
        });
    }

    static async blacklistPharmacy(adminId: string, pharmacyId: string, reason: string) {
        return await prisma.$transaction(async (tx: any) => {
            await tx.pharmacy.update({
                where: { id: pharmacyId },
                data: { isBlacklisted: true }
            });

            await tx.adminActionLog.create({
                data: {
                    adminId,
                    actionType: "BLACKLIST",
                    targetType: "PHARMACY",
                    targetId: pharmacyId,
                    metadata: JSON.stringify({ reason })
                }
            });
        });
    }

    static async getNationalRiskMetrics() {
        const activeRecalls = await prisma.recall.count({ where: { status: "ACTIVE" } });
        const blacklistedPharmacies = await prisma.pharmacy.count({ where: { isBlacklisted: true } });
        const topRiskRegions = await prisma.verificationLog.groupBy({
            by: ['location'],
            where: { status: { not: "GENUINE" } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5
        });

        return {
            activeRecalls,
            blacklistedPharmacies,
            topRiskRegions,
            last24hScans: await prisma.verificationLog.count({
                where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
            })
        };
    }
}
