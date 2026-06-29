import { createAPIFileRoute } from "@/lib/api-route-helper";
import { prisma } from "@/server/db/client";
import { authorizeRequest } from "@/server/middleware/auth.middleware";

export const Route = createAPIFileRoute("/api/admin/recalls")({
  GET: async ({ request }: { request: Request }) => {
    try {
      await authorizeRequest(request, ["ADMIN", "SUPER_ADMIN", "DRAP_ADMIN"]);
      const recalls = await prisma.dRAPRecall.findMany({ orderBy: { createdAt: "desc" } });
      return Response.json({ success: true, data: recalls });
    } catch (err: any) {
      return Response.json({ success: false, error: err.message }, { status: 500 });
    }
  },
  POST: async ({ request }: { request: Request }) => {
    try {
      const payload = await authorizeRequest(request, ["ADMIN", "SUPER_ADMIN", "DRAP_ADMIN"]);
      const body = await request.json();
      const recall = await prisma.dRAPRecall.create({
        data: {
          medicineName: body.medicineName,
          batchNumber: body.batchNumber || null,
          recallDate: new Date(body.recallDate),
          reason: body.reason,
          severity: body.severity || "MEDIUM",
          drapRef: body.drapRef || null,
          isActive: true,
          createdBy: payload.userId
        }
      });
      return Response.json({ success: true, data: recall });
    } catch (err: any) {
      return Response.json({ success: false, error: err.message }, { status: 500 });
    }
  }
});
