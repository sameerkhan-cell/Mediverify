import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    QrCode, X, ShieldCheck, Package, Pill, Building2,
    Calendar, Hash, FileDigit, Layers, ChevronRight,
    CheckCircle2, AlertCircle, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ease } from "@/lib/motion";
import { useBatchGeneration } from "@/hooks/useBatchGeneration";
import { QRGenerationProgress } from "@/components/qr/QRGenerationProgress";
import { DualQRCard } from "@/components/qr/DualQRCard";
import { DownloadCenter } from "@/components/download-center/DownloadCenter";
import type { BatchRegistrationForm } from "@/types/dual-qr";
import { exportQRCanvasToPng, triggerDownload } from "@/services/qr/qr-generator";

type ModalStep = "form" | "generating" | "result" | "downloads";

const DRAP_DEFAULT = "DRAP-MFG-2024-GSK-001";
const MFG_CODE_DEFAULT = "GSK";

interface Props {
    open: boolean;
    onClose: () => void;
}

function Label({ children }: { children: React.ReactNode }) {
    return (
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-foreground/70">
            {children}
        </label>
    );
}

function FieldRow({ icon: Icon, label, children }: { icon: React.ElementType; label: React.ReactNode; children: React.ReactNode }) {
    return (
        <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground/70">
                <Icon className="h-3 w-3" />
                {label}
            </label>
            {children}
        </div>
    );
}

