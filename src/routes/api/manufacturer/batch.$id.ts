import { createAPIFileRoute } from "@/lib/api-route-helper";
import { BatchService } from "@/server/services/manufacturer/batch.service";
import { authorizeRequest } from "@/server/middleware/auth.middleware";
import { PDFSheetService } from "@/server/services/pdf/pdf-sheet.service";
import { ZIPExportService } from "@/server/services/downloads/zip-export.service";
import { ApiResponse } from "@/server/utils/api-response";
import fs from "fs";
import path from "path";

export const Route = createAPIFileRoute("/api/manufacturer/batch/$id")({
    GET: async ({ request, params }: { request: Request; params: { id: string } }) => {
        try {
            const payload = await authorizeRequest(request, ["MANUFACTURER"]);
            const { id } = params;
            const url = new URL(request.url);
            const downloadType = url.searchParams.get("download");
            const isCheckOnly = url.searchParams.get("check") === "true";

            // ── Pre-flight Readiness Check ──────────────────────────────
            // Crucial for industrial batches to avoid browser timeouts
            if (isCheckOnly && (downloadType === "pdf" || downloadType === "zip")) {
                const b = await BatchService.getBatchDetails(payload.userId, id) as any;
                const cacheFileName = (downloadType === "pdf" && b.totalPillsGenerated > 5000) || downloadType === "zip"
                    ? `Batch-${b.batchNumber}-Full-Registry.zip`
                    : `Sheet-${b.batchNumber}-Industrial.pdf`;

                const cachePath = path.join(process.cwd(), "storage", "qr-assets", id, cacheFileName);
                return new Response(JSON.stringify({ ready: fs.existsSync(cachePath) }), {
                    headers: { "Content-Type": "application/json" }
                });
            }

            const ipAddress =
                request.headers.get("x-forwarded-for") ??
                request.headers.get("cf-connecting-ip") ??
                undefined;
            const userAgent = request.headers.get("user-agent") ?? undefined;

            // ── Download Handlers ─────────────────────────────────────────

            if (downloadType === "pdf") {
                const batch = await BatchService.getBatchDetails(payload.userId, id, { allPills: true }) as any;
                const pills = batch.pills || [];

                let responseContent;
                let contentType = "application/pdf";
                let filename = `Batch-${batch.batchNumber}-Pills.pdf`;

                if (pills.length > 5000) {
                    // INDUSTRIAL SCALE: Generate a ZIP of PDF parts to avoid OOM and 4k page PDF corruption
                    responseContent = await PDFSheetService.generateIndustrialPDFZip(batch, pills);
                    contentType = "application/zip";
                    filename = `Batch-${batch.batchNumber}-Full-Registry.zip`;
                } else {
                    responseContent = await PDFSheetService.generateBatchPillSheet(batch, pills);
                }

                void BatchService.recordExportAudit(payload.userId, id, "PDF_EXPORTED", { ipAddress, userAgent });

                return new Response(new Uint8Array(responseContent), {
                    headers: {
                        "Content-Type": contentType,
                        "Content-Disposition": `attachment; filename="${filename}"`,
                    },
                });
            }

            if (downloadType === "csv") {
                const batch = await BatchService.getBatchDetails(payload.userId, id, { allPills: true }) as any;
                const pills = batch.pills || [];

                let csvContent = "\ufeffPill Number,Serial Number,QR Code,Status,Verification Status,Scanned\n";
                csvContent += pills.map((p: any) =>
                    `${p.pillNumber},"${p.serialNumber}","${p.qrCode}",${p.status},${p.verificationStatus},${p.qrScanned}`
                ).join("\n");

                void BatchService.recordExportAudit(payload.userId, id, "CSV_EXPORTED", { ipAddress, userAgent });

                return new Response(csvContent, {
                    headers: {
                        "Content-Type": "text/csv; charset=utf-8",
                        "Content-Disposition": `attachment; filename="BatchRegistry_${batch.batchNumber}.csv"`,
                    },
                });
            }

            if (downloadType === "zip") {
                const batch = await BatchService.getBatchDetails(payload.userId, id, { allPills: true }) as any;
                const zipBuffer = await ZIPExportService.generateQRZip(batch, batch.pills);

                void BatchService.recordExportAudit(payload.userId, id, "ZIP_EXPORTED", { ipAddress, userAgent });

                return new Response(new Uint8Array(zipBuffer), {
                    headers: {
                        "Content-Type": "application/zip",
                        "Content-Disposition": `attachment; filename="Batch-${batch.batchNumber}-QRs.zip"`,
                    },
                });
            }

            // ── Standard JSON Metadata ────────────────────────────────────
            try {
                const wantAllPills = url.searchParams.get("all") === "true";
                const batch = await BatchService.getBatchDetails(payload.userId, id, { allPills: wantAllPills }) as any;

                return Response.json(ApiResponse.success({
                    ...batch,
                    totalCartons: batch._count?.cartons ?? batch.cartons?.length ?? 0,
                    totalBoxes: batch._count?.boxes ?? batch.boxes?.length ?? 0,
                    totalPills: batch._count?.pills ?? batch.pills?.length ?? batch.totalPillsGenerated ?? 0,
                }));
            } catch (err: any) {
                console.error("[API] Batch detail fetch error:", err);
                return Response.json(ApiResponse.error(err.message || "Internal error", 500), { status: 500 });
            }
        } catch (error: any) {
            const status = error.statusCode || 404;
            return Response.json(ApiResponse.error(error.message, status), { status });
        }
    },
});
