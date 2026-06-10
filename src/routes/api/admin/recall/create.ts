import { createAPIFileRoute } from "@/lib/api-route-helper";
import { AdminService } from "@/server/services/admin/admin.service";
import { authorizeRequest } from "@/server/middleware/auth.middleware";
import { ApiResponse } from "@/server/utils/api-response";

export const Route = createAPIFileRoute("/api/admin/recall/create" as any)({
    POST: async ({ request }) => {
        try {
            const payload = await authorizeRequest(request, ["ADMIN", "DRAP_ADMIN", "REGULATOR"]);
            const body = await request.json();

            const recall = await AdminService.issueRecall(payload.userId, body);

            return Response.json(ApiResponse.success(recall, "National emergency recall issued."));
        } catch (error: any) {
            return Response.json(ApiResponse.error(error.message, 400), { status: 400 });
        }
    },
});
