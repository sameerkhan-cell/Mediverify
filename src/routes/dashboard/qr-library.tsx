import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    QrCode, Download, Printer, Eye, Search, Filter, Package, Calendar,
    ShieldCheck, Hash, ChevronDown, ChevronRight, FileText, Archive,
    CheckCircle2, AlertTriangle, Clock, X, Pill, Box, ExternalLink,
    ArrowDown, ZoomIn, Loader2, Table
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { DASH_NAV } from "@/config/nav";
import { ease } from "@/lib/motion";
import { DashShell } from "@/components/dashboard/DashShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQRStore } from "@/store/qr-store";
import type { MedicineBatch, PillRecord } from "@/types/dual-qr";
import { QRCodeCanvas } from "qrcode.react";
import QRCode from "qrcode";
import { PrintingService } from "@/services/printing/printing-service";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/qr-library")({
    head: () => ({
        meta: [
            { title: "QR Library — MediVerify" },
            { name: "description", content: "View and manage all previously generated QR codes and batch medicine records." },
        ],
    }),
    component: QRLibraryPage,
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(raw: string) {
    if (!raw) return "N/A";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" });
}

const STATUS_CFG = {
    Active: { cls: "bg-success/10 text-success border-success/25", dot: "bg-success", label: "Active" },
    Recalled: { cls: "bg-destructive/10 text-destructive border-destructive/25", dot: "bg-destructive", label: "Recalled" },
    Expired: { cls: "bg-warning/10 text-warning-foreground border-warning/25", dot: "bg-warning", label: "Expired" },
};

// ── Detail Panel ──────────────────────────────────────────────────────────────

