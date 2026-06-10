import JSZip from "jszip";
import { QRService } from "../qr/qr.service";

export class ZIPExportService {
    /**
     * Bundles all generated QR assets for a batch into a ZIP file.
     * Structure:
     *   Batch-{batchNumber}-QRs/
     *     BOX-{batchNumber}.png
     *     manifest.json
     *     Pills/
     *       {pillQrCode}.png
     *       ...
     */
    static async generateQRZip(batch: any, pills: any[]): Promise<Buffer> {
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

        for (const pill of pills) {
            const qrDataUrl = await QRService.generateDataURL(pill.qrCode, { width: 400 });
            const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, "");
            pillsFolder?.file(`${pill.qrCode}.png`, base64Data, { base64: true });
        }

        // 3. manifest.json — human-readable index of all QR codes
        const manifest = {
            batchNumber: batch.batchNumber,
            medicineName: batch.medicine?.name ?? "N/A",
            genericName: batch.medicine?.genericName ?? null,
            category: batch.medicine?.category ?? null,
            dosage: batch.medicine?.dosage ?? null,
            manufacturingDate: batch.manufacturingDate,
            expiryDate: batch.expiryDate,
            totalBoxes: batch.quantityBoxes,
            pillsPerBox: batch.pillsPerBox,
            totalPills: pills.length,
            boxQRCode: batch.boxQRCode ?? null,
            generatedAt: new Date().toISOString(),
            pills: pills.map((p: any) => ({
                pillNumber: p.pillNumber,
                serialNumber: p.serialNumber ?? null,
                qrCode: p.qrCode,
                status: p.status,
            })),
        };

        rootFolder?.file("manifest.json", JSON.stringify(manifest, null, 2));

        return await zip.generateAsync({
            type: "nodebuffer",
            compression: "DEFLATE",
            compressionOptions: { level: 6 },
        });
    }
}
