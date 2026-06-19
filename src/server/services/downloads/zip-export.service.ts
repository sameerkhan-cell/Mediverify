import JSZip from "jszip";
import { QRService } from "../qr/qr.service";

export class ZIPExportService {
    /**
     * Bundles all generated QR assets for a batch into a ZIP file.
     * High-Performance Parallel Generation for 100,000+ assets.
     */
    static async generateQRZip(batch: any, pills: any[]): Promise<Buffer> {
        const startTime = Date.now();
        console.log(`[ZIPExportService] Starting industrial packing for ${pills.length} assets...`);

        const zip = new JSZip();
        const rootFolder = zip.folder(`Batch-${batch.batchNumber}-QRs`);

        // 1. Box QR PNG
        if (batch.boxQRCode) {
            const boxQrData = await QRService.generateDataURL(batch.boxQRCode, { width: 800 });
            const boxBase64 = boxQrData.replace(/^data:image\/png;base64,/, "");
            rootFolder?.file(`BOX-${batch.batchNumber}.png`, boxBase64, { base64: true });
        }

        // 2. Pills folder — one PNG per pill
        const pillsFolder = rootFolder?.folder("Pills");

        // ── PERFORMANCE OPTIMIZATION: Parallel Asset Generation ──
        // Process in chunks to maintain responsiveness and avoid memory exhaust
        const CONCURRENCY = 75;
        for (let i = 0; i < pills.length; i += CONCURRENCY) {
            const chunk = pills.slice(i, i + CONCURRENCY);

            const qrTasks = chunk.map(pill =>
                QRService.generateDataURL(pill.qrCode, { width: 200 })
                    .then(qrDataUrl => ({
                        filename: `${pill.qrCode}.png`,
                        data: qrDataUrl.replace(/^data:image\/png;base64,/, "")
                    }))
            );

            const results = await Promise.all(qrTasks);

            for (const item of results) {
                pillsFolder?.file(item.filename, item.data, { base64: true });
            }
        }

        // 3. manifest.json
        const manifest = {
            batchNumber: batch.batchNumber,
            medicineName: batch.medicine?.name ?? "N/A",
            manufacturingDate: batch.manufacturingDate,
            expiryDate: batch.expiryDate,
            totalPills: pills.length,
            boxQRCode: batch.boxQRCode ?? null,
            generatedAt: new Date().toISOString(),
            pills: pills.map((p: any) => ({
                pillNumber: p.pillNumber,
                qrCode: p.qrCode,
            })),
        };

        rootFolder?.file("manifest.json", JSON.stringify(manifest, null, 2));

        const buffer = await zip.generateAsync({
            type: "nodebuffer",
            // PNGs are already internally compressed; DEFLATE adds CPU with near-zero size gain.
            // STORE skips re-compression entirely for maximum throughput.
            compression: "STORE",
        });

        const duration = (Date.now() - startTime) / 1000;
        console.log(`[ZIPExportService] Packing completed in ${duration.toFixed(2)}s for batch ${batch.batchNumber}`);

        return buffer;
    }
}
