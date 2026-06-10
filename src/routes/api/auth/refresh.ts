import { createAPIFileRoute } from "@/lib/api-route-helper";
import { AuthService } from "@/server/services/auth.service";
import { ApiResponse } from "@/server/utils/api-response";

export const Route = createAPIFileRoute("/api/auth/refresh")({
    POST: async ({ request }) => {
        try {
            const { refreshToken } = await request.json();
            if (!refreshToken) return Response.json(ApiResponse.error("Refresh token missing", 400), { status: 400 });

            const result = await AuthService.refresh(refreshToken);

            return Response.json(ApiResponse.success(result));
        } catch (error: any) {
            return Response.json(ApiResponse.error("Invalid or expired session", 401), { status: 401 });
        }
    },
});
