/**
 * GET /api/manufacturer/batches/:id/assets
 *
 * Returns download links / inline data for:
 *   - boxQR     (data URL)
 *   - pdfSheet  (base64-encoded PDF buffer)
 *   - zipFile   (base64-encoded ZIP buffer)
 *
 * Query param  ?type=boxqr|pdf|zip  triggers binary response instead.
 */
import { createAPIFileRoute } from "@/lib/api-route-helper";
import { BatchService } from "@/server/services/manufacturer/batch.service";
import { authorizeRequest } from "@/server/middleware/auth.middleware";
import { ApiResponse } from "@/server/utils/api-response";
import { QRService } from "@/server/services/qr/qr.service";
import { PDFSheetService } from "@/server/services/pdf/pdf-sheet.service";
import { ZIPExportService } from "@/server/services/downloads/zip-export.service";
import { AuditLogService } from "@/server/services/audit/audit-log.service";
import { prisma } from "@/server/db/client";

export const Route = createAPIFileRoute("/api/manufacturer/batches/$id/assets")({
    GET: async ({ request, params }: { request: Request; params: any }) => {
        try {
            const payload = await authorizeRequest(request, ["MANUFACTURER"]);
            const { id } = params as { id: string };

            const url = new URL(request.url);
            const type = url.searchParams.get("type"); // boxqr | pdf | zip

            const ipAddress =
                request.headers.get("x-forwarded-for") ??
                request.headers.get("cf-connecting-ip") ??
                undefined;
            const userAgent = request.headers.get("user-agent") ?? undefined;

            // ── Binary download shortcuts ─────────────────────────────────
            if (type === "pdf") {
                const batch = await BatchService.getBatchDetails(payload.userId, id, { allPills: true });
                const pdfBuffer = await PDFSheetService.generateBatchPillSheet(batch, batch.pills);

                await BatchService.recordExportAudit(payload.userId, id, "PDF_EXPORTED", { ipAddress, userAgent });

                // Save to filesystem (Hardening)
                const pdfPath = await QRService.saveAsset(id, `sheet-${batch.batchNumber}.pdf`, pdfBuffer);

                // Persist QRAsset record for this export
                await prisma.qRAsset.create({
                    data: {
                        batchId: id,
                        type: "PDF_SHEET",
                        fileUrl: pdfPath,
                        metadata: JSON.stringify({ exportedAt: new Date().toISOString(), pillCount: batch.pills.length }),
                    },
                }).catch(() => {/* non-fatal */ });

                return new Response(new Uint8Array(pdfBuffer), {
                    headers: {
                        "Content-Type": "application/pdf",
                        "Content-Disposition": `attachment; filename="Batch-${batch.batchNumber}-Pills.pdf"`,
                    },
                });
            }

            if (type === "zip") {
                const batch = await BatchService.getBatchDetails(payload.userId, id, { allPills: true });
                const zipBuffer = await ZIPExportService.generateQRZip(batch, batch.pills);

                await BatchService.recordExportAudit(payload.userId, id, "ZIP_EXPORTED", { ipAddress, userAgent });

                // Save to filesystem (Hardening)
                const zipPath = await QRService.saveAsset(id, `assets-${batch.batchNumber}.zip`, zipBuffer);

                await prisma.qRAsset.create({
                    data: {
                        batchId: id,
                        type: "ZIP_EXPORT",
                        fileUrl: zipPath,
                        metadata: JSON.stringify({ exportedAt: new Date().toISOString(), pillCount: batch.pills.length }),
                    },
                }).catch(() => {/* non-fatal */ });

                return new Response(new Uint8Array(zipBuffer), {
                    headers: {
                        "Content-Type": "application/zip",
                        "Content-Disposition": `attachment; filename="Batch-${batch.batchNumber}-QRs.zip"`,
                    },
                });
            }

            // ── JSON manifest (default) ──────────────────────────────────
            const batch = await BatchService.getBatchDetails(payload.userId, id);

            const boxQrDataUrl = batch.boxQRCode
                ? await QRService.generateDataURL(batch.boxQRCode, { width: 800 })
                : null;

            return Response.json(
                ApiResponse.success({
                    batchId: batch.id,
                    batchNumber: batch.batchNumber,
                    medicineName: batch.medicine?.name,
                    boxQR: {
                        code: batch.boxQRCode,
                        dataUrl: boxQrDataUrl,
                    },
                    pdfSheet: {
                        downloadUrl: `/api/manufacturer/batches/${id}/assets?type=pdf`,
                    },
                    zipFile: {
                        downloadUrl: `/api/manufacturer/batches/${id}/assets?type=zip`,
                    },
                    existingAssets: batch.qrAssets ?? [],
                    totalPills: batch.totalPillsGenerated,
                    totalBoxes: batch.quantityBoxes,
                    pillsPerBox: batch.pillsPerBox,
                })
            );
        } catch (error: any) {
            const status = error.statusCode || 500;
            return Response.json(ApiResponse.error(error.message, status), { status });
        }
    },
});
