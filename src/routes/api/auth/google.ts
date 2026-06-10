import { createAPIFileRoute } from "@/lib/api-route-helper";
import { AuthService } from "@/server/services/auth.service";
import { ApiResponse } from "@/server/utils/api-response";

export const Route = createAPIFileRoute("/api/auth/google")({
    POST: async ({ request }: { request: Request }) => {
        try {
            const { idToken, role } = await request.json();
            const userAgent = request.headers.get("user-agent") || undefined;
            const ipAddress = request.headers.get("x-forwarded-for") || undefined;

            if (!idToken) {
                return Response.json(ApiResponse.error("Google ID token is required.", 400), { status: 400 });
            }

            const result = await AuthService.googleLogin(idToken, { role, userAgent, ipAddress });
            return Response.json(ApiResponse.success(result, "Google login successful."));
        } catch (error: any) {
            const status = error.statusCode || 401;
            console.error("[GOOGLE_AUTH_API_ERROR]", error);
            return Response.json(ApiResponse.error(error.message, status), { status });
        }
    },
});
