import { createAPIFileRoute } from "@/lib/api-route-helper";
import { VerificationEngine } from "@/server/services/verification.service";
import { VerificationSchemas } from "@/server/validation/schemas";
import { ApiResponse } from "@/server/utils/api-response";
import { JwtService } from "@/server/auth/jwt.service";

export const Route = createAPIFileRoute("/api/verify")({
    POST: async ({ request }) => {
        try {
            const body = await request.json();
            const validatedData = VerificationSchemas.verify.parse(body);

            // Optional Auth (for history tracking)
            let userId: string | undefined;
            const authHeader = request.headers.get("Authorization");
            if (authHeader?.startsWith("Bearer ")) {
                try {
                    const payload = JwtService.verifyAccessToken(authHeader.split(" ")[1]);
                    userId = payload.userId;
                } catch (e) {
                    // Public verify, don't throw
                }
            }

            const result = await VerificationEngine.verify({
                ...validatedData,
                userId,
                deviceInfo: request.headers.get("user-agent") || "Web"
            });

            return Response.json(ApiResponse.success(result, "Verification complete."));
        } catch (error: any) {
            const status = error.statusCode || 400;
            return Response.json(ApiResponse.error(error.message || "Verification service error", status), { status });
        }
    },
});
