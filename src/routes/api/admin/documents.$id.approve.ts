import { createAPIFileRoute } from "@/lib/api-route-helper";
import { authorizeRequest } from "@/server/middleware/auth.middleware";
import { ManufacturerDocumentService } from "@/server/services/manufacturer-document.service";
import { ApiResponse } from "@/server/utils/api-response";

export const Route = createAPIFileRoute("/api/admin/documents/$id/approve")({
    PUT: async ({ request, params }: { request: Request; params: { id: string } }) => {
        try {
            const payload = await authorizeRequest(request, [
                "ADMIN",
                "SUPER_ADMIN",
                "DRAP_ADMIN",
                "REGULATOR",
            ]);
            const body = await request.json().catch(() => ({}));
            const document = await ManufacturerDocumentService.adminApprove(
                payload.userId,
                params.id,
                body
            );
            return Response.json(ApiResponse.success(document, "Document approved."));
        } catch (error: any) {
            const status = error.statusCode || 500;
            return Response.json(ApiResponse.error(error.message, status), { status });
        }
    },
});
