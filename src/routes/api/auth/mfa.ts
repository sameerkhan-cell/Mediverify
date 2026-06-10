import { createAPIFileRoute } from "@/lib/api-route-helper";
import { AuthService } from "@/server/services/auth.service";
import { ApiResponse } from "@/server/utils/api-response";

export const Route = createAPIFileRoute("/api/auth/mfa")({
    POST: async ({ request }: { request: Request }) => {
        try {
            const { email, code } = await request.json();

            if (!email || !code) {
                return Response.json(ApiResponse.error("Email and verification code are required.", 400), { status: 400 });
            }

            const authResponse = await AuthService.verifyMfa(email, code);
            return Response.json(ApiResponse.success(authResponse, "Verification successful"));
        } catch (error: any) {
            const status = error.statusCode || 401;
            return Response.json(ApiResponse.error(error.message, status), { status });
        }
    },
});
