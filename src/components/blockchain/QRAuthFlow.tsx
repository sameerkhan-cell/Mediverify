import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode, Shield, ShieldCheck, ShieldAlert, Cpu, Zap,
  CheckCircle2, XCircle, AlertTriangle, RefreshCw, Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ease } from "@/lib/motion";


type VerifyState = "idle" | "scanning" | "querying" | "matching" | "confirming" | "success" | "failure" | "duplicate";

const FLOW_STEPS = [
  { id: "scanning",   label: "QR Code Scanned",           icon: QrCode,       color: "#06b6d4" },
  { id: "querying",   label: "Blockchain Queried",         icon: Cpu,          color: "#1a56db" },
  { id: "matching",   label: "Hash Matched",               icon: Hash,         color: "#8b5cf6" },
  { id: "confirming", label: "Verification Confirmed",     icon: ShieldCheck,  color: "#1a56db" },
  { id: "success",    label: "Medicine Authenticated",     icon: CheckCircle2, color: "#16a34a" },
];

const STATE_LABELS: Partial<Record<VerifyState, string>> = {
  idle:       "Tap any mode to begin simulation",
  scanning:   "Scanning QR code with AI optics…",
  querying:   "Querying distributed blockchain nodes…",
  matching:   "Running cryptographic hash comparison…",
  confirming: "Confirming supply chain integrity…",
  success:    "Medicine verified — Safe to consume",
  failure:    "⚠ Hash mismatch — Possible counterfeit",
  duplicate:  "🔴 Duplicate scan detected — ALERT",
};

function DataStream({ active }: { active: boolean }) {
  const chars = "0123456789ABCDEF";
  const rows = 5;
  const cols = 16;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
      {Array.from({ length: rows }).map((_, r) => (
        <motion.div
          key={r}
          className="flex justify-center gap-1 font-mono text-[8px] leading-tight"
          animate={active ? { opacity: [0, 1, 0] } : { opacity: 0 }}
          transition={{ duration: 1.6, delay: r * 0.2, repeat: active ? Infinity : 0 }}
          style={{ color: "#06b6d4" }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <motion.span
              key={c}
              animate={active ? { opacity: [0, 1, 0] } : {}}
              transition={{ duration: 0.5, delay: (r * cols + c) * 0.015, repeat: active ? Infinity : 0 }}
            >
              {chars[Math.floor(Math.random() * chars.length)]}
            </motion.span>
          ))}
        </motion.div>
      ))}
    </div>
  );
}

