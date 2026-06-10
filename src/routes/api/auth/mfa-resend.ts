import { createAPIFileRoute } from "@/lib/api-route-helper";
import { prisma } from "@/server/db/client";
import { MfaService } from "@/server/services/mfa.service";
import { ApiResponse } from "@/server/utils/api-response";

export const Route = createAPIFileRoute("/api/auth/mfa-resend")({
    POST: async ({ request }: { request: Request }) => {
        try {
            const { email } = await request.json();

            if (!email) {
                return Response.json(ApiResponse.error("Email is required.", 400), { status: 400 });
            }

            const normalizedEmail = String(email).trim().toLowerCase();
            const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
            if (!user) {
                return Response.json(ApiResponse.error("User not found.", 404), { status: 404 });
            }

            const delivery = await MfaService.generateAndSendOtp(user.id, user.email);

            return Response.json(
                ApiResponse.success(
                    { emailed: delivery.emailed, email: user.email },
                    delivery.message
                )
            );
        } catch (error: any) {
            const status = error.statusCode || 400;
            return Response.json(ApiResponse.error(error.message, status), { status });
        }
    },
});

