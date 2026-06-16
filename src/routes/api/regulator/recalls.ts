import { createAPIFileRoute } from "@/lib/api-route-helper";
import { prisma } from "@/server/db/client";
import { authorizeRequest } from "@/server/middleware/auth.middleware";

export const Route = createAPIFileRoute("/api/regulator/recalls")({
    GET: async ({ request }) => {
        try {
            await authorizeRequest(request, ["ADMIN", "REGULATOR", "DRAP_ADMIN"]);

            const recalls = await prisma.batch.findMany({
                where: { isRecalled: true },
                include: { medicine: { include: { manufacturer: true } } },
                orderBy: { createdAt: "desc" },
                take: 20,
            });

            return Response.json({ success: true, data: recalls });
        } catch (err: any) {
            const status = err.statusCode || 500;
            return Response.json({ success: false, error: err.message }, { status });
        }
    },
});
