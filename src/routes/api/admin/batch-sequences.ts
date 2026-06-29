import { createAPIFileRoute } from "@/lib/api-route-helper";
import { prisma } from "@/server/db/client";
import { authorizeRequest } from "@/server/middleware/auth.middleware";

export const Route = createAPIFileRoute("/api/admin/batch-sequences")({
  GET: async ({ request }: { request: Request }) => {
    try {
      await authorizeRequest(request, ["ADMIN", "SUPER_ADMIN", "DRAP_ADMIN"]);
      const sequences = await prisma.batchSequence.findMany({
        include: { medicine: { select: { name: true } } },
        orderBy: { createdAt: "desc" }
      });
      return Response.json({ success: true, data: sequences });
    } catch (err: any) {
      return Response.json({ success: false, error: err.message }, { status: 500 });
    }
  },
  POST: async ({ request }: { request: Request }) => {
    try {
      await authorizeRequest(request, ["ADMIN", "SUPER_ADMIN", "DRAP_ADMIN"]);
      const body = await request.json();
      const sequence = await prisma.batchSequence.upsert({
        where: {
          medicineId_prefix_year: {
            medicineId: body.medicineId,
            prefix: body.prefix,
            year: body.year
          }
        },
        update: {
          minSequence: body.minSequence,
          maxSequence: body.maxSequence,
          totalBatches: body.maxSequence - body.minSequence + 1,
          confidence: body.confidence,
          lastUpdated: new Date()
        },
        create: {
          medicineId: body.medicineId,
          prefix: body.prefix,
          year: body.year,
          minSequence: body.minSequence,
          maxSequence: body.maxSequence,
          totalBatches: body.maxSequence - body.minSequence + 1,
          confidence: body.confidence
        }
      });
      return Response.json({ success: true, data: sequence });
    } catch (err: any) {
      return Response.json({ success: false, error: err.message }, { status: 500 });
    }
  }
});
