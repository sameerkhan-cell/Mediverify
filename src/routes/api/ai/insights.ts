import { createAPIFileRoute } from "@/lib/api-route-helper";
import { AIService } from "@/server/services/ai/ai.service";
import { authorizeRequest } from "@/server/middleware/auth.middleware";
import { ApiResponse } from "@/server/utils/api-response";

export const Route = createAPIFileRoute("/api/ai/insights")({
    GET: async ({ request }) => {
        try {
            await authorizeRequest(request, ["ADMIN", "REGULATOR", "DRAP_ADMIN"]);
            const { region } = Object.fromEntries(new URL(request.url).searchParams);

            const recommendations = await AIService.generateRecommendations(region || "National");

            return Response.json(ApiResponse.success(recommendations));
        } catch (error: any) {
            return Response.json(ApiResponse.error(error.message, 401), { status: 401 });
        }
    },
});
