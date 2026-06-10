import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Zap, Globe, Activity, TrendingUp, AlertTriangle, ShieldCheck } from "lucide-react";
import { useFraudStore } from "@/store/fraud-store";

/**
 * AI Fraud Monitor — Intelligence Visualization
 */
export function AIFraudMonitor() {
    const { alerts, globalScores } = useFraudStore();

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            {/* 1. Risk Radar / Intelligence Cards */}
            <div className="lg:col-span-1 space-y-4">
                <RiskIntelligenceCard
                    label="Medicine Risk"
                    value={globalScores.medicineRisk}
                    icon={ShieldAlert}
                    color="destructive"
                    description="Counterfeit probability based on duplication patterns."
                />
                <RiskIntelligenceCard
                    label="Pharmacy Trust"
                    value={globalScores.pharmacyTrust}
                    icon={Globe}
                    color="success"
                    description="Aggregated trust score from across the supply chain."
                />
                <RiskIntelligenceCard
                    label="Region Threat"
                    value={globalScores.regionThreat}
                    icon={Activity}
                    color="warning"
                    description="Current anomaly density in registered scan zones."
                />
            </div>

            {/* 2. Real-time Fraud Feed */}
            <div className="lg:col-span-2 card-premium p-0 overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-white/5 bg-gradient-to-r from-destructive/10 to-transparent flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Zap className="h-5 w-5 text-destructive animate-pulse" />
                            <div className="absolute inset-0 bg-destructive/40 blur-lg animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-[15px] font-bold tracking-tight">AI Intelligence Feed</h3>
                            <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-black">Live Fraud Monitoring</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-destructive animate-ping" />
                        <span className="text-[10px] font-bold text-destructive">LIVE ANALYSIS</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[400px] p-2 space-y-1">
                    <AnimatePresence initial={false}>
                        {alerts.map((alert, i) => (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, x: -20, height: 0 }}
                                animate={{ opacity: 1, x: 0, height: "auto" }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                                className={`group relative p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all overflow-hidden`}
                            >
                                <div className={`absolute inset-y-0 left-0 w-1 ${alert.severity === "critical" ? "bg-destructive" : alert.severity === "high" ? "bg-orange-500" : "bg-warning"
                                    } shadow-[0_0_10px_rgba(255,0,0,0.5)]`} />

                                <div className="flex items-start gap-4">
                                    <div className={`mt-1 p-2 rounded-lg ${alert.severity === "critical" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                                        }`}>
                                        <AlertTriangle className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <p className="text-[13px] font-bold truncate">{alert.message}</p>
                                            <span className="text-[10px] font-mono opacity-50 tabular-nums">
                                                {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black uppercase tracking-tighter opacity-60">TARGET: {alert.targetId}</span>
                                            <span className="h-1 w-1 rounded-full bg-white/20" />
                                            <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                                                <Globe className="h-2.5 w-2.5" /> {alert.location || "Centralized Supply"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                <div className="p-4 border-t border-white/5 bg-secondary/20 flex justify-center">
                    <button className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1.5 uppercase tracking-widest">
                        Access Neural Fraud Reports <TrendingUp className="h-3 w-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function RiskIntelligenceCard({ label, value, icon: Icon, color, description }: any) {
    return (
        <div className="card-premium p-5 group hover:border-primary/30 transition-all duration-500 overflow-hidden relative">
            <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${color === 'success' ? 'bg-success' : 'bg-destructive'}`} />

            <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${color === 'success' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="text-right">
                    <p className={`text-[20px] font-black tracking-tight ${color === 'success' ? 'text-success' : value > 30 ? 'text-destructive' : 'text-foreground'}`}>
                        {value}<span className="text-[11px] opacity-50 ml-0.5">%</span>
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-50">Intelligence Score</p>
                </div>
            </div>

            <div>
                <h4 className="text-[14px] font-bold mb-1">{label}</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed italic">{description}</p>
            </div>

            <div className="mt-4 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className={`h-full ${color === 'success' ? 'bg-success shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.4)]'}`}
                />
            </div>
        </div>
    );
}
