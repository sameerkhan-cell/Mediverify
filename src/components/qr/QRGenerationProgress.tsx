import { motion } from "framer-motion";
import { Package, Pill, ShieldCheck, Zap } from "lucide-react";
import type { GenerationProgress } from "@/types/dual-qr";
import { ease } from "@/lib/motion";

interface Props {
    progress: GenerationProgress;
}

const PHASES = [
    { key: "registering", label: "Blockchain Registration", icon: ShieldCheck },
    { key: "generating-box-qr", label: "Box QR Generation", icon: Package },
    { key: "generating-pill-qrs", label: "Pill QR Mass Generation", icon: Pill },
    { key: "complete", label: "Finalized on Chain", icon: Zap },
] as const;

function phaseIndex(phase: string) {
    return PHASES.findIndex((p) => p.key === phase);
}

export function QRGenerationProgress({ progress }: Props) {
    const current = phaseIndex(progress.phase);

    return (
        <div className="space-y-6 py-4">
            {/* Central animated orb */}
            <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
                {/* outer rings */}
                {[1, 1.6, 2.1].map((scale, i) => (
                    <motion.div
                        key={i}
                        className="absolute inset-0 rounded-full border border-primary/30"
                        animate={{ scale: [1, scale, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 2, delay: i * 0.4, repeat: Infinity, ease: "easeInOut" }}
                    />
                ))}
                {/* core */}
                <motion.div
                    className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary shadow-glow"
                    animate={{ rotate: progress.phase === "complete" ? 0 : 360 }}
                    transition={{
                        rotate: { duration: 2.5, repeat: progress.phase === "complete" ? 0 : Infinity, ease: "linear" },
                    }}
                >
                    <Pill className="h-8 w-8 text-white" />
                </motion.div>
                {/* success flash */}
                {progress.phase === "complete" && (
                    <motion.div
                        className="absolute inset-0 rounded-full bg-success/20"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 0.8, ease }}
                    />
                )}
            </div>

            {/* Progress message */}
            <div className="text-center">
                <motion.p
                    key={progress.currentMessage}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[14px] font-semibold"
                >
                    {progress.currentMessage}
                </motion.p>
                {progress.phase === "generating-pill-qrs" && progress.totalPills > 0 && (
                    <p className="mt-1 text-[12px] text-muted-foreground tabular-nums">
                        {progress.pillsGenerated.toLocaleString()} of {progress.totalPills.toLocaleString()} pill QRs
                    </p>
                )}
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Progress</span>
                    <span className="tabular-nums font-semibold">{progress.percentage}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/60">
                    <motion.div
                        className="h-full rounded-full bg-gradient-primary"
                        initial={{ width: "0%" }}
                        animate={{ width: `${progress.percentage}%` }}
                        transition={{ duration: 0.4, ease }}
                    />
                </div>
            </div>

            {/* Phase stepper */}
            <div className="flex items-start justify-between gap-2">
                {PHASES.map((p, i) => {
                    const done = i < current;
                    const active = i === current;
                    const pending = i > current;
                    return (
                        <div key={p.key} className="flex flex-1 flex-col items-center gap-1.5 text-center relative">
                            {i > 0 && (
                                <div
                                    className={`absolute top-3.5 right-[50%] left-[-50%] h-px ${done ? "bg-success" : "bg-border/50"} transition-colors duration-500`}
                                    style={{ zIndex: 0 }}
                                />
                            )}
                            <motion.div
                                className={`relative z-10 grid h-7 w-7 place-items-center rounded-full text-white text-[10px] transition-all duration-400 ${done ? "bg-success"
                                        : active ? "bg-gradient-primary shadow-elegant"
                                            : "bg-secondary/60 text-muted-foreground"
                                    }`}
                                animate={active ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                                transition={{ duration: 1.2, repeat: active ? Infinity : 0 }}
                            >
                                {done
                                    ? <span className="text-[9px]">✓</span>
                                    : <p.icon className="h-3.5 w-3.5" />
                                }
                            </motion.div>
                            <p className={`text-[9px] font-semibold leading-tight ${active ? "text-primary" : done ? "text-success" : "text-muted-foreground"
                                }`}>
                                {p.label}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
