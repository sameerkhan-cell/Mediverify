import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, ShieldAlert, MapPin, Clock, Wifi, Copy,
  Eye, Zap, XCircle, RefreshCw, ChevronRight,
} from "lucide-react";
import { ease } from "@/lib/motion";


type ThreatLevel = "critical" | "high" | "medium";

interface Alert {
  id: string;
  type: "duplicate_qr" | "geo_mismatch" | "invalid_hash" | "already_sold" | "suspicious_attempt";
  threatLevel: ThreatLevel;
  medicine: string;
  batchId: string;
  description: string;
  location: string;
  timestamp: string;
  aiLabel: string;
  txHash: string;
  scanCount: number;
  timeDelta?: string;
}

const ALERTS: Alert[] = [
  {
    id: "a1", type: "duplicate_qr", threatLevel: "critical",
    medicine: "Panadol Extra 500mg", batchId: "PNX-49281-A",
    description: "QR code scanned 7 times within 3 hours. Original scan registered in Karachi. Subsequent scans from UAE, UK, and India flagged as duplicates.",
    location: "Dubai, UAE → Karachi, PK", timestamp: "17 Jan 2025 · 23:11 UTC",
    aiLabel: "AI Fraud: Duplicate Distribution Detected",
    txHash: "0x9c0d1e2f…a4b5c6d7", scanCount: 7, timeDelta: "3h 14min",
  },
  {
    id: "a2", type: "geo_mismatch", threatLevel: "critical",
    medicine: "Ventolin Inhaler 100mcg", batchId: "VNT-00129-X",
    description: "Medicine batch last verified in Lahore, PK. A scan was detected from London, UK 8 hours later — physically impossible given shipping time.",
    location: "London, UK (suspicious) ↔ Lahore, PK",
    timestamp: "15 Jan 2025 · 18:30 UTC",
    aiLabel: "AI Fraud: Geo-Temporal Impossibility",
    txHash: "0x7c8d3e1a…b2f56709", scanCount: 2, timeDelta: "8h 02min",
  },
  {
    id: "a3", type: "invalid_hash", threatLevel: "high",
    medicine: "Augmentin 625mg", batchId: "AUG-55103-B",
    description: "Blockchain hash returned null — batch ID not registered in the ledger. Likely counterfeit packaging with a fabricated batch number.",
    location: "Faisalabad, PK", timestamp: "14 Jan 2025 · 09:20 UTC",
    aiLabel: "AI Fraud: Unregistered Batch Detected",
    txHash: "0x0000…null", scanCount: 1,
  },
  {
    id: "a4", type: "already_sold", threatLevel: "high",
    medicine: "Brufen 400mg", batchId: "BRF-22740-C",
    description: "Medicine marked as sold to customer ID #4821 on Jan 10. Resale attempt detected at a secondary pharmacy — possible stolen/repackaged batch.",
    location: "Islamabad, PK", timestamp: "12 Jan 2025 · 14:55 UTC",
    aiLabel: "AI Fraud: Already-Sold Medicine Resale",
    txHash: "0xd1e2f3a4…9b8c7d6e", scanCount: 3,
  },
  {
    id: "a5", type: "suspicious_attempt", threatLevel: "medium",
    medicine: "Calpol Syrup 120mg", batchId: "CAL-88210-D",
    description: "5 consecutive verification attempts within 30 seconds from the same device. Pattern matches known bot-scraping behavior for QR data extraction.",
    location: "Rawalpindi, PK", timestamp: "11 Jan 2025 · 22:40 UTC",
    aiLabel: "AI Fraud: Bot Scan Pattern Detected",
    txHash: "0x5e6f7081…c2d3a4b5", scanCount: 5,
  },
];

