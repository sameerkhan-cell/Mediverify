import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Factory, FlaskConical, Truck, Warehouse, Store, ShoppingBag,
  ShieldCheck, CheckCircle2, Clock, MapPin, Hash, Zap, ChevronRight,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ease } from "@/lib/motion";
gsap.registerPlugin(ScrollTrigger);


interface JourneyStage {
  id: number;
  label: string;
  icon: typeof Factory;
  location: string;
  timestamp: string;
  txHash: string;
  status: "complete" | "active" | "pending";
  actor: string;
  detail: string;
}

const STAGES: JourneyStage[] = [
  {
    id: 1, label: "Manufactured", icon: Factory,
    location: "GSK Karachi Plant", timestamp: "12 Jan 2025 · 08:42 UTC",
    txHash: "0x3f9a1b2c…d7e4f891", status: "complete", actor: "GlaxoSmithKline PK",
    detail: "Batch PNX-49281-A produced under GMP-certified conditions.",
  },
  {
    id: 2, label: "Quality Checked", icon: FlaskConical,
    location: "QC Lab — Karachi", timestamp: "12 Jan 2025 · 14:10 UTC",
    txHash: "0x7c8d3e1a…b2f56709", status: "complete", actor: "QC Authority PK",
    detail: "ISO 9001 quality certification passed. Batch approved.",
  },
  {
    id: 3, label: "In Transit", icon: Truck,
    location: "DHL Express · Lahore Hub", timestamp: "14 Jan 2025 · 06:30 UTC",
    txHash: "0xd1e2f3a4…9b8c7d6e", status: "complete", actor: "DHL Logistics",
    detail: "Cold-chain compliant transport. GPS-tracked shipment.",
  },
  {
    id: 4, label: "Warehouse Verified", icon: Warehouse,
    location: "MedStore Warehouse — Lahore", timestamp: "15 Jan 2025 · 11:20 UTC",
    txHash: "0x2a9b4c5d…e6f78012", status: "complete", actor: "MedStore WH",
    detail: "Inventory reconciliation complete. Batch integrity confirmed.",
  },
  {
    id: 5, label: "Delivered to Pharmacy", icon: Store,
    location: "Servaid Pharmacy #218", timestamp: "16 Jan 2025 · 09:05 UTC",
    txHash: "0x5e6f7081…c2d3a4b5", status: "active", actor: "Servaid Network",
    detail: "On-shelf placement logged. Temperature & storage conditions met.",
  },
  {
    id: 6, label: "Purchased by Customer", icon: ShoppingBag,
    location: "Karachi — DHA Phase 5", timestamp: "18 Jan 2025 · 15:48 UTC",
    txHash: "0x9c0d1e2f…a4b5c6d7", status: "pending", actor: "End Customer",
    detail: "Point-of-sale QR scan initiated. Awaiting verification.",
  },
  {
    id: 7, label: "Final Verification", icon: ShieldCheck,
    location: "Mobile App — Patient", timestamp: "Pending",
    txHash: "0x—awaiting—confirmation", status: "pending", actor: "MediVerify AI",
    detail: "Blockchain hash match pending. AI scan in progress.",
  },
];

