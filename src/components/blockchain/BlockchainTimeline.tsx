import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hash, MapPin, Clock, User, ShieldCheck, AlertTriangle,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Link2, Cpu,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ease } from "@/lib/motion";
gsap.registerPlugin(ScrollTrigger);


type TxStatus = "verified" | "transfer" | "suspicious" | "scan" | "flagged";

interface BlockchainTx {
  id: string;
  txHash: string;
  actor: string;
  role: string;
  location: string;
  timestamp: string;
  status: TxStatus;
  medicineStatus: string;
  blockNumber: number;
  confirmations: number;
  detail: string;
  gasUsed: number;
}

const TRANSACTIONS: BlockchainTx[] = [
  {
    id: "tx1", txHash: "0x3f9a1b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f90",
    actor: "GlaxoSmithKline PK", role: "Manufacturer", location: "Karachi, PK",
    timestamp: "2025-01-12 · 08:42 UTC", status: "verified", medicineStatus: "Manufactured",
    blockNumber: 18492001, confirmations: 1842, detail: "Batch PNX-49281-A manufactured under GMP-certified conditions. All quality parameters within spec.",
    gasUsed: 21000,
  },
  {
    id: "tx2", txHash: "0x7c8d3e1af2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
    actor: "QC Authority PK", role: "Quality Inspector", location: "Karachi, PK",
    timestamp: "2025-01-12 · 14:10 UTC", status: "verified", medicineStatus: "QC Passed",
    blockNumber: 18492447, confirmations: 1396, detail: "ISO 9001 and WHO-GMP quality certification passed. Batch cleared for distribution.",
    gasUsed: 18500,
  },
  {
    id: "tx3", txHash: "0xd1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0",
    actor: "DHL Logistics", role: "Courier", location: "Lahore Hub, PK",
    timestamp: "2025-01-14 · 06:30 UTC", status: "transfer", medicineStatus: "In Transit",
    blockNumber: 18495210, confirmations: 633, detail: "Cold-chain GPS-tracked shipment dispatched from Karachi to Lahore distribution center.",
    gasUsed: 19200,
  },
  {
    id: "tx4", txHash: "0x2a9b4c5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3",
    actor: "MedStore WH", role: "Warehouse Manager", location: "Lahore, PK",
    timestamp: "2025-01-15 · 11:20 UTC", status: "verified", medicineStatus: "Warehoused",
    blockNumber: 18497882, confirmations: 247,
    detail: "Inventory reconciliation complete. Batch integrity confirmed via RFID scan. Storage conditions nominal.",
    gasUsed: 21000,
  },
  {
    id: "tx5", txHash: "0x5e6f7081a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
    actor: "Servaid Pharmacy #218", role: "Pharmacy", location: "Karachi, DHA",
    timestamp: "2025-01-16 · 09:05 UTC", status: "scan", medicineStatus: "Delivered",
    blockNumber: 18499341, confirmations: 102,
    detail: "Medicine batch received and scanned at pharmacy. On-shelf placement logged. Temperature 18°C.",
    gasUsed: 17800,
  },
  {
    id: "tx6", txHash: "0x9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8",
    actor: "Unknown Device", role: "Suspicious Scan", location: "Dubai, UAE",
    timestamp: "2025-01-17 · 23:11 UTC", status: "suspicious", medicineStatus: "ALERT",
    blockNumber: 18501024, confirmations: 88,
    detail: "⚠️ Geo-location mismatch detected. Batch scanned from UAE while last confirmed location was Karachi. Possible counterfeit attempt.",
    gasUsed: 21000,
  },
  {
    id: "tx7", txHash: "0xf1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
    actor: "MediVerify AI", role: "Fraud Detection", location: "Blockchain Network",
    timestamp: "2025-01-17 · 23:11 UTC", status: "flagged", medicineStatus: "FLAGGED",
    blockNumber: 18501025, confirmations: 87,
    detail: "AI fraud detection triggered. Duplicate QR hash detected. Geo-IP mismatch logged. Alert propagated to regulatory authorities.",
    gasUsed: 45000,
  },
];

const STATUS_CONFIG: Record<TxStatus, { color: string; bg: string; border: string; glow: string; icon: typeof CheckCircle2; label: string }> = {
  verified:   { color: "#16a34a", bg: "#16a34a14", border: "#16a34a44", glow: "#16a34a33", icon: CheckCircle2, label: "Verified" },
  transfer:   { color: "#1a56db", bg: "#1a56db14", border: "#1a56db44", glow: "#1a56db33", icon: Link2, label: "Transfer" },
  scan:       { color: "#06b6d4", bg: "#06b6d414", border: "#06b6d444", glow: "#06b6d433", icon: Cpu, label: "Scan" },
  suspicious: { color: "#f59e0b", bg: "#f59e0b14", border: "#f59e0b44", glow: "#f59e0b33", icon: AlertTriangle, label: "Suspicious" },
  flagged:    { color: "#dc2626", bg: "#dc262614", border: "#dc262644", glow: "#dc262633", icon: XCircle, label: "Flagged" },
};

