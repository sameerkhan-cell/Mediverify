import { createAPIFileRoute } from "@/lib/api-route-helper";
import { AuthService } from "@/server/services/auth.service";
import { authorizeRequest } from "@/server/middleware/auth.middleware";
import { ApiResponse } from "@/server/utils/api-response";

export const Route = createAPIFileRoute("/api/auth/profile")({
    PATCH: async ({ request }: { request: Request }) => {
        try {
            const payload = await authorizeRequest(request);
            const data = await request.json();

            const updatedUser = await AuthService.updateProfile(payload.userId, data);
            return Response.json(ApiResponse.success(updatedUser, "Profile updated successfully."));
        } catch (error: any) {
            const status = error.statusCode || 500;
            return Response.json(ApiResponse.error(error.message, status), { status });
        }
    },
});
