import { createAPIFileRoute } from "@/lib/api-route-helper";
import { BatchService } from "@/server/services/manufacturer/batch.service";
import { authorizeRequest } from "@/server/middleware/auth.middleware";
import { ApiResponse } from "@/server/utils/api-response";
import { prisma } from "@/server/db/client";

/**
 * POST /api/manufacturer/register-batch
 *
 * Legacy route kept for backward compatibility.
 * Delegates entirely to the unified BatchService.registerBatch() handler.
 */
export const Route = createAPIFileRoute("/api/manufacturer/register-batch")({
    POST: async ({ request }: { request: Request }) => {
        try {
            const payload = await authorizeRequest(request, ["MANUFACTURER"]);
            const body = await request.json();

            const { medicineName, manufacturingDate, expiryDate, quantityBoxes, pillsPerBox } = body;

            if (!medicineName || !manufacturingDate || !expiryDate || !quantityBoxes || !pillsPerBox) {
                return Response.json(
                    ApiResponse.error("Missing required pharmaceutical registration fields.", 400),
                    { status: 400 }
                );
            }

            const ipAddress =
                request.headers.get("x-forwarded-for") ??
                request.headers.get("cf-connecting-ip") ??
                undefined;
            const userAgent = request.headers.get("user-agent") ?? undefined;

            const result = await BatchService.registerBatch(
                payload.userId,
                {
                    ...body,
                    quantityBoxes: Number(quantityBoxes),
                    pillsPerBox: Number(pillsPerBox),
                    allowsExtension: Boolean(body.allowsExtension),
                },
                { ipAddress, userAgent }
            );

            // Enrich response with cartons and boxes for the preview UI
            const [cartons, boxes] = await Promise.all([
                prisma.carton.findMany({
                    where: { batchId: result.batch.id },
                    select: { id: true, cartonNumber: true, qrCode: true, boxesCount: true }
                }),
                prisma.box.findMany({
                    where: { batchId: result.batch.id },
                    select: { id: true, boxNumber: true, qrCode: true }
                })
            ]);

            return Response.json(ApiResponse.success({ ...result, cartons, boxes }, "Batch registered and QRs synchronized."));
        } catch (error: any) {
            const status = error.statusCode || 400;
            return Response.json(ApiResponse.error(error.message, status), { status });
        }
    },
});
