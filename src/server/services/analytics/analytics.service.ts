import { prisma } from "../../db/client";

export class AnalyticsService {
    static async getGlobalFraudMetrics() {
        const totalScans = await prisma.verificationLog.count();
        const duplicateScans = await prisma.verificationLog.count({
            where: { status: "DUPLICATE" }
        });
        const fakeMedicines = await prisma.verificationLog.count({
            where: { status: "INVALID" }
        });
        const suspiciousScans = await prisma.fraudAlert.count({
            where: { severity: { in: ["HIGH", "CRITICAL"] } }
        });

        const regionalStats = await prisma.verificationLog.groupBy({
            by: ['location'],
            _count: { id: true },
            where: { status: { not: "GENUINE" } }
        });

        return {
            counters: {
                totalScans,
                duplicateScans,
                fakeMedicines,
                suspiciousScans,
                fraudRatio: totalScans > 0 ? (duplicateScans + fakeMedicines) / totalScans : 0
            },
            regionalStats
        };
    }
}
