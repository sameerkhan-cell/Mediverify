import { createAPIFileRoute } from "@/lib/api-route-helper";
import { authorizeRequest } from "@/server/middleware/auth.middleware";
import { ManufacturerDocumentService } from "@/server/services/manufacturer-document.service";
import { ApiResponse } from "@/server/utils/api-response";

export const Route = createAPIFileRoute("/api/manufacturer/documents/upload")({
    POST: async ({ request }: { request: Request }) => {
        try {
            const payload = await authorizeRequest(request, ["MANUFACTURER"]);
            const body = await request.json();
            const document = await ManufacturerDocumentService.uploadDocument(
                payload.userId,
                body
            );
            return Response.json(
                ApiResponse.success(document, "Document uploaded successfully.")
            );
        } catch (error: any) {
            const status = error.statusCode || 500;
            return Response.json(ApiResponse.error(error.message, status), { status });
        }
    },
});
