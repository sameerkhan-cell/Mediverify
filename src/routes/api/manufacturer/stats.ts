/**
 * GET /api/manufacturer/stats
 *
 * Returns aggregated dashboard statistics for the authenticated manufacturer:
 *   - totalMedicines
 *   - totalBatches
 *   - totalPillsGenerated
 *   - activeBatches
 *   - expiredBatches
 *   - recalledBatches
 */
import { createAPIFileRoute } from "@/lib/api-route-helper";
import { BatchService } from "@/server/services/manufacturer/batch.service";
import { authorizeRequest } from "@/server/middleware/auth.middleware";
import { ApiResponse } from "@/server/utils/api-response";

export const Route = createAPIFileRoute("/api/manufacturer/stats")({
    GET: async ({ request }: { request: Request }) => {
        try {
            const payload = await authorizeRequest(request, ["MANUFACTURER"]);
            const stats = await BatchService.getDashboardStats(payload.userId);
            return Response.json(ApiResponse.success(stats));
        } catch (error: any) {
            const status = error.statusCode || 401;
            return Response.json(ApiResponse.error(error.message, status), { status });
        }
    },
});
