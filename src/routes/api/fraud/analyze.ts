import { createAPIFileRoute } from "@/lib/api-route-helper";
import { FraudEngine } from "@/server/services/fraud/fraud-engine";
import { ApiResponse } from "@/server/utils/api-response";
import { authorizeRequest } from "@/server/middleware/auth.middleware";

export const Route = createAPIFileRoute("/api/fraud/analyze")({
    POST: async ({ request }) => {
        try {
            // Only authenticated users (any role) can trigger fraud analysis
            await authorizeRequest(request, [
                "PATIENT",
                "PHARMACY",
                "MANUFACTURER",
                "REGULATOR",
                "ADMIN",
                "SUPER_ADMIN",
                "DRAP_ADMIN",
                "FRAUD_ANALYST",
                "AUDITOR",
            ]);

            const { qrCode, location, metadata } = await request.json();

            if (!qrCode || typeof qrCode !== "string") {
                return Response.json(
                    ApiResponse.error("qrCode is required.", 400),
                    { status: 400 }
                );
            }

            const analysis = await FraudEngine.analyzeScan(
                qrCode,
                location,
                metadata
            );

            return Response.json(ApiResponse.success(analysis));
        } catch (error: any) {
            const status = error.statusCode || 500;
            return Response.json(
                ApiResponse.error(error.message || "Fraud analysis failed.", status),
                { status }
            );
        }
    },
});
