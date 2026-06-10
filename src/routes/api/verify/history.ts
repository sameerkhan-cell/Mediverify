import { createAPIFileRoute } from "@/lib/api-route-helper";
import { prisma } from "@/server/db/client";
import { authorizeRequest } from "@/server/middleware/auth.middleware";
import { ApiResponse } from "@/server/utils/api-response";

export const Route = createAPIFileRoute("/api/verify/history")({
    GET: async ({ request }) => {
        try {
            const payload = await authorizeRequest(request);

            const history = await prisma.verificationLog.findMany({
                where: { userId: payload.userId },
                include: {
                    pill: { include: { batch: { include: { medicine: true } } } }
                },
                orderBy: { createdAt: "desc" },
                take: 20
            });

            return Response.json(ApiResponse.success(history));
        } catch (error: any) {
            const status = error.statusCode || 401;
            return Response.json(ApiResponse.error(error.message, status), { status });
        }
    },
});
