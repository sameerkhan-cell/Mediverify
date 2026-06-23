/**
 * POST /api/manufacturer/batches
 *
 * Primary endpoint for batch registration (spec-compliant path).
 * Accepts full pharmaceutical batch data, creates Medicine if needed,
 * generates all QR codes, persists pills and QRAsset records, and
 * writes audit logs.
 */
import { createAPIFileRoute } from "@/lib/api-route-helper";
import { BatchService } from "@/server/services/manufacturer/batch.service";
import { authorizeRequest } from "@/server/middleware/auth.middleware";
import { ApiResponse } from "@/server/utils/api-response";
import { z } from "zod";

const RegisterBatchSchema = z.object({
    medicineName: z.string().min(1, "Medicine name is required"),
    genericName: z.string().optional(),
    category: z.string().optional(),
    dosage: z.string().optional(),
    description: z.string().optional(),
    batchNumber: z.string().optional().default(""),
    manufacturingDate: z.string().min(1, "Manufacturing date is required"),
    expiryDate: z.string().min(1, "Expiry date is required"),
    quantityBoxes: z.coerce.number().int().min(1, "Quantity must be at least 1"),
    pillsPerBox: z.coerce.number().int().min(1, "Pills per box must be at least 1"),
    totalCartons: z.coerce.number().int().min(1).optional(),
    dosageStrength: z.string().optional(),
    productType: z.string().optional(),
    allowsExtension: z.boolean().optional().default(false),
});

export const Route = createAPIFileRoute("/api/manufacturer/batches")({
    GET: async ({ request }: { request: Request }) => {
        try {
            const payload = await authorizeRequest(request, ["MANUFACTURER"]);
            const batches = await BatchService.getManufacturerBatches(payload.userId);
            return Response.json(ApiResponse.success(batches));
        } catch (error: any) {
            const status = error.statusCode || 401;
            return Response.json(ApiResponse.error(error.message, status), { status });
        }
    },

    POST: async ({ request }: { request: Request }) => {
        try {
            const payload = await authorizeRequest(request, ["MANUFACTURER"]);
            const body = await request.json();

            const parsed = RegisterBatchSchema.safeParse(body);
            if (!parsed.success) {
                const msg = parsed.error.errors.map((e) => e.message).join("; ");
                return Response.json(ApiResponse.error(msg, 400), { status: 400 });
            }

            const ipAddress =
                request.headers.get("x-forwarded-for") ??
                request.headers.get("cf-connecting-ip") ??
                undefined;
            const userAgent = request.headers.get("user-agent") ?? undefined;

            const result = await BatchService.registerBatch(
                payload.userId,
                parsed.data,
                { ipAddress, userAgent }
            );

            return Response.json(
                ApiResponse.success(result, "Batch registered and QR codes generated."),
                { status: 201 }
            );
        } catch (error: any) {
            const status = error.statusCode || 400;
            return Response.json(ApiResponse.error(error.message, status), { status });
        }
    },
});
