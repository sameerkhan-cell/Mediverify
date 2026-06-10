import { useRef } from "react";
import { motion } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import { Package, Pill, Copy, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ease } from "@/lib/motion";
import { useState } from "react";

interface DualQRCardProps {
    type: "box" | "pill";
    qrValue: string;
    label: string;
    sublabel?: string;
    badge?: string;
    onDownloadPng?: (canvas: HTMLCanvasElement) => void;
    onCopy?: () => void;
}

export function DualQRCard({
    type,
    qrValue,
    label,
    sublabel,
    badge,
    onDownloadPng,
    onCopy,
}: DualQRCardProps) {
    const qrRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);

    const isBox = type === "box";
    const Icon = isBox ? Package : Pill;
    const accent = isBox
        ? "from-primary/20 via-primary/5 to-transparent"
        : "from-success/20 via-success/5 to-transparent";
    const dotColor = isBox ? "bg-primary" : "bg-success";
    const textColor = isBox ? "text-primary" : "text-success";
    const borderColor = isBox ? "border-primary/30" : "border-success/30";

    const handleCopy = () => {
        navigator.clipboard.writeText(qrValue);
        setCopied(true);
        onCopy?.();
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!qrRef.current) return;
        const canvas = qrRef.current.querySelector("canvas");
        if (canvas && onDownloadPng) onDownloadPng(canvas);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, ease }}
            className={`relative overflow-hidden rounded-2xl border-2 ${borderColor} bg-card`}
        >
            {/* Holographic background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${accent} pointer-events-none`} />
            {/* Holo shimmer overlay */}
            <div className="absolute inset-0 holo pointer-events-none opacity-50" />

            {/* Content */}
            <div className="relative z-10 p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br ${isBox ? "from-primary to-primary/70" : "from-success to-success/70"} shadow-elegant`}>
                            <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <p className={`text-[12px] font-bold uppercase tracking-wider ${textColor}`}>
                                {isBox ? "Box QR" : "Pill QR"}
                            </p>
                            {badge && (
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isBox ? "bg-primary/10 text-primary" : "bg-success/10 text-success"}`}>
                                    {badge}
                                </span>
                            )}
                        </div>
                    </div>
                    {/* Live dot */}
                    <span className={`flex items-center gap-1.5 text-[10px] text-muted-foreground`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${dotColor} pulse-dot`} />
                        Active
                    </span>
                </div>

                {/* QR Code */}
                <div
                    ref={qrRef}
                    className="flex justify-center"
                >
                    <div className={`rounded-xl border-2 ${borderColor} bg-white p-3 shadow-sm`}>
                        <QRCodeCanvas
                            value={qrValue}
                            size={256}
                            level="H"
                            style={{ width: "100%", height: "auto", maxWidth: "160px" }}
                            includeMargin={false}
                            bgColor="#ffffff"
                            fgColor="#0a0c18"
                        />
                    </div>
                </div>

                {/* QR Code value */}
                <div className={`rounded-xl border ${borderColor} bg-background/50 p-3`}>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">QR Code</p>
                    <p className={`font-mono text-[11px] font-bold ${textColor} break-all leading-relaxed`}>
                        {qrValue}
                    </p>
                    {sublabel && (
                        <p className="mt-1 text-[10px] text-muted-foreground">{sublabel}</p>
                    )}
                </div>

                {/* Label */}
                <div className="text-center">
                    <p className="text-[12px] font-semibold">{label}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                        className={`flex-1 rounded-xl text-[11px] h-8 border ${borderColor} hover:${isBox ? "bg-primary/5" : "bg-success/5"}`}
                    >
                        {copied
                            ? <><CheckCircle2 className="mr-1 h-3 w-3 text-success" />Copied!</>
                            : <><Copy className="mr-1 h-3 w-3" />Copy QR</>
                        }
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleDownload}
                        className={`flex-1 rounded-xl text-[11px] h-8 ${isBox ? "bg-gradient-primary" : "bg-gradient-success"} text-white shadow-elegant`}
                    >
                        <Download className="mr-1 h-3 w-3" />PNG
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