const THREAT_CFG: Record<ThreatLevel, { color: string; bg: string; border: string; glow: string; label: string }> = {
  critical: { color: "#dc2626", bg: "#dc262611", border: "#dc262644", glow: "0 0 40px 0 #dc262622", label: "CRITICAL" },
  high:     { color: "#f59e0b", bg: "#f59e0b11", border: "#f59e0b44", glow: "0 0 30px 0 #f59e0b22", label: "HIGH" },
  medium:   { color: "#8b5cf6", bg: "#8b5cf611", border: "#8b5cf644", glow: "0 0 20px 0 #8b5cf622", label: "MEDIUM" },
};

const TYPE_LABELS: Record<Alert["type"], string> = {
  duplicate_qr:       "Duplicate QR Scan",
  geo_mismatch:       "Geo-Location Mismatch",
  invalid_hash:       "Invalid Blockchain Hash",
  already_sold:       "Already-Sold Medicine",
  suspicious_attempt: "Suspicious Scan Pattern",
};

function GlitchText({ text, active }: { text: string; active: boolean }) {
  const [glitch, setGlitch] = useState(false);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 120);
    }, 2800);
    return () => clearInterval(id);
  }, [active]);

  return (
    <span className="relative inline-block">
      <span style={glitch ? { clipPath: "inset(30% 0 40% 0)", transform: "translateX(-2px)", color: "#ff0040" } : {}}
        className="transition-none">{text}</span>
      {glitch && (
        <span className="absolute inset-0" style={{ clipPath: "inset(60% 0 10% 0)", transform: "translateX(3px)", color: "#00fff0" }}>
          {text}
        </span>
      )}
    </span>
  );
}

