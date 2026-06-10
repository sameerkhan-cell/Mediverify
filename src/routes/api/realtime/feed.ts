import { createAPIFileRoute } from "@/lib/api-route-helper";
import { RealtimeService } from "@/server/services/realtime/realtime.service";
import { ApiResponse } from "@/server/utils/api-response";

export const Route = createAPIFileRoute("/api/realtime/feed")({
    GET: async () => {
        try {
            const feed = await RealtimeService.getLiveFeed();
            return Response.json(ApiResponse.success(feed));
        } catch (e) {
            return Response.json(ApiResponse.error("Failed to fetch live feed", 500));
        }
    },
});
