import { createAPIFileRoute } from "@/lib/api-route-helper";
import { prisma } from "@/server/db/client";
import { authorizeRequest } from "@/server/middleware/auth.middleware";

export const Route = createAPIFileRoute("/api/admin/medicines/$id")({
  PUT: async ({ request, params }: { request: Request; params: { id: string } }) => {
    try {
      await authorizeRequest(request, ["ADMIN", "SUPER_ADMIN", "DRAP_ADMIN"]);
      const body = await request.json();
      const medicine = await prisma.medicine.update({
        where: { id: params.id },
        data: {
          name: body.name,
          genericName: body.genericName || null,
          category: body.category || null,
          dosage: body.dosage || null,
          drapRegNumber: body.drapRegNumber || null,
          activeIngredients: body.activeIngredients || null,
          approvalStatus: body.approvalStatus,
          manufacturer_name: body.manufacturer_name || null,
        }
      });
      return Response.json({ success: true, data: medicine });
    } catch (err: any) {
      return Response.json({ success: false, error: err.message }, { status: 500 });
    }
  },
  DELETE: async ({ request, params }: { request: Request; params: { id: string } }) => {
    try {
      await authorizeRequest(request, ["ADMIN", "SUPER_ADMIN", "DRAP_ADMIN"]);
      await prisma.medicine.delete({ where: { id: params.id } });
      return Response.json({ success: true });
    } catch (err: any) {
      return Response.json({ success: false, error: err.message }, { status: 500 });
    }
  }
});
