import { createAPIFileRoute } from "@/lib/api-route-helper";
import { AuthService } from "@/server/services/auth.service";
import { ApiResponse } from "@/server/utils/api-response";

export const Route = createAPIFileRoute("/api/auth/signup")({
    POST: async ({ request }) => {
        try {
            const data = await request.json();
            const result = await AuthService.register(data);
            return Response.json(ApiResponse.success(result, "Signup successful."));
        } catch (error: any) {
            const status = error.statusCode || 400;
            return Response.json(ApiResponse.error(error.message, status), { status });
        }
    },
});
