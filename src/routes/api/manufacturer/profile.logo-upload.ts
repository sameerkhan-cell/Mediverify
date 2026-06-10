import { createAPIFileRoute } from "@/lib/api-route-helper";
import { authorizeRequest } from "@/server/middleware/auth.middleware";
import { ManufacturerProfileService } from "@/server/services/manufacturer-profile.service";
import { ApiResponse } from "@/server/utils/api-response";

export const Route = createAPIFileRoute("/api/manufacturer/profile/logo-upload")({
    POST: async ({ request }: { request: Request }) => {
        try {
            const payload = await authorizeRequest(request, ["MANUFACTURER"]);
            const formData = await request.formData();
            const file = formData.get("logo");

            if (!file || !(file instanceof File)) {
                return Response.json(ApiResponse.error("No logo file provided.", 400), { status: 400 });
            }

            // Validate file size (2MB)
            if (file.size > 2 * 1024 * 1024) {
                return Response.json(ApiResponse.error("File size exceeds 2MB limit.", 400), { status: 400 });
            }

            // Validate mime type
            const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
            if (!allowedTypes.includes(file.type)) {
                return Response.json(ApiResponse.error("Invalid file format. Supported: PNG, JPG, JPEG, WEBP.", 400), { status: 400 });
            }

            const logoUrl = await ManufacturerProfileService.uploadLogo(payload.userId, file);

            return Response.json(ApiResponse.success({ logoUrl }, "Logo uploaded successfully."));
        } catch (error: any) {
            const status = error.statusCode || 500;
            return Response.json(ApiResponse.error(error.message, status), { status });
        }
    },
});
