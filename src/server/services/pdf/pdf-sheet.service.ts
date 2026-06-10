import { jsPDF } from "jspdf";
import { QRService } from "../qr/qr.service";

export class PDFSheetService {
    /**
     * Generates a printable A4 PDF sheet for an entire medicine batch.
     * Optimized for pharmaceutical printing workflows.
     */
    static async generateBatchPillSheet(batch: any, pills: any[]): Promise<Buffer> {
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const margin = 15;
        const qrSize = 25;
        const cellWidth = 35;
        const cellHeight = 45;

        const cols = Math.floor((pageWidth - 2 * margin) / cellWidth);
        const rows = Math.floor((pageHeight - 35) / cellHeight); // Leave space for header

        let currentX = margin;
        let currentY = 30; // Start below header
        let count = 0;

        const drawHeader = (pageNumber: number) => {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.text(`MediVerify Production Asset: ${batch.medicine?.name}`, margin, 12);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text(`Batch ID: ${batch.batchNumber} | Mfg: ${new Date(batch.manufacturingDate).toLocaleDateString()} | Exp: ${new Date(batch.expiryDate).toLocaleDateString()}`, margin, 18);
            doc.text(`Dosage: ${batch.dosageStrength || 'N/A'} | Page: ${pageNumber}`, margin, 23);

            doc.setDrawColor(200);
            doc.line(margin, 26, pageWidth - margin, 26);
        };

        let pageNum = 1;
        drawHeader(pageNum);

        for (const pill of pills) {
            // Check if we need a new page
            if (count > 0 && count % (cols * rows) === 0) {
                doc.addPage();
                pageNum++;
                drawHeader(pageNum);
                currentX = margin;
                currentY = 30;
            }

            // Generate QR once and reuse data URL
            const qrDataUrl = await QRService.generateDataURL(pill.qrCode, { width: 120, margin: 0 });

            // Draw QR
            doc.addImage(qrDataUrl, 'PNG', currentX + (cellWidth - qrSize) / 2, currentY + 2, qrSize, qrSize);

            // Draw S/N and metadata
            doc.setFontSize(7);
            doc.setFont("courier", "bold");
            doc.text(`${pill.qrCode}`, currentX + cellWidth / 2, currentY + qrSize + 6, { align: 'center' });

            doc.setFont("helvetica", "normal");
            doc.setFontSize(6);
            doc.text(`SN: ${pill.pillNumber}`, currentX + cellWidth / 2, currentY + qrSize + 10, { align: 'center' });

            // Grid movement
            count++;
            if (count % cols === 0) {
                currentX = margin;
                currentY += cellHeight;
            } else {
                currentX += cellWidth;
            }
        }

        return Buffer.from(doc.output('arraybuffer'));
    }
}
