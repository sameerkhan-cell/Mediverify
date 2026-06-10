import { useRef, useState } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import {
  Hash, MapPin, Building2, Clock, QrCode, ShieldCheck,
  AlertTriangle, XCircle, CheckCircle2, Copy, ExternalLink,
} from "lucide-react";
import { ease } from "@/lib/motion";


type CardStatus = "genuine" | "suspicious" | "fake";

interface TxCardData {
  id: string;
  txHash: string;
  batchId: string;
  manufacturer: string;
  location: string;
  verificationResult: CardStatus;
  qrAuthentic: boolean;
  timestamp: string;
  blockchainStatus: "confirmed" | "pending" | "failed";
  medicineLabel: string;
  scansCount: number;
}

const CARDS: TxCardData[] = [
  {
    id: "c1", txHash: "0x3f9a1b2c…d7e4f891",
    batchId: "PNX-49281-A", manufacturer: "GlaxoSmithKline PK",
    location: "Karachi, Pakistan", verificationResult: "genuine",
    qrAuthentic: true, timestamp: "16 Jan 2025 · 09:05 UTC",
    blockchainStatus: "confirmed", medicineLabel: "Panadol Extra 500mg",
    scansCount: 4,
  },
  {
    id: "c2", txHash: "0x7c8d3e1a…b2f56709",
    batchId: "VNT-00129-X", manufacturer: "Unknown Origin",
    location: "Dubai, UAE", verificationResult: "suspicious",
    qrAuthentic: false, timestamp: "17 Jan 2025 · 23:11 UTC",
    blockchainStatus: "pending", medicineLabel: "Ventolin 100mcg",
    scansCount: 12,
  },
  {
    id: "c3", txHash: "0xd1e2f3a4…9b8c7d6e",
    batchId: "FAKE-00777", manufacturer: "Unregistered",
    location: "Lahore, Pakistan", verificationResult: "fake",
    qrAuthentic: false, timestamp: "15 Jan 2025 · 18:30 UTC",
    blockchainStatus: "failed", medicineLabel: "Augmentin 625mg (FAKE)",
    scansCount: 31,
  },
];

const STATUS_CFG: Record<CardStatus, {
  color: string; bg: string; border: string;
  glow: string; label: string; icon: typeof CheckCircle2;
  gradient: string;
}> = {
  genuine: {
    color: "#16a34a", bg: "#16a34a0d", border: "#16a34a55",
    glow: "0 0 40px 0 #16a34a33, 0 0 80px 0 #16a34a11",
    label: "Genuine", icon: CheckCircle2,
    gradient: "linear-gradient(135deg, #16a34a22, #06b6d422, transparent)",
  },
  suspicious: {
    color: "#f59e0b", bg: "#f59e0b0d", border: "#f59e0b55",
    glow: "0 0 40px 0 #f59e0b33, 0 0 80px 0 #f59e0b11",
    label: "Suspicious", icon: AlertTriangle,
    gradient: "linear-gradient(135deg, #f59e0b22, #dc262622, transparent)",
  },
  fake: {
    color: "#dc2626", bg: "#dc26260d", border: "#dc262655",
    glow: "0 0 40px 0 #dc262633, 0 0 80px 0 #dc262611",
    label: "Counterfeit", icon: XCircle,
    gradient: "linear-gradient(135deg, #dc262622, #7f1d1d22, transparent)",
  },
};

