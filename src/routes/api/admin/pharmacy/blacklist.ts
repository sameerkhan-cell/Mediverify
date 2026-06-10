import { createAPIFileRoute } from "@/lib/api-route-helper";
import { AdminService } from "@/server/services/admin/admin.service";
import { authorizeRequest } from "@/server/middleware/auth.middleware";
import { ApiResponse } from "@/server/utils/api-response";

export const Route = createAPIFileRoute("/api/admin/pharmacy/blacklist" as any)({
    POST: async ({ request }) => {
        try {
            const payload = await authorizeRequest(request, ["ADMIN", "DRAP_ADMIN"]);
            const { pharmacyId, reason } = await request.json();

            await AdminService.blacklistPharmacy(payload.userId, pharmacyId, reason);

            return Response.json(ApiResponse.success(null, "Pharmacy blacklisted and access revoked."));
        } catch (error: any) {
            return Response.json(ApiResponse.error(error.message, 400), { status: 400 });
        }
    },
});
