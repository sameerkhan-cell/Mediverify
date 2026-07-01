import QRCode from "qrcode";
import type { QRCodeToDataURLOptions } from "qrcode";
import fs from "fs";
import path from "path";

export class QRService {
    // Vercel's /var/task is read-only. Use /tmp (writable) in serverless,
    // and the local storage directory in development.
    private static STORAGE_ROOT = process.env.VERCEL
        ? "/tmp/qr-assets"
        : path.join(process.cwd(), "storage", "qr-assets");
    /**
     * Generate a QR code as a base64 data-URL (PNG).
     * Suitable for embedding in HTML / PDF.
     */
    static async generateDataURL(
        text: string,
        options: QRCodeToDataURLOptions = {}
    ): Promise<string> {
        try {
            return await QRCode.toDataURL(text, {
                errorCorrectionLevel: "H",
                margin: 1,
                width: 400,
                ...options,
            });
        } catch (err) {
            console.error("QR Generation Error:", err);
            throw new Error("Failed to generate QR code.");
        }
    }

    /**
     * Generate a QR code as a raw PNG Buffer.
     * Suitable for writing to disk or embedding in ZIP archives
     * without a base64 round-trip.
     */
    static async generatePNGBuffer(text: string, size = 400): Promise<Buffer> {
        try {
            return await QRCode.toBuffer(text, {
                errorCorrectionLevel: "H",
                margin: 1,
                width: size,
                type: "png",
            });
        } catch (err) {
            console.error("QR PNG Buffer Error:", err);
            throw new Error("Failed to generate QR PNG buffer.");
        }
    }

    /**
     * Generate a QR code as an SVG string.
     * Suitable for high-quality vector printing.
     */
    static async generateSVG(text: string): Promise<string> {
        try {
            return await QRCode.toString(text, {
                type: "svg",
                errorCorrectionLevel: "H",
            });
        } catch (err) {
            throw new Error("Failed to generate SVG QR.");
        }
    }

    /**
     * Format for Box QR:  BOX-{BatchNumber}-{CompanyCode}
     * Example:            BOX-PND2024-A1-MFG-GSK001
     */
    static formatBoxCode(batchNumber: string, companyCode: string): string {
        return `BOX-${batchNumber.toUpperCase()}-${companyCode.toUpperCase()}`;
    }

    /**
     * Format for Pill QR: PILL-{BatchNumber}-{PillIndex}-{CompanyCode}
     * Example:            PILL-PND2024-A1-0001-MFG-GSK001
     */
    static formatPillCode(
        batchNumber: string,
        index: string | number,
        companyCode: string
    ): string {
        const idx = index.toString().padStart(4, "0");
        return `PILL-${batchNumber.toUpperCase()}-${idx}-${companyCode.toUpperCase()}`;
    }

    /**
     * Saves an asset to the local filesystem and returns the relative path.
     * Path: storage/qr-assets/{batchId}/{fileName}
     */
    static async saveAsset(
        batchId: string,
        fileName: string,
        data: Buffer | string
    ): Promise<string> {
        const dir = path.join(this.STORAGE_ROOT, batchId);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const filePath = path.join(dir, fileName);
        if (typeof data === "string" && data.startsWith("data:")) {
            const base64Data = data.split(",")[1];
            fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
        } else {
            fs.writeFileSync(filePath, data);
        }

        // Return the virtual path as requested
        return `/qr-assets/${batchId}/${fileName}`;
    }
}