export function QRAuthFlow() {
  const [state, setState] = useState<VerifyState>("idle");
  const [stepIndex, setStepIndex] = useState(-1);
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    if (state === "idle") return;
    const isError = state === "failure" || state === "duplicate";
    if (isError) return;

    const order: VerifyState[] = ["scanning", "querying", "matching", "confirming", "success"];
    const idx = order.indexOf(state);
    if (idx === -1) return;
    setStepIndex(idx);
    if (idx < order.length - 1) {
      const timer = setTimeout(() => setState(order[idx + 1]), 900);
      return () => clearTimeout(timer);
    }
  }, [state]);

  useEffect(() => {
    let raf: number;
    const tick = () => { setAngle((a) => (a + 0.5) % 360); raf = requestAnimationFrame(tick); };
    if (state !== "idle" && state !== "success" && state !== "failure" && state !== "duplicate") {
      raf = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(raf);
  }, [state]);

  function startFlow(mode: "success" | "failure" | "duplicate") {
    setState("scanning");
    setStepIndex(-1);
    if (mode !== "success") {
      setTimeout(() => setState(mode), 2400);
    }
  }

  function reset() { setState("idle"); setStepIndex(-1); }

  const isError = state === "failure" || state === "duplicate";
  const isSuccess = state === "success";
  const isActive = state !== "idle" && !isError && !isSuccess;

  const ringColor = isError ? "#dc2626" : isSuccess ? "#16a34a" : "#1a56db";
  const ringGlow = isError ? "#dc262644" : isSuccess ? "#16a34a44" : "#1a56db44";

  return (
    <div>
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#8b5cf6] mb-2">
          <QrCode className="h-3 w-3" /> QR Authentication
        </span>
        <h2 className="text-2xl font-bold tracking-tight">QR Authenticity Flow</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Immersive blockchain verification — simulate any outcome below
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left — visualizer */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border/40 bg-card/60 p-8 backdrop-blur-sm">
          {/* Holographic ring */}
          <div className="relative flex h-52 w-52 items-center justify-center">
            {/* Outer rotating rings */}
            {[1, 0.7, 0.5].map((scale, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border-2"
                style={{
                  borderColor: `${ringColor}${Math.round((1 - i * 0.25) * 255).toString(16).padStart(2, "0")}`,
                  scale,
                }}
                animate={isActive ? { rotate: i % 2 === 0 ? angle : -angle } : { rotate: 0 }}
                transition={{ duration: 0 }}
              />
            ))}

            {/* Glow pulse rings */}
            {(isActive || isSuccess || isError) && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ border: `2px solid ${ringColor}` }}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ border: `2px solid ${ringColor}` }}
                  animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.8, delay: 0.4, repeat: Infinity }}
                />
              </>
            )}

            {/* Data stream background */}
            <DataStream active={isActive} />

            {/* Center icon */}
            <motion.div
              className="relative z-10 flex h-24 w-24 items-center justify-center rounded-2xl border-2"
              style={{
                borderColor: ringColor,
                background: `linear-gradient(135deg, ${ringColor}22, ${ringColor}11)`,
                boxShadow: `0 0 40px 0 ${ringGlow}`,
              }}
              animate={
                isActive
                  ? { rotate: [0, 5, -5, 0], scale: [1, 1.02, 1] }
                  : isSuccess
                  ? { scale: [1, 1.08, 1] }
                  : isError
                  ? { rotate: [0, -3, 3, 0] }
                  : {}
              }
              transition={
                isActive
                  ? { duration: 2, repeat: Infinity }
                  : { duration: 0.5, repeat: isError ? 3 : isSuccess ? 1 : 0 }
              }
            >
              {state === "idle" && <QrCode className="h-10 w-10 text-muted-foreground" />}
              {isActive && <Shield className="h-10 w-10" style={{ color: ringColor }} />}
              {isSuccess && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                  <ShieldCheck className="h-10 w-10" style={{ color: "#16a34a" }} />
                </motion.div>
              )}
              {state === "failure" && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                  <XCircle className="h-10 w-10" style={{ color: "#dc2626" }} />
                </motion.div>
              )}
              {state === "duplicate" && (
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <ShieldAlert className="h-10 w-10" style={{ color: "#dc2626" }} />
                </motion.div>
              )}
            </motion.div>

            {/* Scan beam */}
            {isActive && (
              <motion.div
                className="absolute inset-x-2 h-0.5 rounded-full z-10"
                style={{
                  background: `linear-gradient(90deg, transparent, ${ringColor}, transparent)`,
                  boxShadow: `0 0 8px ${ringColor}`,
                  top: "12px",
                }}
                animate={{ y: [0, 200, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
              />
            )}

            {/* Corner brackets */}
            {["tl", "tr", "bl", "br"].map((corner) => (
              <div
                key={corner}
                className="absolute h-5 w-5"
                style={{
                  top:    corner.startsWith("t") ? 0 : "auto",
                  bottom: corner.startsWith("b") ? 0 : "auto",
                  left:   corner.endsWith("l") ? 0 : "auto",
                  right:  corner.endsWith("r") ? 0 : "auto",
                  borderTop:    corner.startsWith("t") ? `2px solid ${ringColor}` : "none",
                  borderBottom: corner.startsWith("b") ? `2px solid ${ringColor}` : "none",
                  borderLeft:   corner.endsWith("l") ? `2px solid ${ringColor}` : "none",
                  borderRight:  corner.endsWith("r") ? `2px solid ${ringColor}` : "none",
                }}
              />
            ))}
          </div>

          {/* Status label */}
          <AnimatePresence mode="wait">
            <motion.p
              key={state}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease }}
              className="mt-6 text-center text-[13px] font-semibold"
              style={{
                color: isSuccess ? "#16a34a" : isError ? "#dc2626" : isActive ? "#1a56db" : "var(--muted-foreground)",
              }}
            >
              {STATE_LABELS[state]}
            </motion.p>
          </AnimatePresence>

          {/* Control buttons */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {state === "idle" || isSuccess || isError ? (
              <>
                <Button
                  size="sm"
                  onClick={() => startFlow("success")}
                  className="rounded-full text-[12px]"
                  style={{ background: "#16a34a22", color: "#16a34a", border: "1px solid #16a34a44" }}
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Genuine
                </Button>
                <Button
                  size="sm"
                  onClick={() => startFlow("failure")}
                  className="rounded-full text-[12px]"
                  style={{ background: "#f59e0b22", color: "#f59e0b", border: "1px solid #f59e0b44" }}
                >
                  <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Counterfeit
                </Button>
                <Button
                  size="sm"
                  onClick={() => startFlow("duplicate")}
                  className="rounded-full text-[12px]"
                  style={{ background: "#dc262622", color: "#dc2626", border: "1px solid #dc262644" }}
                >
                  <ShieldAlert className="mr-1.5 h-3.5 w-3.5" /> Duplicate
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={reset} className="rounded-full text-[12px]">
                <RefreshCw className="mr-1.5 h-3 w-3" /> Reset
              </Button>
            )}
          </div>
        </div>

        {/* Right — step flow */}
        <div className="space-y-3">
          {FLOW_STEPS.map((step, i) => {
            const isDone = stepIndex > i || isSuccess;
            const isCurrent = stepIndex === i && isActive;
            const isWaiting = stepIndex < i && !isSuccess;
            const StepIcon = step.icon;
            return (
              <motion.div
                key={step.id}
                className="flex items-center gap-4 rounded-xl border p-4 transition-all duration-300"
                style={{
                  borderColor: isDone ? `${step.color}44` : isCurrent ? `${step.color}66` : "rgba(255,255,255,0.06)",
                  background: isDone ? `${step.color}0d` : isCurrent ? `${step.color}14` : "rgba(255,255,255,0.02)",
                  boxShadow: isCurrent ? `0 0 20px 0 ${step.color}22` : "none",
                }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2"
                  style={{
                    borderColor: isDone ? step.color : isCurrent ? step.color : "rgba(255,255,255,0.12)",
                    background: isDone ? `${step.color}22` : isCurrent ? `${step.color}11` : "transparent",
                  }}
                >
                  {isDone ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
                      <CheckCircle2 className="h-4 w-4" style={{ color: step.color }} />
                    </motion.div>
                  ) : isCurrent ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Zap className="h-4 w-4" style={{ color: step.color }} />
                    </motion.div>
                  ) : (
                    <StepIcon className="h-4 w-4" style={{ color: isWaiting ? "#555" : step.color }} />
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className="text-[13px] font-semibold"
                    style={{ color: isDone ? step.color : isCurrent ? step.color : "#666" }}
                  >
                    {step.label}
                  </p>
                  {isCurrent && (
                    <motion.p
                      className="text-[11px]"
                      style={{ color: step.color }}
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    >
                      Processing…
                    </motion.p>
                  )}
                  {isDone && (
                    <p className="text-[11px] text-muted-foreground">Complete</p>
                  )}
                </div>
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full"
                  style={{
                    background: isDone ? `${step.color}22` : isCurrent ? `${step.color}11` : "transparent",
                  }}
                >
                  <span className="text-[10px] font-bold" style={{ color: isDone ? step.color : "#555" }}>
                    {i + 1}
                  </span>
                </div>
              </motion.div>
            );
          })}

          {/* Result state */}
          <AnimatePresence>
            {(isSuccess || isError) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.45, ease }}
                className="rounded-xl border p-5 text-center"
                style={{
                  borderColor: isSuccess ? "#16a34a55" : "#dc262655",
                  background: isSuccess ? "#16a34a11" : "#dc262611",
                  boxShadow: isSuccess ? "0 0 40px 0 #16a34a22" : "0 0 40px 0 #dc262622",
                }}
              >
                {isSuccess ? (
                  <>
                    <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-[#16a34a]" />
                    <p className="font-bold text-[#16a34a]">Medicine Authenticated</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">Blockchain hash matched · Safe to consume</p>
                  </>
                ) : state === "duplicate" ? (
                  <>
                    <ShieldAlert className="mx-auto mb-2 h-8 w-8 text-[#dc2626]" />
                    <motion.p
                      className="font-bold text-[#dc2626]"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      DUPLICATE QR DETECTED
                    </motion.p>
                    <p className="mt-1 text-[12px] text-muted-foreground">This QR was already scanned · Possible counterfeit</p>
                  </>
                ) : (
                  <>
                    <XCircle className="mx-auto mb-2 h-8 w-8 text-[#dc2626]" />
                    <p className="font-bold text-[#dc2626]">Verification Failed</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">Hash mismatch — Do NOT consume this medicine</p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
