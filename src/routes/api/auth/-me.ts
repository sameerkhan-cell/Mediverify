import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@/lib/api-route-helper";

export const APIRoute = createAPIFileRoute("/api/auth/me")({
  GET: async ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized." }, { status: 401 });
    }
    // In production: verify token, fetch user from DB
    return json({ success: true, message: "Token valid." });
  },
});