export function MedicineJourneyTracker() {
  const [activeStage, setActiveStage] = useState(4);
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-stage-node]",
        { scale: 0, opacity: 0 },
        {
          scale: 1, opacity: 1, duration: 0.6, stagger: 0.12, ease: "back.out(1.4)",
          scrollTrigger: { trigger: containerRef.current, start: "top 75%", once: true },
        }
      );
      gsap.fromTo(
        "[data-stage-card]",
        { opacity: 0, x: -20 },
        {
          opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: "expo.out",
          scrollTrigger: { trigger: containerRef.current, start: "top 75%", once: true },
          delay: 0.3,
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const activeCount = STAGES.filter((s) => s.status === "complete").length;
  const progressPct = (activeCount / (STAGES.length - 1)) * 100;

  return (
    <div ref={containerRef} className="relative">
      {/* Section header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1a56db]/10 border border-[#1a56db]/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#1a56db]">
            <Zap className="h-3 w-3" /> Medicine Journey
          </span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Full Supply Chain Tracker
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Every step recorded immutably on the blockchain · {activeCount} of {STAGES.length} stages verified
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8 rounded-2xl border border-border/40 bg-card/60 p-5 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between text-[12px]">
          <span className="font-semibold text-foreground">Journey Progress</span>
          <span className="font-bold text-[#1a56db]">{Math.round(progressPct)}% Complete</span>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-border/30">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: "linear-gradient(90deg, #1a56db, #06b6d4, #16a34a)",
              boxShadow: "0 0 12px 2px #1a56db55",
            }}
            initial={{ width: 0 }}
            whileInView={{ width: `${progressPct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
          />
          {/* Glow shimmer */}
          <motion.div
            className="absolute inset-y-0 w-16 rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
              left: `${progressPct - 8}%`,
            }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <div className="mt-3 flex items-center gap-4 text-[11px]">
          {[
            { color: "bg-[#16a34a]", label: "Verified" },
            { color: "bg-[#1a56db]", label: "Active" },
            { color: "bg-border/60", label: "Pending" },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${l.color}`} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* Desktop: horizontal stepper */}
      <div className="hidden lg:block">
        {/* Connector line */}
        <div className="relative mb-3 flex items-center px-8">
          <div ref={lineRef} className="absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-border/30" />
          <motion.div
            className="absolute top-1/2 left-8 h-0.5 -translate-y-1/2 rounded-full"
            style={{ background: "linear-gradient(90deg, #1a56db, #16a34a)", boxShadow: "0 0 8px #1a56db88" }}
            initial={{ width: 0 }}
            whileInView={{ width: `${progressPct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 0.6 }}
          />
          {/* Stage nodes */}
          <div className="relative flex w-full justify-between">
            {STAGES.map((stage, i) => {
              const isComplete = stage.status === "complete";
              const isActive = stage.status === "active";
              const isSelected = activeStage === i;
              return (
                <div
                  key={stage.id}
                  data-stage-node
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => setActiveStage(i)}
                  onMouseEnter={() => setHoveredStage(i)}
                  onMouseLeave={() => setHoveredStage(null)}
                >
                  <motion.div
                    className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300"
                    style={{
                      borderColor: isComplete
                        ? "#16a34a"
                        : isActive
                        ? "#1a56db"
                        : "rgba(255,255,255,0.12)",
                      background: isComplete
                        ? "linear-gradient(135deg, #16a34a22, #16a34a44)"
                        : isActive
                        ? "linear-gradient(135deg, #1a56db22, #06b6d444)"
                        : "rgba(255,255,255,0.03)",
                      boxShadow: isSelected
                        ? isComplete
                          ? "0 0 20px 4px #16a34a44"
                          : "0 0 20px 4px #1a56db44"
                        : "none",
                    }}
                    whileHover={{ scale: 1.15 }}
                    animate={isActive ? { boxShadow: ["0 0 0 0 #1a56db44", "0 0 20px 8px #1a56db22", "0 0 0 0 #1a56db44"] } : {}}
                    transition={isActive ? { duration: 2, repeat: Infinity } : {}}
                  >
                    <stage.icon
                      className="h-5 w-5"
                      style={{
                        color: isComplete ? "#16a34a" : isActive ? "#1a56db" : "#666",
                      }}
                    />
                    {isComplete && (
                      <motion.div
                        className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#16a34a]"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </motion.div>
                    )}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-[#1a56db]"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                  <span
                    className="mt-2 text-center text-[10px] font-semibold tracking-wide"
                    style={{
                      color: isComplete ? "#16a34a" : isActive ? "#1a56db" : "#666",
                    }}
                  >
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStage}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.35, ease }}
            className="mt-6 rounded-2xl border border-border/40 bg-card/80 p-6 backdrop-blur-sm"
            style={{
              borderColor:
                STAGES[activeStage].status === "complete"
                  ? "#16a34a44"
                  : STAGES[activeStage].status === "active"
                  ? "#1a56db44"
                  : undefined,
              boxShadow:
                STAGES[activeStage].status === "complete"
                  ? "0 0 40px 0 #16a34a11"
                  : STAGES[activeStage].status === "active"
                  ? "0 0 40px 0 #1a56db11"
                  : "none",
            }}
          >
            <StageDetailContent stage={STAGES[activeStage]} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile: vertical list */}
      <div className="lg:hidden space-y-3">
        {STAGES.map((stage, i) => {
          const isComplete = stage.status === "complete";
          const isActive = stage.status === "active";
          return (
            <motion.div
              key={stage.id}
              data-stage-card
              className="flex gap-4 rounded-2xl border border-border/40 bg-card/60 p-4 cursor-pointer transition-all duration-200 hover:border-border"
              onClick={() => setActiveStage(i)}
              style={{
                borderColor: isComplete ? "#16a34a44" : isActive ? "#1a56db44" : undefined,
              }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                style={{
                  borderColor: isComplete ? "#16a34a" : isActive ? "#1a56db" : "rgba(255,255,255,0.12)",
                  background: isComplete ? "#16a34a22" : isActive ? "#1a56db22" : "rgba(255,255,255,0.04)",
                }}
              >
                <stage.icon
                  className="h-4 w-4"
                  style={{ color: isComplete ? "#16a34a" : isActive ? "#1a56db" : "#666" }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold">{stage.label}</p>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      background: isComplete ? "#16a34a22" : isActive ? "#1a56db22" : "#ffffff11",
                      color: isComplete ? "#16a34a" : isActive ? "#1a56db" : "#888",
                    }}
                  >
                    {isComplete ? "Verified" : isActive ? "Active" : "Pending"}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{stage.location}</p>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground/60">{stage.txHash}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 self-center" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function StageDetailContent({ stage }: { stage: JourneyStage }) {
  const isComplete = stage.status === "complete";
  const isActive = stage.status === "active";
  const accentColor = isComplete ? "#16a34a" : isActive ? "#1a56db" : "#888";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl border"
            style={{ borderColor: `${accentColor}44`, background: `${accentColor}11` }}
          >
            <stage.icon className="h-6 w-6" style={{ color: accentColor }} />
          </div>
          <div>
            <h3 className="text-[16px] font-bold">{stage.label}</h3>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ background: `${accentColor}22`, color: accentColor }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: accentColor }} />
              {stage.status}
            </span>
          </div>
        </div>
        <p className="text-[13px] text-muted-foreground leading-relaxed">{stage.detail}</p>
        <div className="mt-4 space-y-2.5">
          {[
            { icon: MapPin, label: "Location", value: stage.location },
            { icon: Clock, label: "Timestamp", value: stage.timestamp },
            { icon: ShieldCheck, label: "Actor", value: stage.actor },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 text-[12px]">
              <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{label}:</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground mb-3">
          Blockchain Transaction
        </p>
        <div
          className="rounded-xl border p-4 font-mono"
          style={{ borderColor: `${accentColor}33`, background: `${accentColor}08` }}
        >
          <div className="mb-3 flex items-center gap-2">
            <Hash className="h-3.5 w-3.5" style={{ color: accentColor }} />
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: accentColor }}>
              TX Hash
            </span>
          </div>
          <p className="text-[12px] break-all text-foreground/80 leading-relaxed">{stage.txHash}</p>

          {isComplete && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Confirmations</span>
                <span className="font-bold" style={{ color: accentColor }}>247 / 6 required</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Block Height</span>
                <span className="font-bold tabular-nums">#18,492,{stage.id * 113 + 2901}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Gas Used</span>
                <span className="font-bold tabular-nums">21,000</span>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#16a34a]/10 px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-[#16a34a]" />
                <span className="text-[11px] font-semibold text-[#16a34a]">Immutably confirmed on-chain</span>
              </div>
            </div>
          )}
          {isActive && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#1a56db]/10 px-3 py-2">
              <motion.div
                className="h-3 w-3 rounded-full bg-[#1a56db]"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <span className="text-[11px] font-semibold text-[#1a56db]">Awaiting block confirmation…</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
