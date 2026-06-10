import { createAPIFileRoute } from "@/lib/api-route-helper";
import { prisma } from "@/server/db/client";
import { authorizeRequest } from "@/server/middleware/auth.middleware";
import { MfaService } from "@/server/services/mfa.service";
import { ApiResponse } from "@/server/utils/api-response";

export const Route = createAPIFileRoute("/api/manufacturer/send-company-otp")({
    POST: async ({ request }: { request: Request }) => {
        try {
            const payload = await authorizeRequest(request, ["MANUFACTURER"]);
            const body = await request.json();
            const { businessEmail } = body as { businessEmail?: string };

            if (!businessEmail) {
                return Response.json(ApiResponse.error("Business email is required.", 400), { status: 400 });
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(businessEmail)) {
                return Response.json(ApiResponse.error("Please provide a valid business email.", 400), { status: 400 });
            }

            await prisma.manufacturer.update({
                where: { userId: payload.userId },
                data: {
                    businessEmail,
                    verificationStatus: "PENDING",
                    isVerified: false,
                } as any
            });

            await MfaService.generateAndSendOtp(payload.userId, businessEmail);

            return Response.json(
                ApiResponse.success(
                    { email: businessEmail },
                    "Verification code sent to your business email."
                )
            );
        } catch (error: any) {
            const status = error.statusCode || 500;
            return Response.json(ApiResponse.error(error.message, status), { status });
        }
    },
});