export function DualQRModal({ open, onClose }: Props) {
    const [step, setStep] = useState<ModalStep>("form");
    const [form, setForm] = useState<BatchRegistrationForm>({
        medicineName: "",
        batchNumber: "",
        productCategory: "Pharmaceutical",
        manufacturingDate: new Date().toISOString().slice(0, 7),
        expiryDate: "2027-03",
        quantityBoxes: 100,
        pillsPerBox: 20,
        boxesPerCarton: 10,
        manufacturerCode: MFG_CODE_DEFAULT,
        drapLicense: DRAP_DEFAULT,
    });

    const { progress, result, error, isGenerating, generate, reset } = useBatchGeneration();
    const boxQrRef = useRef<HTMLDivElement>(null);

    const set = (key: keyof BatchRegistrationForm, val: string | number) =>
        setForm((f) => ({ ...f, [key]: val }));

    const totalPills = form.quantityBoxes * form.pillsPerBox;
    const totalCartons = Math.ceil(form.quantityBoxes / form.boxesPerCarton);
    const canGenerate = form.medicineName.trim().length > 0 && form.quantityBoxes > 0 && form.pillsPerBox > 0 && form.boxesPerCarton > 0;

    const handleGenerate = async () => {
        setStep("generating");
        const success = await generate(form);
        if (success) {
            setStep("result");
        } else {
            setStep("form");
        }
    };

    const handleClose = () => {
        reset();
        setStep("form");
        onClose();
    };

    const handleReset = () => {
        reset();
        setStep("form");
        setForm({
            medicineName: "",
            batchNumber: "",
            productCategory: "Pharmaceutical",
            manufacturingDate: new Date().toISOString().slice(0, 7),
            expiryDate: "2027-03",
            quantityBoxes: 100,
            pillsPerBox: 20,
            boxesPerCarton: 10,
            manufacturerCode: MFG_CODE_DEFAULT,
            drapLicense: DRAP_DEFAULT,
        });
    };

    const handleCartonDownload = useCallback((canvas: HTMLCanvasElement) => {
        if (!result?.cartons?.length) return;
        const dataUrl = exportQRCanvasToPng(
            canvas,
            result.cartons[0].qrCode,
            `MediVerify · ${result.batch.medicineName}`
        );
        triggerDownload(dataUrl, `MediVerify-CartonQR-${result.batch.batchNumber}.png`);
    }, [result]);

    const handleBoxDownload = useCallback((canvas: HTMLCanvasElement) => {
        if (!result) return;
        const dataUrl = exportQRCanvasToPng(
            canvas,
            result.boxes[0].qrCode,
            `MediVerify · ${result.batch.medicineName}`
        );
        triggerDownload(dataUrl, `MediVerify-BoxQR-${result.batch.batchNumber}.png`);
    }, [result]);

    const handlePillDownload = useCallback((canvas: HTMLCanvasElement) => {
        const dataUrl = exportQRCanvasToPng(
            canvas,
            result?.pills[0]?.pillQrCode ?? "",
            `MediVerify · ${result?.batch.medicineName ?? ""}`
        );
        triggerDownload(dataUrl, `MediVerify-SamplePillQR-${result?.batch.batchNumber ?? "batch"}.png`);
    }, [result]);

    const stepTitles: Record<ModalStep, { title: string; sub: string }> = {
        form: { title: "Register Batch + Generate Dual QR", sub: "Box QR & per-pill QR codes for Pakistan-style dispensing" },
        generating: { title: "Generating Dual QR Architecture", sub: "Please wait — minting on MediVerify blockchain…" },
        result: { title: "Dual QR System Ready", sub: `${result?.totalPillsGenerated?.toLocaleString() ?? 0} pill QRs + ${result?.boxes.length.toLocaleString() ?? 0} box QRs + ${result?.cartons.length.toLocaleString() ?? 0} carton QRs generated` },
        downloads: { title: "Download Center", sub: "Export all QR codes and batch documentation" },
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={step === "generating" ? undefined : handleClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative w-full max-w-2xl rounded-2xl border border-border/50 bg-card shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
                        initial={{ opacity: 0, scale: 0.94, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 24 }}
                        transition={{ duration: 0.35, ease }}
                    >
                        {/* Ambient gradient top */}
                        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-primary/8 to-transparent pointer-events-none" />
                        <div className="absolute inset-0 holo opacity-20 pointer-events-none" />

                        {/* Header */}
                        <div className="relative z-10 flex items-center gap-4 border-b border-border/40 px-6 py-4 shrink-0">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-elegant">
                                <QrCode className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-[15px] font-bold leading-snug truncate">
                                    {stepTitles[step].title}
                                </h2>
                                <p className="text-[11px] text-muted-foreground truncate">
                                    {stepTitles[step].sub}
                                </p>
                            </div>

                            {/* Step pills */}
                            <div className="hidden sm:flex items-center gap-1.5 mr-2">
                                {(["form", "generating", "result", "downloads"] as ModalStep[]).map((s, i) => (
                                    <div
                                        key={s}
                                        className={`h-1.5 rounded-full transition-all duration-400 ${s === step ? "w-5 bg-primary" :
                                            (["form", "generating", "result", "downloads"].indexOf(step) > i) ? "w-2 bg-success" :
                                                "w-2 bg-border"
                                            }`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={step === "generating" ? undefined : handleClose}
                                disabled={step === "generating"}
                                className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary transition-colors disabled:opacity-30 shrink-0"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Body (scrollable) */}
                        <div className="relative z-10 flex-1 overflow-y-auto px-6 py-5">
                            <AnimatePresence mode="wait">

                                {/* ── STEP 1: Form ─────────────────────────────────────────── */}
                                {step === "form" && (
                                    <motion.div
                                        key="form"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.28, ease }}
                                        className="space-y-5"
                                    >
                                        {/* Dual QR info banner */}
                                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex gap-3">
                                            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[13px] font-semibold text-primary">Supply Chain Hierarchy</p>
                                                <p className="text-[12px] text-foreground/70 mt-0.5">
                                                    {totalCartons} Carton QR + {form.quantityBoxes} Box QR + {totalPills > 0 ? <strong>{totalPills.toLocaleString()}</strong> : "N"} individual Pill QRs will be generated automatically.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Medicine Name */}
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <FieldRow icon={Pill} label={<>Medicine Name <span className="text-destructive">*</span></>}>
                                                <Input
                                                    value={form.medicineName}
                                                    onChange={(e) => set("medicineName", e.target.value)}
                                                    placeholder="e.g. Panadol Extra 500mg"
                                                    className="h-11 rounded-xl text-[14px] bg-secondary/20"
                                                    autoFocus
                                                />
                                            </FieldRow>
                                            <FieldRow icon={Layers} label="Product Category">
                                                <select
                                                    value={form.productCategory}
                                                    onChange={(e) => set("productCategory", e.target.value)}
                                                    className="flex h-11 w-full rounded-xl border border-input bg-secondary/20 px-3 py-2 text-[14px] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                                >
                                                    <option>Pharmaceutical</option>
                                                    <option>Vaccine</option>
                                                    <option>Nutraceutical</option>
                                                    <option>Biological</option>
                                                </select>
                                            </FieldRow>
                                        </div>

                                        {/* Batch Number */}
                                        <FieldRow icon={Hash} label="Batch Number (leave blank to auto-generate)">
                                            <Input
                                                value={form.batchNumber}
                                                onChange={(e) => set("batchNumber", e.target.value)}
                                                placeholder="e.g. PND2024-A1 (auto if blank)"
                                                className="h-11 rounded-xl text-[14px] bg-secondary/20 font-mono"
                                            />
                                        </FieldRow>

                                        {/* Dates row */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <FieldRow icon={Calendar} label="Manufacturing Date">
                                                <Input
                                                    type="month"
                                                    value={form.manufacturingDate}
                                                    onChange={(e) => set("manufacturingDate", e.target.value)}
                                                    className="h-11 rounded-xl text-[14px] bg-secondary/20"
                                                />
                                            </FieldRow>
                                            <FieldRow icon={Calendar} label="Expiry Date">
                                                <Input
                                                    type="month"
                                                    value={form.expiryDate}
                                                    onChange={(e) => set("expiryDate", e.target.value)}
                                                    className="h-11 rounded-xl text-[14px] bg-secondary/20"
                                                />
                                            </FieldRow>
                                        </div>

                                        {/* Quantity + Pills Per Box + Boxes Per Carton */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <FieldRow icon={Package} label="Quantity (Boxes)">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={100000}
                                                    value={form.quantityBoxes}
                                                    onChange={(e) => set("quantityBoxes", Math.max(1, parseInt(e.target.value) || 1))}
                                                    className="h-11 rounded-xl text-[14px] bg-secondary/20"
                                                />
                                            </FieldRow>
                                            <FieldRow icon={Layers} label={<>Total Pills Per Box <span className="text-destructive">*</span></>}>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={1000}
                                                    value={form.pillsPerBox}
                                                    onChange={(e) => set("pillsPerBox", Math.max(1, parseInt(e.target.value) || 1))}
                                                    className="h-11 rounded-xl text-[14px] bg-secondary/20"
                                                />
                                            </FieldRow>
                                        </div>

                                        <FieldRow icon={Layers} label="Boxes Per Carton">
                                            <Input
                                                type="number"
                                                min={1}
                                                max={1000}
                                                value={form.boxesPerCarton}
                                                onChange={(e) => set("boxesPerCarton", Math.max(1, parseInt(e.target.value) || 10))}
                                                className="h-11 rounded-xl text-[14px] bg-secondary/20"
                                            />
                                        </FieldRow>

                                        {/* Pill count preview */}
                                        <div className="rounded-xl border border-success/20 bg-success/5 px-4 py-3 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <Pill className="h-4 w-4 text-success" />
                                                    <span className="text-[13px] font-medium text-success">Total Pill QRs to generate:</span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground mt-0.5 ml-6">
                                                    {totalCartons} cartons → {form.quantityBoxes} boxes → {totalPills.toLocaleString()} pills
                                                </span>
                                            </div>
                                            <span className="font-mono text-[18px] font-black text-success tabular-nums">
                                                {totalPills.toLocaleString()}
                                            </span>
                                        </div>

                                        {/* Manufacturer row */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <FieldRow icon={Building2} label="Manufacturer Code">
                                                <Input
                                                    value={form.manufacturerCode}
                                                    onChange={(e) => set("manufacturerCode", e.target.value.toUpperCase())}
                                                    placeholder="e.g. GSK"
                                                    className="h-11 rounded-xl text-[14px] bg-secondary/20 font-mono uppercase"
                                                    maxLength={10}
                                                />
                                            </FieldRow>
                                            <FieldRow icon={FileDigit} label="DRAP License">
                                                <Input
                                                    value={form.drapLicense}
                                                    readOnly
                                                    className="h-11 rounded-xl text-[14px] bg-secondary/30 font-mono text-muted-foreground cursor-not-allowed"
                                                />
                                            </FieldRow>
                                        </div>

                                        {/* QR preview labels */}
                                        <div className="rounded-xl border border-border/40 bg-secondary/20 p-4 space-y-2">
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">QR Code Preview</p>
                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground mb-1">Box QR</p>
                                                    <p className="font-mono text-[11px] font-bold text-primary break-all">
                                                        BOX-{form.batchNumber || "[AUTO]"}-{form.manufacturerCode || "CODE"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground mb-1">Sample Pill QR</p>
                                                    <p className="font-mono text-[11px] font-bold text-success break-all">
                                                        PILL-{form.batchNumber || "[AUTO]"}-001-{form.manufacturerCode || "CODE"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ── STEP 2: Generating ───────────────────────────────────── */}
                                {step === "generating" && (
                                    <motion.div
                                        key="generating"
                                        initial={{ opacity: 0, scale: 0.96 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.96 }}
                                        transition={{ duration: 0.28, ease }}
                                    >
                                        <QRGenerationProgress progress={progress} />
                                    </motion.div>
                                )}

                                {/* ── STEP 3: Result ───────────────────────────────────────── */}
                                <div className={step === "result" ? "block" : "hidden"}>
                                    {result && (
                                        <motion.div
                                            key="result"
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-5"
                                        >
                                            {/* Success banner */}
                                            <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/8 px-4 py-3.5">
                                                <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                                                <div>
                                                    <p className="text-[14px] font-bold text-success">Dual QR System Generated!</p>
                                                    <p className="text-[11px] text-foreground/70">
                                                        Batch <span className="font-mono font-semibold">{result.batch.batchNumber}</span> · {result.totalPillsGenerated.toLocaleString()} pill QRs + 1 box QR · TX: <span className="font-mono">{result.batch.txHash.slice(0, 18)}…</span>
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Hierarchy QR Cards */}
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                                {/* Carton QR */}
                                                <DualQRCard
                                                    type="box"
                                                    qrValue={result.cartons[0]?.qrCode ?? ""}
                                                    label={`Carton #001 of ${result.cartons.length}`}
                                                    sublabel={`${result.batch.medicineName} · ${result.cartons[0]?.boxesCount} boxes inside`}
                                                    badge="Carton Label"
                                                    onDownloadPng={handleCartonDownload}
                                                />

                                                {/* Box QR */}
                                                <div ref={boxQrRef}>
                                                    <DualQRCard
                                                        type="box"
                                                        qrValue={result.boxes[0]?.qrCode ?? ""}
                                                        label={`Box #0001 of ${result.boxes.length}`}
                                                        sublabel={`${result.batch.medicineName} · ${result.batch.pillsPerBox} pills`}
                                                        badge="Box Label"
                                                        onDownloadPng={handleBoxDownload}
                                                    />
                                                </div>

                                                {/* Sample Pill QR (first pill) */}
                                                <DualQRCard
                                                    type="pill"
                                                    qrValue={result.pills[0]?.pillQrCode ?? ""}
                                                    label={`Pill #001 of ${result.totalPillsGenerated.toLocaleString()}`}
                                                    sublabel={`Sample — ${result.totalPillsGenerated.toLocaleString()} total pills`}
                                                    badge={`${result.totalPillsGenerated.toLocaleString()} pills`}
                                                    onDownloadPng={handlePillDownload}
                                                />
                                            </div>

                                            {/* Summary row */}
                                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                                {[
                                                    { label: "Cartons", value: result.cartons.length.toLocaleString(), color: "text-primary", bg: "bg-primary/10" },
                                                    { label: "Box QRs", value: result.boxes.length.toLocaleString(), color: "text-primary", bg: "bg-primary/10" },
                                                    { label: "Pill QRs", value: result.totalPillsGenerated.toLocaleString(), color: "text-success", bg: "bg-success/10" },
                                                    { label: "Boxes", value: result.batch.quantityBoxes.toLocaleString(), color: "text-foreground", bg: "bg-secondary/50" },
                                                ].map((m) => (
                                                    <div key={m.label} className={`rounded-xl ${m.bg} border border-border/30 p-3 text-center`}>
                                                        <p className={`text-[18px] font-black tabular-nums ${m.color}`}>{m.value}</p>
                                                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{m.label}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                {/* ── STEP 4: Downloads ────────────────────────────────────── */}
                                {step === "downloads" && result && (
                                    <motion.div
                                        key="downloads"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.28, ease }}
                                    >
                                        <DownloadCenter result={result} boxQrCanvasRef={boxQrRef} />
                                    </motion.div>
                                )}

                                {/* Error state */}
                                {error && (
                                    <motion.div
                                        key="error"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 mt-4"
                                    >
                                        <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                                        <p className="text-[13px] text-destructive font-medium">{error}</p>
                                    </motion.div>
                                )}

                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div className="relative z-10 shrink-0 border-t border-border/40 bg-card/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between gap-3">

                            {step === "form" && (
                                <>
                                    <Button variant="ghost" onClick={handleClose} className="text-[13px]">
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleGenerate}
                                        disabled={!canGenerate}
                                        className="rounded-xl bg-gradient-primary shadow-elegant text-[13px] font-semibold gap-2 transition-all hover:scale-[1.02] hover:shadow-card-hover disabled:opacity-50"
                                    >
                                        <QrCode className="h-4 w-4" />
                                        Generate Dual QR System
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </>
                            )}

                            {step === "generating" && (
                                <p className="w-full text-center text-[12px] text-muted-foreground">
                                    ⚡ Generating {totalPills.toLocaleString()} QR codes — please wait…
                                </p>
                            )}

                            {step === "result" && result && (
                                <>
                                    <Button variant="outline" onClick={handleReset} className="rounded-xl text-[13px] border-border/60 gap-1.5">
                                        <ArrowLeft className="h-3.5 w-3.5" /> New Batch
                                    </Button>
                                    <Button
                                        onClick={() => setStep("downloads")}
                                        className="rounded-xl bg-gradient-primary shadow-elegant text-[13px] font-semibold gap-2 transition-all hover:scale-[1.02]"
                                    >
                                        Download All QRs
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </>
                            )}

                            {step === "downloads" && result && (
                                <>
                                    <Button variant="outline" onClick={() => setStep("result")} className="rounded-xl text-[13px] border-border/60 gap-1.5">
                                        <ArrowLeft className="h-3.5 w-3.5" /> Back to QRs
                                    </Button>
                                    <Button variant="ghost" onClick={handleReset} className="rounded-xl text-[13px]">
                                        Register New Batch
                                    </Button>
                                </>
                            )}

                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
