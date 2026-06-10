import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode, MapPin, Clock, ShieldCheck, ShieldAlert,
  AlertTriangle, CheckCircle2, XCircle, Smartphone,
  User, Store, Truck, Filter,
} from "lucide-react";
import { ease } from "@/lib/motion";


type ScanResult = "genuine" | "suspicious" | "fake" | "duplicate";
type UserType   = "customer" | "pharmacy" | "distributor" | "inspector";

interface ScanEvent {
  id: string;
  medicine:   string;
  batchId:    string;
  location:   string;
  timestamp:  string;
  userType:   UserType;
  result:     ScanResult;
  device:     string;
  txHash:     string;
  scanIndex:  number;
}

const SCANS: ScanEvent[] = [
  {
    id: "s1", medicine: "Panadol Extra 500mg",    batchId: "PNX-49281-A",
    location: "Karachi, DHA Ph.5",    timestamp: "18 Jan 2025 · 15:48 UTC",
    userType: "customer",    result: "genuine",
    device: "iPhone 15 Pro",          txHash: "0x3f9a1b2c…d7e4f891", scanIndex: 1,
  },
  {
    id: "s2", medicine: "Ventolin Inhaler 100mcg", batchId: "VNT-00129-X",
    location: "Lahore, Gulberg",       timestamp: "17 Jan 2025 · 14:22 UTC",
    userType: "pharmacy",              result: "suspicious",
    device: "Samsung Galaxy S24",     txHash: "0x7c8d3e1a…b2f56709", scanIndex: 2,
  },
  {
    id: "s3", medicine: "Augmentin 625mg",         batchId: "FAKE-00777",
    location: "Faisalabad, Kohinoor", timestamp: "16 Jan 2025 · 09:10 UTC",
    userType: "inspector",             result: "fake",
    device: "MediVerify Scanner v2",  txHash: "0x0000…null", scanIndex: 3,
  },
  {
    id: "s4", medicine: "Panadol Extra 500mg",    batchId: "PNX-49281-A",
    location: "Dubai, UAE",            timestamp: "17 Jan 2025 · 23:11 UTC",
    userType: "customer",              result: "duplicate",
    device: "Unknown Device",         txHash: "0x9c0d1e2f…a4b5c6d7", scanIndex: 4,
  },
  {
    id: "s5", medicine: "Brufen 400mg",            batchId: "BRF-22740-C",
    location: "Islamabad, F-10",      timestamp: "15 Jan 2025 · 11:35 UTC",
    userType: "distributor",           result: "genuine",
    device: "Zebra TC77",             txHash: "0xd1e2f3a4…9b8c7d6e", scanIndex: 5,
  },
  {
    id: "s6", medicine: "Calpol Syrup 120mg",      batchId: "CAL-88210-D",
    location: "Rawalpindi, Saddar",    timestamp: "14 Jan 2025 · 20:05 UTC",
    userType: "customer",              result: "genuine",
    device: "Realme 12 Pro",          txHash: "0x5e6f7081…c2d3a4b5", scanIndex: 6,
  },
  {
    id: "s7", medicine: "Disprol Syrup",           batchId: "DIS-44120-Z",
    location: "Karachi, Gulshan",     timestamp: "13 Jan 2025 · 08:50 UTC",
    userType: "pharmacy",              result: "fake",
    device: "Huawei P50",            txHash: "0x2a9b4c5d…e6f78012", scanIndex: 7,
  },
];

const RESULT_CFG: Record<ScanResult, { color: string; bg: string; border: string; glow: string; label: string; icon: typeof CheckCircle2 }> = {
  genuine:   { color: "#16a34a", bg: "#16a34a11", border: "#16a34a44", glow: "#16a34a33", label: "Genuine",   icon: CheckCircle2 },
  suspicious:{ color: "#f59e0b", bg: "#f59e0b11", border: "#f59e0b44", glow: "#f59e0b33", label: "Suspicious", icon: AlertTriangle },
  fake:      { color: "#dc2626", bg: "#dc262611", border: "#dc262644", glow: "#dc262633", label: "Fake",       icon: XCircle },
  duplicate: { color: "#dc2626", bg: "#dc262611", border: "#dc262644", glow: "#dc262633", label: "Duplicate",  icon: ShieldAlert },
};

const USER_ICONS: Record<UserType, typeof User> = {
  customer:    Smartphone,
  pharmacy:    Store,
  distributor: Truck,
  inspector:   ShieldCheck,
};

