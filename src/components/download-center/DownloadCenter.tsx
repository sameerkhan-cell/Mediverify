import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Download, FileText, Archive, ImageIcon, Code2, CheckCircle2,
    Package, Pill, Loader2, Printer, FileDown, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DualQRResult } from "@/types/dual-qr";
import {
    exportQRCanvasToPng, triggerDownload,
    buildQrSvg
} from "@/services/qr/qr-generator";
import { PrintingService } from "@/services/printing/printing-service";
import { ExportService } from "@/services/export/export-service";
import { ease } from "@/lib/motion";
import { saveAs } from "file-saver";

interface Props {
    result: DualQRResult;
    boxQrCanvasRef: React.RefObject<HTMLDivElement | null>;
}

type DlKey = "box-png" | "box-svg" | "box-pdf" | "pill-sheet" | "pill-zip-bulk" | "batch-report-pdf";
type DlStatus = "idle" | "loading" | "done";

interface DownloadItem {
    key: DlKey;
    label: string;
    description: string;
    icon: React.ElementType;
    accentClass: string;
    badgeText: string;
}

const DOWNLOADS: DownloadItem[] = [
    {
        key: "box-pdf",
        label: "Box Label — A4 PDF",
        description: "Official 3cm × 3cm print layout",
        icon: Printer,
        accentClass: "text-primary bg-primary/10",
        badgeText: "Print",
    },
    {
        key: "pill-sheet",
        label: "Pill Sheet — Micro QR",
        description: "Standardized 0.8cm × 0.8cm strip layout",
        icon: Layers,
        accentClass: "text-success bg-success/10",
        badgeText: "Print",
    },
    {
        key: "pill-zip-bulk",
        label: "Industrial ZIP Export",
        description: "PNG assets + CSV data for vendors",
        icon: Archive,
        accentClass: "text-warning-foreground bg-warning/10",
        badgeText: "Bulk",
    },
    {
        key: "batch-report-pdf",
        label: "Batch Report — Secure PDF",
        description: "Blockchain-verified compliance document",
        icon: FileDown,
        accentClass: "text-primary bg-primary/10",
        badgeText: "Legal",
    },
    {
        key: "box-png",
        label: "Box QR — PNG",
        description: "High-resolution transparent asset",
        icon: ImageIcon,
        accentClass: "text-muted-foreground bg-secondary/40",
        badgeText: "Asset",
    },
];

export function DownloadCenter({ result, boxQrCanvasRef }: Props) {
    const [statuses, setStatuses] = useState<Partial<Record<DlKey, DlStatus>>>({});

    const setStatus = (key: DlKey, status: DlStatus) =>
        setStatuses((prev) => ({ ...prev, [key]: status }));

    const handleAction = async (key: DlKey) => {
        const { batch, pills } = result;
        const batchId = batch.batchNumber;

        setStatus(key, "loading");

        try {
            switch (key) {
                case "box-pdf": {
                    const canvas = boxQrCanvasRef.current?.querySelector("canvas");
                    if (!canvas) throw new Error("Canvas not ready");
                    const dataUrl = canvas.toDataURL("image/png");
                    const blob = await PrintingService.generateBoxQrPdf(batch, dataUrl);
                    saveAs(blob, `MediVerify_Label_${batchId}.pdf`);
                    break;
                }
                case "pill-sheet": {
                    // Use a sample pill QR data URL for the sheet
                    // In a production app, you might generate 100+ unique canvases hidden
                    const canvas = boxQrCanvasRef.current?.querySelector("canvas"); // placeholder
                    if (!canvas) throw new Error("Canvas not ready");
                    const dataUrl = canvas.toDataURL("image/png");
                    const blob = await PrintingService.generatePillQrSheetPdf(batch, pills, dataUrl);
                    saveAs(blob, `MediVerify_PillSheet_${batchId}.pdf`);
                    break;
                }
                case "pill-zip-bulk": {
                    const canvas = boxQrCanvasRef.current?.querySelector("canvas");
                    const blob = canvas ? await new Promise<Blob>(r => canvas.toBlob(b => r(b!))) : undefined;
                    await ExportService.exportPillQrsAsZip(batch, pills, blob);
                    break;
                }
                case "batch-report-pdf": {
                    const blob = await PrintingService.generateBatchReportPdf(batch, result.totalPillsGenerated);
                    saveAs(blob, `MediVerify_BatchReport_${batchId}.pdf`);
                    break;
                }
                case "box-png": {
                    const canvas = boxQrCanvasRef.current?.querySelector("canvas");
                    if (!canvas) {
                        console.error("Box QR canvas not found in DOM");
                        break;
                    }
                    const dataUrl = exportQRCanvasToPng(canvas, batch.boxQrCode, `MediVerify · ${batch.medicineName}`);
                    triggerDownload(dataUrl, `MediVerify-BoxQR-${batchId}.png`);
                    break;
                }
            }

            setStatus(key, "done");
            setTimeout(() => setStatus(key, "idle"), 3000);
        } catch (error) {
            console.error("Export failed:", error);
            setStatus(key, "idle");
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-[14px] font-bold flex items-center gap-2">
                        <Download className="h-4 w-4 text-primary" />
                        Dual QR Download Center
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        Enterprise-grade export and industrial print layouts
                    </p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-secondary/50 border border-border/40 px-3 py-1.5">
                    <Package className="h-3 w-3 text-primary" />
                    <span className="text-[11px] font-semibold tabular-nums">
                        1 Box + <span className="text-success">{result.totalPillsGenerated.toLocaleString()}</span> Pills
                    </span>
                </div>
            </div>

            {/* Download grid */}
            <div className="grid grid-cols-1 gap-2.5">
                {DOWNLOADS.map((item) => {
                    const status = statuses[item.key] || "idle";
                    const isLoading = status === "loading";
                    const isDone = status === "done";
                    return (
                        <motion.div
                            key={item.key}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 rounded-2xl border border-border/40 bg-secondary/15 p-3.5 transition-all duration-200 hover:bg-secondary/25"
                        >
                            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${item.accentClass}`}>
                                <item.icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-[13px] font-bold">{item.label}</p>
                                    <span className="shrink-0 rounded-full bg-background border border-border/40 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                                        {item.badgeText}
                                    </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate font-medium">{item.description}</p>
                            </div>

                            <Button
                                size="sm"
                                variant={isDone ? "outline" : "default"}
                                onClick={() => handleAction(item.key)}
                                disabled={isLoading}
                                className={`shrink-0 h-9 rounded-xl text-[12px] font-bold px-4 transition-all duration-300 ${isDone
                                    ? "border-success/40 text-success hover:bg-success/5 bg-success/5"
                                    : "bg-primary shadow-elegant hover:brightness-110 active:scale-95"
                                    }`}
                            >
                                <AnimatePresence mode="wait">
                                    {isLoading ? (
                                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        </motion.div>
                                    ) : isDone ? (
                                        <motion.div key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                        </motion.div>
                                    ) : (
                                        <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                                            {(item.key === 'box-pdf' || item.key === 'pill-sheet') ? <Printer className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
                                            {item.key === 'box-pdf' || item.key === 'pill-sheet' ? 'Print' : 'Get'}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Button>
                        </motion.div>
                    );
                })}
            </div>

            {/* Verification proof */}
            <div className="mt-2 rounded-xl bg-primary/5 border border-primary/10 p-3 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <p className="text-[10px] text-primary font-bold uppercase tracking-widest">
                    Blockchain Proof Embedded in All Certificates
                </p>
            </div>
        </div>
    );
}
