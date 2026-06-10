import { createAPIFileRoute } from "@/lib/api-route-helper";

export const Route = createAPIFileRoute("/api/health")({
    GET: async () => {
        console.log("[API] Health check called");
        return new Response(JSON.stringify({ status: "UP" }), {
            headers: { "Content-Type": "application/json" }
        });
    },
});
