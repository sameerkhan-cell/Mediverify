import { createAPIFileRoute } from "@/lib/api-route-helper";
import { prisma } from "@/server/db/client";
import { authorizeRequest } from "@/server/middleware/auth.middleware";
import { MfaService } from "@/server/services/mfa.service";
import { ApiResponse } from "@/server/utils/api-response";

export const Route = createAPIFileRoute("/api/manufacturer/verify-company-otp")({
    POST: async ({ request }: { request: Request }) => {
        try {
            const payload = await authorizeRequest(request, ["MANUFACTURER"]);
            const body = await request.json();
            const { otp } = body;

            if (!otp) {
                return Response.json(ApiResponse.error("Verification code is required.", 400), { status: 400 });
            }

            const isValid = await MfaService.verifyOtp(payload.userId, otp);

            if (!isValid) {
                return Response.json(ApiResponse.error("Invalid or expired verification code.", 400), { status: 400 });
            }

            // Finalize verification
            const updatedManufacturer = await prisma.manufacturer.update({
                where: { userId: payload.userId },
                data: {
                    verificationStatus: "VERIFIED",
                    isVerified: true,
                    verifiedAt: new Date()
                } as any
            });

            return Response.json(
                ApiResponse.success(
                    { manufacturer: updatedManufacturer, isVerified: true },
                    "Company verified successfully. You now have full access to the dashboard."
                )
            );
        } catch (error: any) {
            const status = error.statusCode || 500;
            return Response.json(ApiResponse.error(error.message, status), { status });
        }
    },
});
