import { createAPIFileRoute } from "@/lib/api-route-helper";
import { AdminService } from "@/server/services/admin/admin.service";
import { AnalyticsService } from "@/server/services/analytics/analytics.service";
import { authorizeRequest } from "@/server/middleware/auth.middleware";
import { ApiResponse } from "@/server/utils/api-response";

export const Route = createAPIFileRoute("/api/admin/dashboard")({
    GET: async ({ request }) => {
        try {
            await authorizeRequest(request, ["ADMIN", "SUPER_ADMIN", "DRAP_ADMIN", "REGULATOR"]);

            const metrics = await AdminService.getNationalRiskMetrics();
            const globalStats = await AnalyticsService.getGlobalFraudMetrics();

            return Response.json(ApiResponse.success({
                ...metrics,
                ...globalStats,
                lastUpdated: new Date()
            }));
        } catch (error: any) {
            return Response.json(ApiResponse.error(error.message, 401), { status: 401 });
        }
    },
});
