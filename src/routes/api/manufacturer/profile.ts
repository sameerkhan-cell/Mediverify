import { createAPIFileRoute } from "@/lib/api-route-helper";
import { authorizeRequest } from "@/server/middleware/auth.middleware";
import { ManufacturerProfileService } from "@/server/services/manufacturer-profile.service";
import { ApiResponse } from "@/server/utils/api-response";

export const Route = createAPIFileRoute("/api/manufacturer/profile")({
    GET: async ({ request }: { request: Request }) => {
        try {
            const payload = await authorizeRequest(request, ["MANUFACTURER"]);
            const profile = await ManufacturerProfileService.getProfile(payload.userId);
            return Response.json(ApiResponse.success(profile, "Profile loaded."));
        } catch (error: any) {
            const status = error.statusCode || 500;
            return Response.json(ApiResponse.error(error.message, status), { status });
        }
    },

    PUT: async ({ request }: { request: Request }) => {
        try {
            const payload = await authorizeRequest(request, ["MANUFACTURER"]);
            const body = await request.json();
            const profile = await ManufacturerProfileService.updateProfile(
                payload.userId,
                body
            );
            return Response.json(ApiResponse.success(profile, "Profile updated successfully."));
        } catch (error: any) {
            const status = error.statusCode || 500;
            return Response.json(ApiResponse.error(error.message, status), { status });
        }
    },
});
