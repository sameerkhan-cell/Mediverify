import { createAPIFileRoute } from "@/lib/api-route-helper";
import { FraudEngine } from "@/server/services/fraud/fraud-engine";
import { ApiResponse } from "@/server/utils/api-response";

export const Route = createAPIFileRoute("/api/fraud/analyze")({
    POST: async ({ request }) => {
        try {
            const { qrCode, location, metadata } = await request.json();

            const analysis = await FraudEngine.analyzeScan(qrCode, location, metadata);

            return Response.json(ApiResponse.success(analysis));
        } catch (error: any) {
            return Response.json(ApiResponse.error(error.message, 500), { status: 500 });
        }
    },
});
