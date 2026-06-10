import { createAPIFileRoute } from "@/lib/api-route-helper";
import { BatchService } from "@/server/services/manufacturer/batch.service";
import { authorizeRequest } from "@/server/middleware/auth.middleware";
import { ApiResponse } from "@/server/utils/api-response";
import { PDFSheetService } from "@/server/services/pdf/pdf-sheet.service";
import { ZIPExportService } from "@/server/services/downloads/zip-export.service";

export const Route = createAPIFileRoute("/api/manufacturer/batch/$id")({
    GET: async ({ request, params }: { request: Request; params: any }) => {
        try {
            const payload = await authorizeRequest(request, ["MANUFACTURER"]);
            const { id } = params as { id: string };

            const url = new URL(request.url);
            const downloadType = url.searchParams.get("download");

            const ipAddress =
                request.headers.get("x-forwarded-for") ??
                request.headers.get("cf-connecting-ip") ??
                undefined;
            const userAgent = request.headers.get("user-agent") ?? undefined;

            if (downloadType === "pdf") {
                const batch = await BatchService.getBatchDetails(payload.userId, id, { allPills: true }) as any;
                const pdfBuffer = await PDFSheetService.generateBatchPillSheet(batch, batch.pills);

                // Emit audit event (non-blocking)
                void BatchService.recordExportAudit(payload.userId, id, "PDF_EXPORTED", { ipAddress, userAgent });

                return new Response(new Uint8Array(pdfBuffer), {
                    headers: {
                        "Content-Type": "application/pdf",
                        "Content-Disposition": `attachment; filename="Batch-${batch.batchNumber}-Pills.pdf"`,
                    },
                });
            }

            if (downloadType === "zip") {
                const batch = await BatchService.getBatchDetails(payload.userId, id, { allPills: true }) as any;
                const zipBuffer = await ZIPExportService.generateQRZip(batch, batch.pills);

                // Emit audit event (non-blocking)
                void BatchService.recordExportAudit(payload.userId, id, "ZIP_EXPORTED", { ipAddress, userAgent });

                return new Response(new Uint8Array(zipBuffer), {
                    headers: {
                        "Content-Type": "application/zip",
                        "Content-Disposition": `attachment; filename="Batch-${batch.batchNumber}-QRs.zip"`,
                    },
                });
            }

            const batch = await BatchService.getBatchDetails(payload.userId, id);
            return Response.json(ApiResponse.success(batch));
        } catch (error: any) {
            const status = error.statusCode || 404;
            return Response.json(ApiResponse.error(error.message, status), { status });
        }
    },
});
