import { createAPIFileRoute } from "@/lib/api-route-helper";
import { prisma } from "@/server/db/client";
import { ApiResponse } from "@/server/utils/api-response";
import { MonitoringService } from "@/server/services/monitoring/monitoring.service";

export interface DatabaseHealthResponse {
    success: boolean;
    database: "connected" | "disconnected" | "error";
    stats: {
        users: number;
        medicines: number;
        pills: number;
        verification_logs: number;
        fraud_alerts: number;
    };
    timestamp: string;
}

export const Route = createAPIFileRoute("/api/health/database")({
    GET: async () => {
        try {
            // 1. Connection Check
            await prisma.$queryRaw`SELECT 1`;

            // 2. Aggregate Stats
            const [users, medicines, pills, logs, alerts] = await Promise.all([
                prisma.user.count(),
                prisma.medicine.count(),
                prisma.pill.count(),
                prisma.verificationLog.count(),
                prisma.fraudAlert.count()
            ]);

            const healthData: DatabaseHealthResponse = {
                success: true,
                database: "connected",
                stats: {
                    users,
                    medicines,
                    pills,
                    verification_logs: logs,
                    fraud_alerts: alerts
                },
                timestamp: new Date().toISOString()
            };

            MonitoringService.logEvent("INFO", "HEALTH", "Database health check passed.");

            return Response.json(healthData);
        } catch (error: any) {
            MonitoringService.logEvent("ERROR", "HEALTH", "Database health check failed.", { error: error.message });

            return Response.json({
                success: false,
                database: "error",
                message: "Unable to connect to database",
                error: error.message,
                timestamp: new Date().toISOString()
            }, { status: 503 });
        }
    },
});