export function BlockchainTimeline() {
  const [expanded, setExpanded] = useState<string | null>("tx4");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-tx-block]",
        { opacity: 0, x: -32 },
        {
          opacity: 1, x: 0, duration: 0.55, stagger: 0.1, ease: "expo.out",
          scrollTrigger: { trigger: containerRef.current, start: "top 80%", once: true },
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#06b6d4]/10 border border-[#06b6d4]/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#06b6d4]">
            <Hash className="h-3 w-3" /> Blockchain Timeline
          </span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Transaction History</h2>
        <p className="mt-1 text-[13px] font-medium text-foreground/80">
          {TRANSACTIONS.length} blockchain events · {TRANSACTIONS.filter((t) => t.status === "verified").length} verified
        </p>
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[23px] top-0 bottom-0 w-px bg-border/30 hidden sm:block" />

        <div className="space-y-3">
          {TRANSACTIONS.map((tx, i) => {
            const cfg = STATUS_CONFIG[tx.status];
            const Icon = cfg.icon;
            const isExpanded = expanded === tx.id;
            const isAlert = tx.status === "suspicious" || tx.status === "flagged";

            return (
              <motion.div
                key={tx.id}
                data-tx-block
                className="relative sm:pl-14"
              >
                {/* Node dot */}
                <div
                  className="absolute left-0 top-4 hidden sm:flex h-[46px] w-[46px] items-center justify-center rounded-full border-2 z-10"
                  style={{ borderColor: cfg.border, background: cfg.bg }}
                >
                  <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                  {isAlert && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2"
                      style={{ borderColor: cfg.color }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                    />
                  )}
                </div>

                {/* Card */}
                <motion.div
                  className="overflow-hidden rounded-2xl border cursor-pointer transition-all duration-300"
                  style={{
                    borderColor: isExpanded ? cfg.border : "var(--border)",
                    background: isExpanded ? cfg.bg : "var(--card)",
                    boxShadow: isExpanded ? `0 0 30px 0 ${cfg.glow}` : "none",
                  }}
                  onClick={() => setExpanded(isExpanded ? null : tx.id)}
                  whileHover={{ scale: 1.005 }}
                  transition={{ duration: 0.2, ease }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 px-5 py-4">
                    {/* Mobile icon */}
                    <div
                      className="flex sm:hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border"
                      style={{ borderColor: cfg.border, background: cfg.bg }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-bold truncate">{tx.actor}</span>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                        >
                          {cfg.label}
                        </span>
                        {isAlert && (
                          <motion.span
                            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{ background: "#dc262622", color: "#dc2626" }}
                            animate={{ opacity: [1, 0.4, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                          >
                            ⚠ ALERT
                          </motion.span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11.5px] font-medium text-foreground/80">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {tx.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {tx.timestamp}
                        </span>
                        <span className="hidden sm:flex items-center gap-1 font-mono">
                          <Hash className="h-3 w-3" /> {tx.txHash.slice(0, 18)}…
                        </span>
                      </div>
                    </div>

                    {/* Confirmation badge */}
                    <div className="hidden sm:flex flex-col items-end gap-1">
                      <div
                        className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        <ShieldCheck className="h-3 w-3" />
                        {tx.confirmations.toLocaleString()}
                      </div>
                      <span className="text-[10px] font-medium text-foreground/70">confirmations</span>
                    </div>

                    <div className="text-muted-foreground/40">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease }}
                        className="overflow-hidden"
                      >
                        <div className="border-t px-5 py-5 space-y-4" style={{ borderColor: cfg.border }}>
                          <p className="text-[13px] text-muted-foreground leading-relaxed">{tx.detail}</p>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {[
                              { label: "Block #", value: `#${tx.blockNumber.toLocaleString()}` },
                              { label: "Gas Used", value: tx.gasUsed.toLocaleString() },
                              { label: "Role", value: tx.role },
                              { label: "Medicine", value: tx.medicineStatus },
                            ].map((f) => (
                              <div key={f.label} className="rounded-xl border border-border/30 bg-card/60 px-3 py-2.5">
                                <p className="text-[11px] font-bold text-foreground/70 mb-1">{f.label}</p>
                                <p className="text-[13px] font-black font-mono text-foreground/90">{f.value}</p>
                              </div>
                            ))}
                          </div>
                          <div className="rounded-xl border border-border/30 bg-card/60 p-3">
                            <p className="text-[11px] text-foreground/70 mb-1.5 uppercase tracking-wide font-bold">Full TX Hash</p>
                            <p className="font-mono font-bold text-[12px] break-all text-foreground/90">{tx.txHash}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
