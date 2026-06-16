// ─── Dual QR Architecture Types ───────────────────────────────────────────────

export interface BatchRegistrationForm {
    medicineName: string;
    batchNumber: string;
    manufacturingDate: string;
    expiryDate: string;
    quantityBoxes: number;
    pillsPerBox: number;
    manufacturerCode: string;
    drapLicense: string;
    productCategory: string;
    boxesPerCarton: number;
    isExtension?: boolean;
}

export interface MedicineBatch {
    id: string;
    medicineName: string;
    batchNumber: string;
    manufacturingDate: string;
    expiryDate: string;
    quantityBoxes: number;
    pillsPerBox: number;
    totalPills: number;
    manufacturerCode: string;
    drapLicense: string;
    productCategory: string; // New field
    boxQrCode: string;
    boxQrScanned: boolean;
    qrGenerationStatus: "pending" | "completed" | "failed"; // New field
    createdAt: string;
    txHash: string;
    status: "Active" | "Recalled" | "Expired";
}

export interface PillRecord {
    id: string;
    medicineId: string;
    pillNumber: string; // zero-padded: "001", "002", ...
    pillQrCode: string; // PILL-{BatchNumber}-{PillNumber}-{ManufacturerCode}
    qrScanned: boolean;
    qrScannedAt: string | null;
    qrScannedLocation: string | null;
    blockchainTx: string | null;
    qrPrinted: boolean; // New field
    qrStatus: "active" | "suspected" | "invalidated"; // New field
    createdAt: string;
}

export interface CartonRecord {
    id: string;
    cartonNumber: string;
    qrCode: string; // From database
    cartonQrCode: string; // Unified for printing
    boxesCount: number;
}

export interface BoxRecord {
    id: string;
    boxNumber: string;
    qrCode: string; // From database
    boxQrCode: string; // Unified for printing
}

export interface DualQRResult {
    batch: MedicineBatch;
    pills: PillRecord[];
    cartons: CartonRecord[];
    boxes: BoxRecord[];
    totalPillsGenerated: number;
}

export type GenerationPhase =
    | "idle"
    | "registering"
    | "generating-box-qr"
    | "generating-pill-qrs"
    | "complete"
    | "error";

export interface GenerationProgress {
    phase: GenerationPhase;
    pillsGenerated: number;
    totalPills: number;
    percentage: number;
    currentMessage: string;
}

export type DownloadType = "box-png" | "box-svg" | "pill-sheet-pdf" | "pill-zip" | "batch-report-pdf";

export interface DownloadState {
    [key: string]: "idle" | "loading" | "done";
}