const FILTERS: { key: ScanResult | "all"; label: string }[] = [
  { key: "all",       label: "All Scans" },
  { key: "genuine",   label: "Genuine" },
  { key: "suspicious",label: "Suspicious" },
  { key: "fake",      label: "Fake" },
  { key: "duplicate", label: "Duplicate" },
];

function PulseRing({ color }: { color: string }) {
  return (
    <>
      {[1, 1.6, 2.2].map((scale, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border"
          style={{ borderColor: color }}
          initial={{ scale: 1, opacity: 0.7 }}
          animate={{ scale, opacity: 0 }}
          transition={{ duration: 1.8, delay: i * 0.4, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </>
  );
}

export function ScanHistoryViz() {
  const [filter, setFilter]   = useState<ScanResult | "all">("all");
  const [expanded, setExpanded] = useState<string | null>("s1");
  const [live, setLive]       = useState(false);
  const [newPing, setNewPing] = useState<string | null>(null);

  const visible = filter === "all" ? SCANS : SCANS.filter(s => s.result === filter);

  // Simulate a new scan coming in when "live" mode is on
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => {
      const pick = SCANS[Math.floor(Math.random() * SCANS.length)];
      setNewPing(pick.id);
      setTimeout(() => setNewPing(null), 1200);
    }, 3000);
    return () => clearInterval(id);
  }, [live]);

  const totals = {
    genuine:    SCANS.filter(s => s.result === "genuine").length,
    suspicious: SCANS.filter(s => s.result === "suspicious").length,
    fake:       SCANS.filter(s => s.result === "fake").length,
    duplicate:  SCANS.filter(s => s.result === "duplicate").length,
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#06b6d4]/10 border border-[#06b6d4]/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#06b6d4] mb-2">
          <QrCode className="h-3 w-3" /> Scan History
        </span>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Scan Timeline</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {SCANS.length} total scans · chronological blockchain log
            </p>
          </div>
          {/* Live toggle */}
          <button
            onClick={() => setLive(l => !l)}
            className="shrink-0 flex items-center gap-2 rounded-full border px-3.5 py-2 text-[11px] font-bold transition-all duration-300"
            style={{
              borderColor: live ? "#16a34a55" : "rgba(255,255,255,0.1)",
              background:  live ? "#16a34a11" : "transparent",
              color:       live ? "#16a34a" : "var(--muted-foreground)",
            }}
          >
            <motion.span
              className="h-2 w-2 rounded-full"
              style={{ background: live ? "#16a34a" : "#666" }}
              animate={live ? { opacity: [1, 0.3, 1] } : {}}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            {live ? "Live" : "Paused"}
          </button>
        </div>
      </div>

      {/* Summary badges */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["genuine", "suspicious", "fake", "duplicate"] as ScanResult[]).map(r => {
          const cfg = RESULT_CFG[r];
          const Icon = cfg.icon;
          return (
            <div
              key={r}
              className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all duration-200"
              style={{
                borderColor: filter === r ? cfg.border : "rgba(255,255,255,0.07)",
                background: filter === r ? cfg.bg : "rgba(255,255,255,0.02)",
              }}
              onClick={() => setFilter(f => f === r ? "all" : r)}
            >
              <Icon className="h-4 w-4 shrink-0" style={{ color: cfg.color }} />
              <div>
                <p className="text-lg font-black tabular-nums" style={{ color: cfg.color }}>{totals[r]}</p>
                <p className="text-[10px] font-semibold text-muted-foreground capitalize">{r}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter pills */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="rounded-full px-3 py-1 text-[11px] font-semibold transition-all duration-200"
            style={{
              background: filter === f.key ? (f.key === "all" ? "#1a56db22" : `${RESULT_CFG[f.key as ScanResult]?.color}22`) : "rgba(255,255,255,0.05)",
              color:      filter === f.key ? (f.key === "all" ? "#1a56db" : RESULT_CFG[f.key as ScanResult]?.color) : "var(--muted-foreground)",
              border:     `1px solid ${filter === f.key ? (f.key === "all" ? "#1a56db44" : `${RESULT_CFG[f.key as ScanResult]?.color}44`) : "rgba(255,255,255,0.08)"}`,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[23px] top-0 bottom-0 w-px bg-border/20 hidden sm:block" />

        <div className="space-y-3">
          <AnimatePresence>
            {visible.map((scan, idx) => {
              const cfg = RESULT_CFG[scan.result];
              const Icon = cfg.icon;
              const UserIcon = USER_ICONS[scan.userType];
              const isExpanded = expanded === scan.id;
              const isPinging  = newPing === scan.id;
              const isAlert    = scan.result === "fake" || scan.result === "duplicate";

              return (
                <motion.div
                  key={scan.id}
                  layout
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24, height: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05, ease }}
                  className="relative sm:pl-14"
                >
                  {/* Node */}
                  <div className="absolute left-0 top-4 hidden sm:flex h-[46px] w-[46px] items-center justify-center z-10">
                    <div className="relative flex h-[46px] w-[46px] items-center justify-center rounded-full border-2"
                      style={{ borderColor: cfg.border, background: cfg.bg }}
                    >
                      {(isPinging || isAlert) && <PulseRing color={cfg.color} />}
                      <Icon className="h-4 w-4 relative z-10" style={{ color: cfg.color }} />
                    </div>
                  </div>

                  {/* Card */}
                  <motion.div
                    className="overflow-hidden rounded-2xl border cursor-pointer"
                    style={{
                      borderColor: isExpanded ? cfg.border : "rgba(255,255,255,0.07)",
                      background:  isExpanded ? cfg.bg : "rgba(255,255,255,0.02)",
                      boxShadow:   isExpanded ? `0 0 30px 0 ${cfg.glow}` : "none",
                    }}
                    animate={isPinging ? { scale: [1, 1.01, 1] } : {}}
                    transition={{ duration: 0.4 }}
                    onClick={() => setExpanded(isExpanded ? null : scan.id)}
                    whileHover={{ scale: 1.003 }}
                  >
                    {/* Header row */}
                    <div className="flex items-center gap-3 px-5 py-4">
                      {/* Mobile icon */}
                      <div className="flex sm:hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border"
                        style={{ borderColor: cfg.border, background: cfg.bg }}
                      >
                        <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-[13px] font-bold truncate">{scan.medicine}</span>
                          <span
                            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide"
                            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                          >
                            {cfg.label}
                          </span>
                          {isAlert && (
                            <motion.span
                              className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black"
                              style={{ background: "#dc262622", color: "#dc2626" }}
                              animate={{ opacity: [1, 0.3, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity }}
                            >
                              ⚠ ALERT
                            </motion.span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{scan.location}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{scan.timestamp}</span>
                          <span className="flex items-center gap-1 capitalize"><UserIcon className="h-3 w-3" />{scan.userType}</span>
                        </div>
                      </div>

                      <span className="hidden sm:block shrink-0 text-[10px] font-bold tabular-nums rounded-full px-2 py-1"
                        style={{ background: "rgba(255,255,255,0.05)", color: "var(--muted-foreground)" }}
                      >
                        #{scan.scanIndex}
                      </span>
                    </div>

                    {/* Expanded */}
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
                            <div className="grid gap-3 sm:grid-cols-2">
                              {[
                                { label: "Batch ID",    value: scan.batchId,   mono: true },
                                { label: "Device",      value: scan.device,    mono: false },
                                { label: "User Type",   value: scan.userType,  mono: false },
                                { label: "Scan Index",  value: `#${scan.scanIndex}`, mono: true },
                              ].map(f => (
                                <div key={f.label} className="rounded-xl border border-border/25 bg-card/30 px-4 py-3">
                                  <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wide font-bold">{f.label}</p>
                                  <p className={`text-[12px] font-bold ${f.mono ? "font-mono" : ""} capitalize`}>{f.value}</p>
                                </div>
                              ))}
                            </div>
                            <div className="rounded-xl border border-border/25 bg-black/20 p-3 font-mono">
                              <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1.5">TX Hash</p>
                              <p className="text-[11px] text-foreground/70 break-all">{scan.txHash}</p>
                            </div>
                            {/* Scan pulse visualizer */}
                            <div className="relative h-10 overflow-hidden rounded-xl border border-border/20 bg-black/10">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div
                                  className="h-px w-full"
                                  style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)` }}
                                  animate={{ scaleX: [0.3, 1, 0.3], opacity: [0.4, 1, 0.4] }}
                                  transition={{ duration: 1.6, repeat: Infinity }}
                                />
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] font-bold" style={{ color: cfg.color }}>
                                  QR Signal Authenticated · {cfg.label.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