export function SuspiciousAlerts() {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>("a1");
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTicker((t) => t + 1), 100);
    return () => clearInterval(id);
  }, []);

  const visible = ALERTS.filter((a) => !dismissed.includes(a.id));

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dc2626]/10 border border-[#dc2626]/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#dc2626]">
            <ShieldAlert className="h-3 w-3" />
            <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>
              Live Threat Feed
            </motion.span>
          </span>
          <span className="rounded-full bg-[#dc2626]/10 border border-[#dc2626]/30 px-2.5 py-0.5 text-[11px] font-bold text-[#dc2626]">
            {visible.length} Active
          </span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Suspicious Scan Alerts</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          AI-powered fraud detection · Real-time threat classification
        </p>
      </div>

      {/* Threat level summary bar */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {(["critical", "high", "medium"] as ThreatLevel[]).map((level) => {
          const cfg = THREAT_CFG[level];
          const count = visible.filter((a) => a.threatLevel === level).length;
          return (
            <motion.div
              key={level}
              className="rounded-xl border p-4 text-center"
              style={{ borderColor: cfg.border, background: cfg.bg }}
              animate={level === "critical" && count > 0
                ? { boxShadow: ["0 0 0 0 #dc262622", cfg.glow, "0 0 0 0 #dc262622"] }
                : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <p className="text-2xl font-black tabular-nums" style={{ color: cfg.color }}>{count}</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>{cfg.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Alert cards */}
      <div className="space-y-3">
        <AnimatePresence>
          {visible.map((alert) => {
            const cfg = THREAT_CFG[alert.threatLevel];
            const isExpanded = expanded === alert.id;
            const isCritical = alert.threatLevel === "critical";

            return (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, x: -20, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.96, height: 0 }}
                transition={{ duration: 0.4, ease }}
                className="overflow-hidden rounded-2xl border cursor-pointer"
                style={{
                  borderColor: isExpanded ? cfg.border : "rgba(255,255,255,0.07)",
                  background: isExpanded ? cfg.bg : "rgba(255,255,255,0.02)",
                  boxShadow: isExpanded ? cfg.glow : "none",
                }}
                onClick={() => setExpanded(isExpanded ? null : alert.id)}
              >
                {/* Alert header */}
                <div className="flex items-start gap-3 p-4">
                  {/* Threat icon */}
                  <motion.div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2"
                    style={{ borderColor: cfg.border, background: cfg.bg }}
                    animate={isCritical
                      ? { boxShadow: [`0 0 0 0 ${cfg.color}44`, `0 0 16px 4px ${cfg.color}33`, `0 0 0 0 ${cfg.color}44`] }
                      : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {isCritical
                      ? <XCircle className="h-4 w-4" style={{ color: cfg.color }} />
                      : <AlertTriangle className="h-4 w-4" style={{ color: cfg.color }} />
                    }
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {/* Threat badge */}
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-[12px] font-bold text-foreground">
                        {TYPE_LABELS[alert.type]}
                      </span>
                      {isCritical && (
                        <motion.span
                          className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase"
                          style={{ background: "#dc262622", color: "#dc2626" }}
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          ⚡ ACTIVE
                        </motion.span>
                      )}
                    </div>
                    <p className="text-[12px] font-semibold text-muted-foreground">{alert.medicine}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {alert.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {alert.timestamp}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {alert.scanCount}x scanned
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDismissed((d) => [...d, alert.id]); }}
                      className="rounded-lg border border-border/30 p-1.5 text-muted-foreground transition-colors hover:bg-white/5"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </button>
                    <ChevronRight
                      className="h-4 w-4 text-muted-foreground/40 transition-transform duration-200"
                      style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
                    />
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
                      <div className="space-y-4 border-t px-5 py-5" style={{ borderColor: cfg.border }}>
                        {/* AI label */}
                        <div
                          className="flex items-center gap-2.5 rounded-xl border p-3"
                          style={{ borderColor: cfg.border, background: cfg.bg }}
                        >
                          <Zap className="h-4 w-4 shrink-0" style={{ color: cfg.color }} />
                          <span className="text-[12px] font-bold" style={{ color: cfg.color }}>
                            <GlitchText text={alert.aiLabel} active={isCritical} />
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-[13px] text-muted-foreground leading-relaxed">{alert.description}</p>

                        {/* Meta fields */}
                        <div className="grid gap-2.5 sm:grid-cols-2">
                          {[
                            { icon: Copy,   label: "Batch ID",    value: alert.batchId },
                            { icon: Wifi,   label: "Scan Count",  value: `${alert.scanCount} times` },
                            ...(alert.timeDelta
                              ? [{ icon: Clock, label: "Time Delta", value: alert.timeDelta }]
                              : []),
                          ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-center gap-2.5 rounded-xl border border-border/30 bg-card/30 px-3 py-2.5 text-[12px]">
                              <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <span className="text-muted-foreground">{label}:</span>
                              <span className="font-bold">{value}</span>
                            </div>
                          ))}
                        </div>

                        {/* TX hash */}
                        <div className="rounded-xl border border-border/30 bg-black/20 p-3 font-mono">
                          <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5">TX Hash</p>
                          <p className="text-[11px] text-foreground/60 break-all">{alert.txHash}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition-colors hover:opacity-80"
                            style={{ borderColor: cfg.border, color: cfg.color, background: cfg.bg }}
                          >
                            <ShieldAlert className="h-3.5 w-3.5" /> Report to Authorities
                          </button>
                          <button
                            className="flex items-center gap-1.5 rounded-full border border-border/40 px-3.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-white/5"
                            onClick={(e) => { e.stopPropagation(); setDismissed((d) => [...d, alert.id]); }}
                          >
                            <RefreshCw className="h-3.5 w-3.5" /> Dismiss
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {visible.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-[#16a34a]/30 bg-[#16a34a]/5 p-10 text-center"
          >
            <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-[#16a34a]" />
            <p className="font-bold text-[#16a34a]">All alerts cleared</p>
            <p className="mt-1 text-[12px] text-muted-foreground">Network integrity nominal</p>
            <button
              onClick={() => setDismissed([])}
              className="mt-4 flex items-center gap-1.5 mx-auto rounded-full border border-[#16a34a]/40 bg-[#16a34a]/10 px-4 py-2 text-[12px] font-semibold text-[#16a34a] transition-colors hover:bg-[#16a34a]/15"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Reload alerts
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
