import { createAPIFileRoute } from "@/lib/api-route-helper";
import { prisma } from "@/server/db/client";
import { authorizeRequest } from "@/server/middleware/auth.middleware";

export const Route = createAPIFileRoute("/api/admin/recalls/$id")({
  PATCH: async ({ request, params }: { request: Request; params: { id: string } }) => {
    try {
      await authorizeRequest(request, ["ADMIN", "SUPER_ADMIN", "DRAP_ADMIN"]);
      const body = await request.json();
      const recall = await prisma.dRAPRecall.update({
        where: { id: params.id },
        data: { isActive: body.isActive }
      });
      return Response.json({ success: true, data: recall });
    } catch (err: any) {
      return Response.json({ success: false, error: err.message }, { status: 500 });
    }
  }
});
