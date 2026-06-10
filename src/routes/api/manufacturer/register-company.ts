import { createAPIFileRoute } from "@/lib/api-route-helper";
import { prisma } from "@/server/db/client";
import { authorizeRequest } from "@/server/middleware/auth.middleware";
import { MfaService } from "@/server/services/mfa.service";
import { ApiResponse } from "@/server/utils/api-response";

export const Route = createAPIFileRoute("/api/manufacturer/register-company")({
    POST: async ({ request }: { request: Request }) => {
        try {
            const payload = await authorizeRequest(request, ["MANUFACTURER"]);
            const body = await request.json();
            const { taxId, registrationNumber, businessAddress, businessPhone, businessEmail, website } = body;

            if (!taxId || !registrationNumber || !businessAddress || !businessEmail) {
                return Response.json(ApiResponse.error("Tax ID, Registration Number, Business Address, and Business Email are required.", 400), { status: 400 });
            }

            const updatedManufacturer = await prisma.manufacturer.update({
                where: { userId: payload.userId },
                data: {
                    taxId,
                    registrationNumber,
                    address: businessAddress,
                    businessPhone,
                    businessEmail,
                    website,
                    verificationStatus: "PENDING",
                    isVerified: false,
                } as any
            });

            // Generate and send OTP for company verification
            await MfaService.generateAndSendOtp(payload.userId, businessEmail);

            console.log(`[COMPANY VERIFICATION] OTP triggered for ${businessEmail}`);

            return Response.json(ApiResponse.success({
                manufacturer: updatedManufacturer,
                email: businessEmail
            }, "Company details saved. A verification code has been sent to your business email."));
        } catch (error: any) {
            const status = error.statusCode || 500;
            return Response.json(ApiResponse.error(error.message, status), { status });
        }
    },
});
