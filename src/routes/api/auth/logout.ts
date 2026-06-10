import { createAPIFileRoute } from "@/lib/api-route-helper";
import { AuthService } from "@/server/services/auth.service";
import { ApiResponse } from "@/server/utils/api-response";

export const Route = createAPIFileRoute("/api/auth/logout")({
    POST: async ({ request }: { request: Request }) => {
        try {
            const authHeader = request.headers.get("Authorization");
            const token = authHeader?.split(" ")[1];

            if (token) {
                await AuthService.logout(token);
            }

            return Response.json(ApiResponse.success(null, "Logged out successfully."));
        } catch (error: any) {
            return Response.json(ApiResponse.success(null, "Logged out successfully.")); // Still success
        }
    },
});
