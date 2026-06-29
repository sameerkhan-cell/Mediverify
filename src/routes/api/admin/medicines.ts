import { createAPIFileRoute } from "@/lib/api-route-helper";
import { prisma } from "@/server/db/client";
import { authorizeRequest } from "@/server/middleware/auth.middleware";

export const Route = createAPIFileRoute("/api/admin/medicines")({
  GET: async ({ request }: { request: Request }) => {
    try {
      await authorizeRequest(request, ["ADMIN", "SUPER_ADMIN", "DRAP_ADMIN"]);
      const medicines = await prisma.medicine.findMany({
        orderBy: { createdAt: "desc" }
      });
      return Response.json({ success: true, data: medicines });
    } catch (err: any) {
      return Response.json({ success: false, error: err.message }, { status: 500 });
    }
  },
  POST: async ({ request }: { request: Request }) => {
    try {
      await authorizeRequest(request, ["ADMIN", "SUPER_ADMIN", "DRAP_ADMIN"]);
      const body = await request.json();
      
      // Find a default manufacturer for public DRAP entries
      let manufacturerId = body.manufacturerId;
      if (!manufacturerId) {
        const defaultMfr = await prisma.manufacturer.findFirst();
        if (!defaultMfr) return Response.json({ success: false, error: "No manufacturer found. Please ensure seed data exists." }, { status: 400 });
        manufacturerId = defaultMfr.id;
      }

      const medicine = await prisma.medicine.create({
        data: {
          name: body.name,
          genericName: body.genericName || null,
          category: body.category || null,
          dosage: body.dosage || null,
          drapRegNumber: body.drapRegNumber || null,
          activeIngredients: body.activeIngredients || null,
          approvalStatus: body.approvalStatus || "REGISTERED",
          manufacturer_name: body.manufacturer_name || null,
          isPublicDRAPEntry: true,
          manufacturerId,
        }
      });
      return Response.json({ success: true, data: medicine });
    } catch (err: any) {
      return Response.json({ success: false, error: err.message }, { status: 500 });
    }
  }
});
