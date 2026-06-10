import { createAPIFileRoute } from "@/lib/api-route-helper";
import { AuthService } from "@/server/services/auth.service";
import { authorizeRequest } from "@/server/middleware/auth.middleware";
import { ApiResponse } from "@/server/utils/api-response";

export const Route = createAPIFileRoute("/api/auth/change-password")({
    POST: async ({ request }: { request: Request }) => {
        try {
            const payload = await authorizeRequest(request);
            const data = await request.json();

            if (!data.currentPassword || !data.newPassword) {
                return Response.json(ApiResponse.error("Missing current or new password.", 400), { status: 400 });
            }

            await AuthService.changePassword(payload.userId, {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            });

            return Response.json(ApiResponse.success(null, "Password updated successfully."));
        } catch (error: any) {
            const status = error.statusCode || 500;
            return Response.json(ApiResponse.error(error.message, status), { status });
        }
    },
});
