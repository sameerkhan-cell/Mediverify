import { createAPIFileRoute } from "@/lib/api-route-helper";
import { prisma } from "@/server/db/client";
import { authorizeRequest } from "@/server/middleware/auth.middleware";
import { ApiResponse } from "@/server/utils/api-response";

export const Route = createAPIFileRoute("/api/pharmacy/scan-logs")({
    GET: async ({ request }) => {
        try {
            const payload = await authorizeRequest(request, ["PHARMACY"]);
            const pharmacy = await prisma.pharmacy.findUnique({ where: { userId: payload.userId } });
            if (!pharmacy) return Response.json(ApiResponse.error("Pharmacy profile not found", 404), { status: 404 });

            const logs = await prisma.verificationLog.findMany({
                where: {
                    OR: [
                        { code: { startsWith: "BOX-" } },
                        { code: { startsWith: "CARTON-" } },
                        { code: { startsWith: "PILL-" } }
                    ]
                },
                orderBy: { createdAt: "desc" },
                take: 20,
                include: {
                    pill: { include: { batch: { include: { medicine: true } } } }
                }
            });
            return Response.json(ApiResponse.success(logs));
        } catch (err: any) {
            const status = err.statusCode || 500;
            return Response.json(ApiResponse.error(err.message, status), { status });
        }
    }
});