function HoloCard({ card }: { card: TxCardData }) {
  const cfg = STATUS_CFG[card.verificationResult];
  const Icon = cfg.icon;
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-150, 150], [8, -8]), { stiffness: 200, damping: 25 });
  const rotateY = useSpring(useTransform(mouseX, [-150, 150], [-8, 8]), { stiffness: 200, damping: 25 });
  const glareX = useTransform(mouseX, [-150, 150], [0, 100]);
  const glareY = useTransform(mouseY, [-150, 150], [0, 100]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    mouseX.set(e.clientX - cx);
    mouseY.set(e.clientY - cy);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  }

  function copyHash() {
    navigator.clipboard.writeText(card.txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const blockStatusCfg = {
    confirmed: { color: "#16a34a", label: "Confirmed" },
    pending: { color: "#f59e0b", label: "Pending" },
    failed: { color: "#dc2626", label: "Failed" },
  }[card.blockchainStatus];

  return (
    <motion.div
      ref={cardRef}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        background: "rgba(10,12,20,0.85)",
        border: `1px solid ${isHovered ? cfg.border : "rgba(255,255,255,0.08)"}`,
        boxShadow: isHovered ? cfg.glow : "none",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
      } as React.CSSProperties}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
      initial={{ opacity: 0, y: 32, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease }}
      className="relative overflow-hidden rounded-2xl cursor-pointer"
    >
      {/* Holographic background overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-0"
        style={{ background: cfg.gradient, opacity: isHovered ? 1 : 0.5 }}
        animate={{ opacity: isHovered ? 1 : 0.5 }}
        transition={{ duration: 0.4 }}
      />

      {/* Animated border glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none z-0"
        style={{
          background: `conic-gradient(from var(--border-angle, 0deg), ${cfg.color}44, transparent, ${cfg.color}22, transparent, ${cfg.color}44)`,
          padding: "1px",
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          opacity: isHovered ? 1 : 0,
        }}
        animate={isHovered ? { ["--border-angle" as string]: ["0deg", "360deg"] } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />

      {/* Mouse glare */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-10 rounded-2xl"
          style={{
            background: `radial-gradient(circle at ${glareX.get()}% ${glareY.get()}%, rgba(255,255,255,0.07) 0%, transparent 60%)`,
          }}
        />
      )}

      {/* Holo shimmer sweep */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)",
            backgroundSize: "200% 100%",
          }}
          animate={{ backgroundPosition: ["-200% 0", "200% 0"] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Card content */}
      <div className="relative z-20 p-5">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <motion.div
              className="flex h-11 w-11 items-center justify-center rounded-xl border"
              style={{ borderColor: cfg.border, background: cfg.bg }}
              animate={
                card.verificationResult === "fake"
                  ? { boxShadow: [`0 0 0 0 ${cfg.color}44`, `0 0 16px 4px ${cfg.color}33`, `0 0 0 0 ${cfg.color}44`] }
                  : card.verificationResult === "suspicious"
                    ? { boxShadow: [`0 0 0 0 ${cfg.color}44`, `0 0 12px 3px ${cfg.color}33`, `0 0 0 0 ${cfg.color}44`] }
                    : {}
              }
              transition={{ duration: card.verificationResult === "fake" ? 1.2 : 2, repeat: Infinity }}
            >
              <Icon className="h-5 w-5" style={{ color: cfg.color }} />
            </motion.div>
            <div>
              <p className="text-[13px] font-bold leading-tight">{card.medicineLabel}</p>
              <p className="text-[11px] text-muted-foreground font-mono">{card.batchId}</p>
            </div>
          </div>
          <span
            className="shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
          >
            {cfg.label}
          </span>
        </div>

        {/* Fields */}
        <div className="space-y-2.5 mb-4">
          {[
            { icon: Building2, label: "Manufacturer", value: card.manufacturer },
            { icon: MapPin, label: "Location", value: card.location },
            { icon: Clock, label: "Timestamp", value: card.timestamp },
          ].map(({ icon: FIcon, label, value }) => (
            <div key={label} className="flex items-center gap-2.5 text-[12px]">
              <FIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground w-20 shrink-0">{label}</span>
              <span className="font-medium truncate">{value}</span>
            </div>
          ))}
        </div>

        {/* QR authenticity */}
        <div
          className="mb-4 flex items-center gap-2.5 rounded-xl border p-3"
          style={{ borderColor: card.qrAuthentic ? "#16a34a44" : "#dc262644", background: card.qrAuthentic ? "#16a34a0d" : "#dc26260d" }}
        >
          <QrCode className="h-4 w-4 shrink-0" style={{ color: card.qrAuthentic ? "#16a34a" : "#dc2626" }} />
          <span className="text-[12px] font-semibold" style={{ color: card.qrAuthentic ? "#16a34a" : "#dc2626" }}>
            QR {card.qrAuthentic ? "Authentic — Hash Matched" : "INVALID — Hash Mismatch"}
          </span>
          <span className="ml-auto text-[10px] text-muted-foreground">{card.scansCount}x scanned</span>
        </div>

        {/* TX Hash */}
        <div className="mb-4 rounded-xl border border-border/30 bg-black/20 p-3">
          <div className="mb-1.5 flex items-center gap-2">
            <Hash className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">TX Hash</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[11px] text-foreground/70 truncate">{card.txHash}</p>
            <button
              onClick={copyHash}
              className="shrink-0 rounded-lg border border-border/30 p-1.5 transition-colors hover:bg-white/5"
            >
              <Copy className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
          {copied && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-1 text-[10px] font-medium"
              style={{ color: cfg.color }}
            >
              ✓ Copied to clipboard
            </motion.p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                background: blockStatusCfg.color,
                boxShadow: `0 0 6px ${blockStatusCfg.color}`,
              }}
            />
            <span className="text-[11px] font-semibold" style={{ color: blockStatusCfg.color }}>
              {blockStatusCfg.label}
            </span>
          </div>
          <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
            View on explorer <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function TransactionCards() {
  return (
    <div>
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1a56db]/10 border border-[#1a56db]/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#1a56db] mb-2">
          <ShieldCheck className="h-3 w-3" /> Transaction Records
        </span>
        <h2 className="text-2xl font-bold tracking-tight">Holographic Transaction Cards</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Hover for 3D tilt · Each card is an immutable blockchain record
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {CARDS.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12, duration: 0.55, ease }}
          >
            <HoloCard card={card} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
