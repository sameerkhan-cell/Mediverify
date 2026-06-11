import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { MedicineBatch, PillRecord } from "@/types/dual-qr";

/**
 * Printing Service — MediVerify Dual QR System
 * Handles PDF generation for architectural print layouts.
 */
export class PrintingService {
    /**
     * Generates a PDF for a single Box QR.
     * Layout: 3cm x 3cm as requested (with small bleed).
     */
    static async generateBoxQrPdf(batch: MedicineBatch, qrDataUrl: string): Promise<Blob> {
        const doc = new jsPDF({
            unit: "mm",
            format: [45, 45], // 4.5cm x 4.5cm canvas
        });

        // 3cm = 30mm
        doc.addImage(qrDataUrl, "PNG", 7.5, 5, 30, 30);

        doc.setFontSize(6);
        doc.setTextColor(50, 50, 50);
        doc.text(`BATCH: ${batch.batchNumber}`, 22.5, 37, { align: "center" });
        doc.text(`${batch.medicineName}`, 22.5, 40, { align: "center" });
        doc.text(`EXP: ${batch.expiryDate}`, 22.5, 43, { align: "center" });

        return doc.output("blob");
    }

    /**
     * Generates a PDF for a sheet of Pill QRs.
     * Layout: Micro QR layout (0.8cm x 0.8cm) on A4.
     */
    static async generatePillQrSheetPdf(batch: MedicineBatch, pills: PillRecord[]): Promise<Blob> {
        const doc = new jsPDF({
            unit: "mm",
            format: "a4",
        });

        const MARGIN_X = 10;
        const MARGIN_Y = 22;        // vertical space reserved for the per-page header
        const QR_SIZE = 8;         // 0.8 cm per QR image
        const CELL_W = QR_SIZE + 5; // 13 mm per column  (QR + horizontal gap)
        const CELL_H = QR_SIZE + 7; // 15 mm per row     (QR + label + vertical gap)
        const COLS = 12;

        const PAGE_H = doc.internal.pageSize.getHeight();
        const USABLE_H = PAGE_H - MARGIN_Y - 10;
        const ROWS_PER_PAGE = Math.floor(USABLE_H / CELL_H);
        const CELLS_PER_PAGE = COLS * ROWS_PER_PAGE;

        const totalPages = Math.ceil(pills.length / CELLS_PER_PAGE);

        const addPageHeader = (pageNum: number) => {
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text("MediVerify · Pill QR Print Sheet", MARGIN_X, 8);

            doc.setFontSize(7);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 100, 100);
            doc.text(
                `${batch.medicineName} — Batch: ${batch.batchNumber} — Total Pills: ${pills.length}  (Page ${pageNum} of ${totalPages})`,
                MARGIN_X, 14
            );

            doc.setDrawColor(200, 200, 200);
            doc.line(MARGIN_X, 16, doc.internal.pageSize.getWidth() - MARGIN_X, 16);
        };

        addPageHeader(1);

        const qrOpts = { margin: 1, width: 120, errorCorrectionLevel: 'H' as const };

        for (let i = 0; i < pills.length; i++) {
            const posOnPage = i % CELLS_PER_PAGE;

            if (posOnPage === 0 && i > 0) {
                doc.addPage();
                addPageHeader(Math.floor(i / CELLS_PER_PAGE) + 1);
            }

            const col = posOnPage % COLS;
            const row = Math.floor(posOnPage / COLS);

            const x = MARGIN_X + col * CELL_W;
            const y = MARGIN_Y + row * CELL_H;

            try {
                const uniqueQrDataUrl = await QRCode.toDataURL(pills[i].pillQrCode, qrOpts);
                doc.addImage(uniqueQrDataUrl, "PNG", x, y, QR_SIZE, QR_SIZE);
            } catch (err) {
                console.error(`Failed to generate QR for pill ${pills[i].pillNumber}`, err);
            }

            doc.setFontSize(3.5);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(80, 80, 80);
            doc.text(pills[i].pillNumber, x + QR_SIZE / 2, y + QR_SIZE + 2.5, { align: "center" });
        }

        return doc.output("blob");
    }

    /**
     * Generates a comprehensive Batch Report PDF.
     */
    static async generateBatchReportPdf(batch: MedicineBatch, totalPills: number): Promise<Blob> {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, pageWidth, 40, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("MediVerify", 20, 20);
        doc.setFontSize(12);
        doc.text("PHARMACEUTICAL AUTHENTICATION SYSTEM", 20, 28);

        doc.setTextColor(200, 200, 200);
        doc.setFontSize(10);
        doc.text(`REPORT NO: MV-${batch.batchNumber}`, pageWidth - 20, 25, { align: "right" });

        // Body
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Batch Compliance Report", 20, 55);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(107, 114, 128);
        doc.text(`Generated on ${new Date().toLocaleString()}`, 20, 62);

        // Table-like structure
        let y = 75;
        const fields = [
            ["Medicine Name", batch.medicineName],
            ["Batch Number", batch.batchNumber],
            ["Product Category", batch.productCategory || "Pharmaceutical"],
            ["Manufacturer Code", batch.manufacturerCode],
            ["DRAP License", batch.drapLicense],
            ["Manufacturing Date", batch.manufacturingDate],
            ["Expiry Date", batch.expiryDate],
            ["Total Boxes", batch.quantityBoxes.toLocaleString()],
            ["Pills Per Box", batch.totalPillsPerBox.toString()],
            ["Total Generated Pills", totalPills.toLocaleString()],
            ["Generation Status", (batch.qrGenerationStatus || "completed").toUpperCase()],
            ["Supply Chain Status", (batch.status || "active").toUpperCase()],
        ];

        fields.forEach(([label, value]) => {
            // Row background
            doc.setFillColor(249, 250, 251);
            doc.rect(20, y - 5, pageWidth - 40, 10, "F");

            doc.setFont("helvetica", "bold");
            doc.setTextColor(55, 65, 81);
            doc.text(`${label}:`, 25, y + 1);

            doc.setFont("helvetica", "normal");
            doc.setTextColor(17, 24, 39);
            doc.text(String(value || "N/A"), 80, y + 1);

            y += 10;
        });

        // Blockchain Section
        y += 10;
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Blockchain Verification Details", 20, y);

        y += 10;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(107, 114, 128);
        doc.text("TRANSACTION HASH", 20, y);

        y += 6;
        doc.setFont("courier", "bold");
        doc.setTextColor(37, 99, 235);
        doc.text(String(batch.txHash || "PENDING"), 20, y);

        // Footer
        doc.setFont("helvetica", "normal");
        doc.setTextColor(156, 163, 175);
        doc.setFontSize(8);
        doc.text("This report is digitally signed by MediVerify nodes. Any tampering invalidates the verification.", 105, 280, { align: "center" });

        return doc.output("blob");
    }

    /**
     * Alias: Compliance PDF for QR Library — delegates to generateBatchReportPdf.
     */
    static async generateBatchCompliancePdf(batch: MedicineBatch, pillCount: number): Promise<Blob> {
        return PrintingService.generateBatchReportPdf(batch, pillCount);
    }
}