function BatchDetailPanel({
    batch: initialBatch,
    onClose,
}: {
    batch: MedicineBatch;
    onClose: () => void;
}) {
    const { session } = useAuth();
    const [batch, setBatch] = useState<MedicineBatch>(initialBatch);
    const [batchPills, setBatchPills] = useState<PillRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);

    const boxQrRef = useRef<HTMLDivElement>(null);
    const pillQrRef = useRef<HTMLDivElement>(null);
    const samplePill = batchPills[0];
    const status = STATUS_CFG[batch.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.Active;

    useEffect(() => {
        const fetchFullDetails = async () => {
            setIsLoading(true);
            try {
                const token = session?.token || "";

                const res = await fetch(`/api/manufacturer/batch/${initialBatch.id}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (res.status === 401) {
                    toast.error("Your session has expired. Please log in again.");
                    return;
                }

                const data = await res.json();

                if (data.success) {
                    const b = data.data;
                    setBatch({
                        ...initialBatch,
                        txHash: b.txHash || initialBatch.txHash,
                        qrGenerationStatus: (b.blockchainStatus || "completed").toLowerCase(),
                        totalPills: b.totalPills ?? b._count?.pills ?? b.totalPillsGenerated ?? initialBatch.totalPills,
                        totalBoxes: b.totalBoxes ?? b._count?.boxes ?? initialBatch.quantityBoxes,
                        totalCartons: b.totalCartons ?? b._count?.cartons ?? 0,
                    });

                    if (b.pills) {
                        setBatchPills(b.pills.map((p: any) => ({
                            id: p.id,
                            medicineId: b.id,
                            pillNumber: p.pillNumber,
                            qrStatus: p.qrStatus?.toLowerCase() || "active",
                            pillQrCode: p.qrCode
                        })));
                    }
                } else if (data.error) {
                    toast.error(data.message || "Failed to load details");
                }
            } catch (err) {
                console.error("Failed to fetch batch pills:", err);
                toast.error("Failed to load full pill records.");
            } finally {
                setIsLoading(false);
            }
        };

        if (session?.token) {
            fetchFullDetails();
        }
    }, [initialBatch.id, session?.token]);

    const getCanvas = (ref: React.RefObject<HTMLDivElement | null>) =>
        ref.current?.querySelector("canvas") as HTMLCanvasElement | null;

    const downloadPng = (ref: React.RefObject<HTMLDivElement | null>, filename: string) => {
        const canvas = getCanvas(ref);
        if (!canvas) { toast.error("QR canvas not ready"); return; }
        canvas.toBlob((blob) => {
            if (blob) saveAs(blob, `${filename}.png`);
        });
        toast.success("PNG downloaded!");
    };

    const downloadBoxPdf = async () => {
        const token = session?.token || "";
        setIsDownloading(true);
        const t = toast.loading("Fetching all box records...");

        try {
            const res = await fetch(`/api/manufacturer/batch/${batch.id}?all=true`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            const rawBoxes = data.data?.boxes || [];

            // Map Prisma .qrCode to frontend .boxQrCode
            const freshBoxes = rawBoxes.map((b: any) => ({
                id: b.id,
                boxNumber: b.boxNumber,
                qrCode: b.qrCode,
                boxQrCode: b.qrCode
            }));

            if (freshBoxes.length === 0) {
                toast.error("No box records found.");
                toast.dismiss(t);
                return;
            }

            toast.message("Generating Box Labels...", { id: t });
            // For single-box mode, generate the primary label from fresh database records
            const dataUrl = await QRCode.toDataURL(freshBoxes[0].boxQrCode, { width: 300 });
            const blob = await PrintingService.generateBoxQrPdf(batch, dataUrl);
            saveAs(blob, `BoxLabels_${batch.batchNumber}.pdf`);

            toast.dismiss(t);
            toast.success("Box Labels downloaded!");
        } catch (err) {
            console.error("Box PDF generation failed:", err);
            toast.error("Failed to generate Box PDF.");
            toast.dismiss(t);
        } finally {
            setIsDownloading(false);
        }
    };

    const downloadCartonPdf = async () => {
        const token = session?.token || "";
        setIsDownloading(true);
        const t = toast.loading("Fetching carton records...");

        try {
            const res = await fetch(`/api/manufacturer/batch/${batch.id}?all=true`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();

            const rawCartons = data.data?.cartons || [];
            const freshCartons = rawCartons.map((c: any) => ({
                id: c.id,
                cartonNumber: c.cartonNumber,
                qrCode: c.qrCode,
                cartonQrCode: c.qrCode,
                boxesCount: c.boxesCount || (batch as any).boxesPerCarton || 0
            }));

            if (freshCartons.length === 0) {
                toast.error("No carton records found.");
                toast.dismiss(t);
                return;
            }

            toast.message("Generating Carton Labels...", { id: t });
            const blob = await (PrintingService as any).generateCartonQrPdf(batch, freshCartons);
            saveAs(blob, `CartonLabels_${batch.batchNumber}.pdf`);

            toast.dismiss(t);
            toast.success("Carton Labels downloaded!");
        } catch (err) {
            console.error("Carton PDF generation failed:", err);
            toast.error("Failed to generate Carton PDF.");
            toast.dismiss(t);
        } finally {
            setIsDownloading(false);
        }
    };

    const downloadPillSheetPdf = async () => {
        const pillCount = batch.totalPills || batchPills.length;
        const isLarge = pillCount > 1000;
        const token = session?.token || "";

        const t = toast.loading(isLarge
            ? `Generating Industrial Sheet (${pillCount.toLocaleString()} pills)... Please wait, do not close.`
            : "Generating Pill Sheet PDF…");

        try {
            if (isLarge) {
                // ... same large batch logic ... (keeping for performance)
                fetch(`/api/manufacturer/batch/${batch.id}?download=pdf`, {
                    headers: { "Authorization": `Bearer ${token}` }
                }).catch(() => { });

                let isReady = false;
                let attempts = 0;
                while (!isReady && attempts < 120) {
                    await new Promise(r => setTimeout(r, 5000));
                    const res = await fetch(`/api/manufacturer/batch/${batch.id}?download=pdf&check=true`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (data.ready) isReady = true;
                    attempts++;
                }

                if (!isReady) throw new Error("Server timeout");

                const res = await fetch(`/api/manufacturer/batch/${batch.id}?download=pdf`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const blob = await res.blob();
                saveAs(blob, `PillSheet_${batch.batchNumber}.pdf`);
            } else {
                // FRESH FETCH for small batches to avoid "0 pills" issue
                const res = await fetch(`/api/manufacturer/batch/${batch.id}?all=true`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const data = await res.json();

                // MAP API DATA: Prisma uses .qrCode, PrintingService expects .pillQrCode
                const rawPills = data.data?.pills || [];
                const freshPills = rawPills.map((p: any) => ({
                    id: p.id,
                    medicineId: batch.id,
                    pillNumber: p.pillNumber,
                    pillQrCode: p.qrCode, // Map here
                    qrStatus: p.status?.toLowerCase() || "active",
                    qrScanned: p.qrScanned || false,
                    createdAt: p.createdAt
                }));

                if (freshPills.length === 0) {
                    toast.error("No pill records found in database.");
                    toast.dismiss(t);
                    return;
                }

                const blob = await PrintingService.generatePillQrSheetPdf(batch, freshPills);
                saveAs(blob, `PillSheet_${batch.batchNumber}.pdf`);
            }
            toast.dismiss(t);
            toast.success("Pill Sheet downloaded!");
        } catch (err) {
            toast.dismiss(t);
            toast.error("Generation failed. Please try again.");
        }
    };

    const downloadFullRegistryCsv = async () => {
        const t = toast.loading("Preparing Data Registry CSV...");
        try {
            const token = session?.token || "";

            const response = await fetch(`/api/manufacturer/batch/${batch.id}?download=csv`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Export failed");
            const blob = await response.blob();
            saveAs(blob, `BatchRegistry_${batch.batchNumber}.csv`);
            toast.dismiss(t);
            toast.success("Registry CSV downloaded!");
        } catch {
            toast.dismiss(t);
            toast.error("CSV Export failed");
        }
    };

    const downloadCompliancePdf = async () => {
        const t = toast.loading("Generating Compliance Report…");
        try {
            const pillCount = batch.totalPills || batchPills.length;
            const blob = await PrintingService.generateBatchCompliancePdf(batch, pillCount);
            saveAs(blob, `ComplianceReport_${batch.batchNumber}.pdf`);
            toast.dismiss(t);
            toast.success("Compliance PDF downloaded!");
        } catch {
            toast.dismiss(t);
            toast.error("PDF generation failed");
        }
    };

    const printQR = (ref: React.RefObject<HTMLDivElement>, title: string) => {
        const canvas = getCanvas(ref);
        if (!canvas) { toast.error("QR canvas not ready"); return; }
        const dataUrl = canvas.toDataURL("image/png");
        const win = window.open("", "_blank");
        if (!win) return;
        win.document.write(`
      <html><head><title>Print — ${title}</title>
      <style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff;}
      img{max-width:300px;max-height:300px;}</style></head>
      <body><img src="${dataUrl}" onload="window.print();window.close();"/></body></html>
    `);
        win.document.close();
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.3, ease }}
            className="fixed inset-y-0 right-0 z-50 w-full md:max-w-xl bg-card border-l border-border/50 shadow-2xl overflow-y-auto"
        >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/40 bg-card/95 backdrop-blur px-6 py-4">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Batch Details</p>
                    <h2 className="text-[17px] font-bold mt-0.5">{batch.medicineName}</h2>
                </div>
                <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-xl border border-border/50 bg-secondary/40 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="p-6 space-y-6">
                {/* Status + Batch ID */}
                <div className="flex items-center justify-between">
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold", status.cls)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                        {status.label}
                    </span>
                    <span className="font-mono text-[12px] text-muted-foreground bg-secondary/40 px-3 py-1 rounded-lg">{batch.batchNumber}</span>
                </div>

                {/* QR Codes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Box QR */}
                    <div className="rounded-2xl border border-border/40 bg-secondary/20 p-4 flex flex-col items-center gap-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Box className="h-3 w-3" /> Box QR
                        </p>
                        <div ref={boxQrRef} className="rounded-xl overflow-hidden bg-white p-2 shadow-sm">
                            <QRCodeCanvas value={batch.boxQrCode || `BOX-${batch.batchNumber}`} size={120} level="H" bgColor="#ffffff" fgColor="#0a0c18" />
                        </div>
                        <div className="flex gap-1.5 w-full">
                            <Button size="sm" variant="outline" className="flex-1 rounded-lg text-[10px] h-7 gap-1" onClick={() => downloadPng(boxQrRef, `BoxQR_${batch.batchNumber}`)}>
                                <Download className="h-3 w-3" /> PNG
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 rounded-lg text-[10px] h-7 gap-1" onClick={downloadBoxPdf}>
                                <FileText className="h-3 w-3" /> PDF
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 rounded-lg text-[10px] h-7 gap-1" onClick={() => printQR(boxQrRef, `Box QR — ${batch.batchNumber}`)}>
                                <Printer className="h-3 w-3" /> Print
                            </Button>
                        </div>
                    </div>

                    {/* Pill QR (sample) */}
                    <div className="rounded-2xl border border-border/40 bg-secondary/20 p-4 flex flex-col items-center gap-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Pill className="h-3 w-3" /> Pill #001
                        </p>
                        <div ref={pillQrRef} className="rounded-xl overflow-hidden bg-white p-2 shadow-sm">
                            <QRCodeCanvas value={samplePill?.pillQrCode || `PILL-${batch.batchNumber}-001`} size={120} level="H" bgColor="#ffffff" fgColor="#0a0c18" />
                        </div>
                        <div className="flex gap-1.5 w-full">
                            <Button size="sm" variant="outline" className="flex-1 rounded-lg text-[10px] h-7 gap-1" onClick={() => downloadPng(pillQrRef, `PillQR_${batch.batchNumber}_001`)}>
                                <Download className="h-3 w-3" /> PNG
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 rounded-lg text-[10px] h-7 gap-1" onClick={downloadPillSheetPdf}>
                                <FileText className="h-3 w-3" /> Sheet
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 rounded-lg text-[10px] h-7 gap-1" onClick={() => printQR(pillQrRef, `Pill QR — ${batch.batchNumber}`)}>
                                <Printer className="h-3 w-3" /> Print
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Medicine Details */}
                <div className="rounded-2xl border border-border/40 bg-secondary/20 p-5 space-y-3">
                    <h3 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Medicine Details</h3>
                    {[
                        { label: "Medicine Name", value: batch.medicineName },
                        { label: "Category", value: batch.productCategory || "Pharmaceutical" },
                        { label: "Manufacturer Code", value: batch.manufacturerCode },
                        { label: "DRAP License", value: batch.drapLicense },
                        { label: "Manufacturing Date", value: formatDate(batch.manufacturingDate) },
                        { label: "Expiry Date", value: formatDate(batch.expiryDate) },
                        { label: "Total Cartons", value: ((batch as any).totalCartons ?? 0).toString() },
                        { label: "Qty (Boxes)", value: ((batch as any).totalBoxes ?? batch.quantityBoxes ?? 0).toLocaleString() },
                        { label: "Pills Per Box", value: (batch.pillsPerBox ?? 0).toString() },
                        { label: "Total Pills", value: ((batch as any).totalPills ?? batch.totalPills ?? 0).toLocaleString() },
                        { label: "Generation Status", value: (batch.qrGenerationStatus || "completed").toUpperCase() },
                        { label: "Registered On", value: formatDate(batch.createdAt) },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                            <span className="text-[12px] text-muted-foreground">{label}</span>
                            <span className="text-[12px] font-semibold text-right max-w-[55%] truncate">{value || "N/A"}</span>
                        </div>
                    ))}
                </div>

                {/* Blockchain */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                    <h3 className="text-[12px] font-bold uppercase tracking-wider text-primary flex items-center gap-2 mb-3">
                        <Hash className="h-3.5 w-3.5" /> Blockchain Anchor
                    </h3>
                    <p className="font-mono text-[11px] text-primary/80 break-all leading-relaxed">{batch.txHash || "PENDING"}</p>
                </div>

                {/* Pill records preview */}
                {batchPills.length > 0 && (
                    <div className="rounded-2xl border border-border/40 bg-secondary/20 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Pill Records ({batchPills.length.toLocaleString()} total)</h3>
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                            {batchPills.slice(0, 20).map((pill) => (
                                <div key={pill.id} className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2">
                                    <span className="font-mono text-[11px] text-muted-foreground">#{pill.pillNumber}</span>
                                    <span className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                        pill.qrStatus === "active" ? "bg-success/10 text-success" :
                                            pill.qrStatus === "suspected" ? "bg-warning/10 text-warning-foreground" :
                                                "bg-destructive/10 text-destructive"
                                    )}>{pill.qrStatus}</span>
                                    <span className="font-mono text-[10px] text-muted-foreground/60 max-w-[120px] truncate">{pill.pillQrCode}</span>
                                </div>
                            ))}
                            {batchPills.length > 20 && (
                                <p className="text-[11px] text-muted-foreground text-center pt-2">
                                    + {(batchPills.length - 20).toLocaleString()} more pill records…
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Export / Download Actions */}
                <div className="rounded-2xl border border-border/40 bg-secondary/20 p-5 space-y-2">
                    <h3 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Export Options</h3>
                    <Button
                        disabled={isDownloading}
                        className="w-full rounded-xl h-10 gap-2 text-[13px] bg-gradient-primary shadow-elegant"
                        onClick={downloadCartonPdf}
                    >
                        {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
                        Download Carton QR Label PDF
                    </Button>
                    <Button
                        disabled={isDownloading}
                        className="w-full rounded-xl h-10 gap-2 text-[13px] bg-white border border-border hover:bg-secondary/50 text-foreground"
                        onClick={downloadBoxPdf}
                    >
                        {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 text-primary" />}
                        Download Box QR Label PDF
                    </Button>
                    <Button
                        disabled={isDownloading}
                        variant="outline"
                        className="w-full rounded-xl h-10 gap-2 text-[13px]"
                        onClick={downloadPillSheetPdf}
                    >
                        {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDown className="h-4 w-4" />}
                        Download Pill QR Sheet PDF
                    </Button>
                    <Button
                        disabled={isDownloading}
                        variant="outline"
                        className="w-full rounded-xl h-10 gap-2 text-[13px]"
                        onClick={downloadCompliancePdf}
                    >
                        {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                        Download Compliance Report PDF
                    </Button>
                    <Button
                        disabled={isDownloading}
                        variant="outline"
                        className="w-full rounded-xl h-10 gap-2 text-[13px] border-primary/30 hover:bg-primary/5"
                        onClick={downloadFullRegistryCsv}
                    >
                        {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Table className="h-4 w-4 text-primary" />}
                        Download Complete Data Registry (CSV)
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

// ── Batch Card ────────────────────────────────────────────────────────────────

function BatchCard({ batch, pills, onClick }: { batch: MedicineBatch; pills: PillRecord[]; onClick: () => void }) {
    const batchPills = pills.filter((p) => p.medicineId === batch.id);
    const status = STATUS_CFG[batch.status] ?? STATUS_CFG.Active;
    const suspectedCount = batchPills.filter((p) => p.qrStatus === "suspected").length;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className="card-premium group relative overflow-hidden cursor-pointer hover:shadow-card-hover transition-all duration-300"
            onClick={onClick}
        >
            {/* Ambient glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />

            <div className="p-5">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                            <QrCode className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[14px] font-bold truncate">{batch.medicineName}</p>
                            <p className="text-[11px] text-muted-foreground font-mono">{batch.batchNumber}</p>
                        </div>
                    </div>
                    <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold", status.cls)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                        {status.label}
                    </span>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                        { icon: Package, label: "Boxes", value: (batch.quantityBoxes ?? 0).toLocaleString() },
                        { icon: Pill, label: "Pills", value: (batch.totalPills ?? 0).toLocaleString() },
                        { icon: suspectedCount > 0 ? AlertTriangle : CheckCircle2, label: "Alerts", value: suspectedCount.toString(), tone: suspectedCount > 0 ? "text-warning-foreground" : "text-success" },
                    ].map(({ icon: Icon, label, value, tone }) => (
                        <div key={label} className="rounded-xl bg-secondary/30 p-2.5 text-center">
                            <Icon className={cn("h-3.5 w-3.5 mx-auto mb-1", tone || "text-muted-foreground")} />
                            <p className="text-[13px] font-bold tabular-nums">{value}</p>
                            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
                        </div>
                    ))}
                </div>

                {/* Dates */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/30 pt-3">
                    <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Mfg: {formatDate(batch.manufacturingDate)}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Exp: {formatDate(batch.expiryDate)}
                    </span>
                </div>
            </div>

            {/* Footer CTA */}
            <div className="border-t border-border/30 px-5 py-3 flex items-center justify-between bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                <span className="text-[11px] text-muted-foreground">Registered {formatDate(batch.createdAt)}</span>
                <span className="text-[11px] font-semibold text-primary flex items-center gap-1">
                    View Details <ChevronRight className="h-3.5 w-3.5" />
                </span>
            </div>
        </motion.div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function QRLibraryPage() {
    const { user, isAuthenticated, signOut, isLoading, session } = useAuth();
    const { batches, pills, setBatches } = useQRStore();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Recalled" | "Expired">("All");
    const [selectedBatch, setSelectedBatch] = useState<MedicineBatch | null>(null);

    useEffect(() => {
        if (isAuthenticated && user?.role === "manufacturer") {
            fetch("/api/manufacturer/batches", {
                headers: {
                    "Authorization": `Bearer ${session?.token || ""}`
                }
            })
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        setBatches(res.data.map((b: any) => ({
                            id: b.id,
                            batchNumber: b.batchNumber,
                            medicineName: b.medicine.name,
                            quantityBoxes: b.quantityBoxes ?? 0,
                            totalPills: b.totalPillsGenerated ?? 0,
                            pillsPerBox: b.pillsPerBox ?? 0,
                            manufacturingDate: b.manufacturingDate,
                            expiryDate: b.expiryDate,
                            status: b.medicineStatus === "MANUFACTURED" ? "Active" : b.medicineStatus === "RECALLED" ? "Recalled" : b.medicineStatus === "EXPIRED" ? "Expired" : b.status === "ACTIVE" ? "Active" : b.status === "RECALLED" ? "Recalled" : b.status === "EXPIRED" ? "Expired" : "Active",
                            productCategory: b.category,
                            manufacturerCode: b.medicine.manufacturer?.companyName?.substring(0, 3)?.toUpperCase() || "MFG",
                            drapLicense: b.medicine.manufacturer?.licenseNumber || "DRAP-LIC-001",
                            txHash: b.txHash || "0x" + "0".repeat(40),
                            createdAt: b.createdAt,
                            qrGenerationStatus: b.blockchainStatus?.toLowerCase() || "completed",
                            boxQrCode: b.boxQRCode || `BOX-${b.batchNumber}-MFG`
                        })));
                    }
                })
                .catch(err => console.error("Failed to sync batches:", err));
        }
    }, [isAuthenticated, user?.role, setBatches]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) return <Navigate to="/auth/login" />;
    if (user?.role !== "manufacturer") return <Navigate to="/auth/login" />;

    const filtered = batches.filter((b) => {
        const matchSearch =
            b.medicineName.toLowerCase().includes(search.toLowerCase()) ||
            b.batchNumber.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "All" || b.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalPills = batches.reduce((acc, b) => acc + (b.totalPills ?? 0), 0);
    const activeBatches = batches.filter((b) => (b.status ?? "Active") === "Active").length;
    const suspectedPills = pills.filter((p) => p.qrStatus === "suspected").length;

    return (
        <DashShell
            title="QR Library"
            subtitle="All previously generated QR codes and batch records"
            badge={`${batches.length} Batches`}
            nav={DASH_NAV}
        >
            {/* ── Stats ── */}
            <div className="grid gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { icon: Archive, label: "Total Batches", value: batches.length, color: "text-primary", bg: "bg-primary/10" },
                    { icon: Package, label: "Active Batches", value: activeBatches, color: "text-success", bg: "bg-success/10" },
                    { icon: Pill, label: "Total Pills", value: totalPills.toLocaleString(), color: "text-foreground", bg: "bg-secondary/60" },
                    { icon: AlertTriangle, label: "Suspected Pills", value: suspectedPills, color: "text-warning-foreground", bg: "bg-warning/10" },
                ].map(({ icon: Icon, label, value, color, bg }) => (
                    <motion.div
                        key={label}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease }}
                        className="card-premium p-5 flex items-center gap-4"
                    >
                        <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", bg)}>
                            <Icon className={cn("h-5 w-5", color)} />
                        </div>
                        <div>
                            <p className={cn("text-[22px] font-black tabular-nums", color)}>{value}</p>
                            <p className="text-[11px] text-muted-foreground">{label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── Search & Filter ── */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        id="qr-library-search"
                        placeholder="Search by medicine name or batch code…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-10 rounded-xl text-[13px] bg-secondary/20 border-border/40"
                    />
                </div>
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                    {(["All", "Active", "Recalled", "Expired"] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                "rounded-full px-3 py-1.5 text-[12px] font-medium border transition-all duration-150",
                                statusFilter === s
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Grid ── */}
            {filtered.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-28 text-center"
                >
                    <div className="grid h-20 w-20 place-items-center rounded-2xl bg-secondary/30 mb-5">
                        <QrCode className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-[18px] font-bold mb-2">
                        {batches.length === 0 ? "No QR codes generated yet" : "No results found"}
                    </h3>
                    <p className="text-[14px] text-muted-foreground max-w-sm">
                        {batches.length === 0
                            ? "Register a batch from the Manufacturer Dashboard to start generating QR codes. They will all appear here."
                            : "Try adjusting your search or filter criteria."}
                    </p>
                </motion.div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((batch) => (
                        <BatchCard
                            key={batch.id}
                            batch={batch}
                            pills={pills}
                            onClick={() => setSelectedBatch(batch)}
                        />
                    ))}
                </div>
            )}

            {/* ── Detail Side Panel ── */}
            <AnimatePresence>
                {selectedBatch && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
                            onClick={() => setSelectedBatch(null)}
                        />
                        <BatchDetailPanel
                            batch={selectedBatch}
                            onClose={() => setSelectedBatch(null)}
                        />
                    </>
                )}
            </AnimatePresence>
        </DashShell>
    );
}
