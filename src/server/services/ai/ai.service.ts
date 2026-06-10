import { prisma } from "../../db/client";

export class AIService {
    /**
     * Predictive Fraud Outbreak Detection
     * Analyzes recent clusters of suspicious activity to forecast future outbreaks.
     */
    static async predictFraudOutbreak(region: string) {
        const recentAlerts = await prisma.fraudAlert.count({
            where: {
                region,
                createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }
        });

        const confidence = Math.min(recentAlerts * 10, 95);
        const riskLevel = recentAlerts > 5 ? "CRITICAL" : recentAlerts > 2 ? "HIGH" : "LOW";

        if (recentAlerts > 3) {
            await prisma.aIInsight.create({
                data: {
                    insightType: "OUTBREAK_PREDICTION",
                    severity: riskLevel,
                    prediction: `High probability of a counterfeit medicine outbreak in ${region}. Cluster detected.`,
                    confidenceScore: confidence,
                    region
                }
            });
        }

        return { confidence, riskLevel, recentAlerts };
    }

    static async calculateDynamicRisk(entityId: string, entityType: "PHARMACY" | "MEDICINE") {
        // Dynamic risk calculation based on multi-factor analysis
        const riskData = await prisma.riskScore.findFirst({
            where: { entityId, entityType }
        });

        const historicalAlerts = await prisma.fraudAlert.count({
            where: { OR: [{ pharmacyId: entityId }, { medicineId: entityId }] }
        });

        const baseScore = riskData?.score || 0;
        const dynamicScore = Math.min(baseScore + (historicalAlerts * 5), 100);

        return {
            score: dynamicScore,
            level: dynamicScore > 75 ? "HIGH" : dynamicScore > 50 ? "SUSPICIOUS" : "SAFE",
            timestamp: new Date()
        };
    }

    static async generateRecommendations(region: string) {
        const insights = await prisma.aIInsight.findMany({
            where: { region },
            orderBy: { createdAt: "desc" },
            take: 3
        });

        return insights.map((i: any) => ({
            type: i.insightType,
            suggestion: i.prediction,
            confidence: i.confidenceScore
        }));
    }
}
