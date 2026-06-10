import { createAPIFileRoute } from "@/lib/api-route-helper";
import { authorizeRequest } from "@/server/middleware/auth.middleware";
import { ManufacturerDocumentService } from "@/server/services/manufacturer-document.service";
import { ApiResponse } from "@/server/utils/api-response";

export const Route = createAPIFileRoute("/api/manufacturer/documents/$id")({
    GET: async ({ request, params }: { request: Request; params: { id: string } }) => {
        try {
            const payload = await authorizeRequest(request, ["MANUFACTURER"]);
            const url = new URL(request.url);
            const page = Number(url.searchParams.get("page") ?? "1");
            const limit = Number(url.searchParams.get("limit") ?? "50");
            const document = await ManufacturerDocumentService.getDocument(
                payload.userId,
                params.id,
                payload.role,
                { page, limit }
            );
            return Response.json(ApiResponse.success(document, "Document loaded."));
        } catch (error: any) {
            const status = error.statusCode || 500;
            return Response.json(ApiResponse.error(error.message, status), { status });
        }
    },

    DELETE: async ({ request, params }: { request: Request; params: { id: string } }) => {
        try {
            const payload = await authorizeRequest(request, ["MANUFACTURER"]);
            const result = await ManufacturerDocumentService.softDeleteDocument(
                payload.userId,
                params.id
            );
            return Response.json(ApiResponse.success(result, result.message));
        } catch (error: any) {
            const status = error.statusCode || 500;
            return Response.json(ApiResponse.error(error.message, status), { status });
        }
    },
});
