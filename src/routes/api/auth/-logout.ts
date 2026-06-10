import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@/lib/api-route-helper";

export const APIRoute = createAPIFileRoute("/api/auth/logout")({
  POST: async () => {
    // In production: invalidate the session/token from the DB
    return json({ success: true, message: "Logged out successfully." });
  },
});
