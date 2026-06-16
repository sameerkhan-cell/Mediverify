import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Building2, ShieldAlert, BarChart3, Users,
    FileText, Search, Filter, ArrowUpRight,
    AlertTriangle, CheckCircle2, MoreVertical,
    Download, LayoutDashboard, Globe2, Landmark,
    Scale, Megaphone, Pill, MapPin, Loader2
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { DashShell } from "@/components/dashboard/DashShell";
import { DASH_NAV } from "@/config/nav";
import { StatCard, MetricRow } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export const Route = createFileRoute("/dashboard/regulator")({
    head: () => ({
        meta: [
            { title: "DRAP Regulatory Portal — MediVerify" },
            { name: "description", content: "National healthcare surveillance and regulatory inspection dashboard." },
        ],
    }),
    component: RegulatorDashboard,
});

function RegulatorDashboard() {
    const { user, isAuthenticated, signOut, isLoading, session } = useAuth();

    const [stats, setStats] = useState<any>(null);
    const [recalls, setRecalls] = useState<any[]>([]);
    const [heatmapData, setHeatmapData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated && user?.role !== "REGULATOR" && user?.role !== "DRAP_ADMIN" && user?.role !== "ADMIN") {
            signOut();
        }
    }, [isAuthenticated, user?.role, signOut]);

    useEffect(() => {
        if (!session?.token) return;
        const headers = { "Authorization": `Bearer ${session.token}` };
        Promise.all([
            fetch("/api/regulator/stats", { headers }).then(r => r.json()),
            fetch("/api/regulator/recalls", { headers }).then(r => r.json()),
            fetch("/api/regulator/heatmap", { headers }).then(r => r.json()),
        ]).then(([statsRes, recallsRes, heatmapRes]) => {
            if (statsRes.success) setStats(statsRes.data);
            if (recallsRes.success) setRecalls(recallsRes.data);
            if (heatmapRes.success) setHeatmapData(heatmapRes.data);
        }).catch(err => console.error("Regulator data fetch failed:", err))
            .finally(() => setLoading(false));
    }, [session?.token]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) return <Navigate to="/auth/login" />;
    if (user?.role !== "REGULATOR" && user?.role !== "DRAP_ADMIN" && user?.role !== "ADMIN") return <Navigate to="/auth/login" />;

    return (
        <DashShell
            title="Regulatory Oversight Portal"
            subtitle="National Healthcare Surveillance & DRAP Integration"
            badge="Government"
            nav={DASH_NAV}
        >
            <div className="space-y-6">
                {/* Regulatory Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard icon={Landmark} label="Total Scans" value={stats?.totalScans ?? "..."} delta={12} sparkline={[40, 55, 60, 45, 80, 95, 110, 142]} />
                    <StatCard icon={ShieldAlert} label="Active Recalls" value={stats?.activeRecalls ?? "..."} delta={-2} tone="destructive" sparkline={[5, 8, 12, 10, 15, 8, 6, 4]} />
                    <StatCard icon={FileText} label="Suspicious Scans" value={stats?.suspiciousScans ?? "..."} delta={5} tone="warning" sparkline={[20, 25, 30, 45, 50, 42, 38, 35]} />
                    <StatCard icon={Scale} label="Blacklisted Entities" value={stats?.blacklistedPharmacies ?? "..."} delta={1} tone="destructive" sparkline={[5, 5, 6, 6, 7, 8, 8, 9]} />
                </div>

                {/* Pakistan Fake Medicine Heatmap */}
                {heatmapData.length > 0 && (
                    <div className="card-premium p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin className="h-4 w-4 text-red-500" />
                            <h3 className="font-semibold text-sm">Fake Medicine Hotspots — Pakistan</h3>
                            <span className="ml-auto text-xs text-muted-foreground">Based on verified scan reports</span>
                        </div>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={heatmapData} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="city" tick={{ fontSize: 12 }} width={85} axisLine={false} tickLine={false} />
                                <Tooltip
                                    formatter={(val: any) => [val + " reports", "Fake scans"]}
                                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                                />
                                <Bar dataKey="fakeCount" radius={[0, 4, 4, 0]} maxBarSize={22}>
                                    {heatmapData.map((entry, i) => (
                                        <Cell
                                            key={i}
                                            fill={entry.riskLevel === "HIGH" ? "#DC2626" : entry.riskLevel === "MEDIUM" ? "#D97706" : "#16A34A"}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="flex gap-4 mt-3">
                            {([["HIGH", "#DC2626", "High Risk"], ["MEDIUM", "#D97706", "Medium Risk"], ["LOW", "#16A34A", "Low Risk"]] as const).map(([level, color, label]) => (
                                <div key={level} className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                                    <span className="text-xs text-muted-foreground">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column: Recalls & Investigations */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Emergency Recall Monitor */}
                        <div className="card-premium p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[14px] font-bold flex items-center gap-2">
                                    <Megaphone className="h-4 w-4 text-destructive" /> Emergency Recall Monitor
                                </h3>
                                <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/5 font-black text-[10px]">REAL-TIME</Badge>
                            </div>
                            <div className="space-y-4">
                                {recalls.length === 0 ? (
                                    <div className="py-12 text-center flex flex-col items-center">
                                        <div className="h-16 w-16 bg-secondary/20 rounded-full flex items-center justify-center mb-4">
                                            <CheckCircle2 className="h-8 w-8 text-success opacity-30" />
                                        </div>
                                        <p className="text-muted-foreground font-medium">No active recalls in the system.</p>
                                    </div>
                                ) : (
                                    recalls.map((recall) => (
                                        <div key={recall.id} className="p-4 rounded-2xl border border-white/5 bg-secondary/20 flex items-center gap-4">
                                            <div className="h-10 w-10 shrink-0 rounded-xl bg-destructive/10 grid place-items-center">
                                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[13px] font-bold">{recall.medicine?.name || "Unknown"} (Batch {recall.batchNumber})</p>
                                                <p className="text-[11px] text-muted-foreground line-clamp-1">
                                                    {recall.recallReason || "Recall issued"} · {recall.medicine?.manufacturer?.companyName || ""}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[12px] font-black uppercase text-destructive tracking-widest italic">Recall Active</p>
                                                <p className="text-[10px] text-muted-foreground">{new Date(recall.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Additional Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <MetricRow icon={Users} label="Total Manufacturers" value={stats?.totalManufacturers ?? "..."} tone="primary" />
                            <MetricRow icon={AlertTriangle} label="Fakes Detected" value={stats?.fakeDetected ?? "..."} tone="destructive" />
                        </div>
                    </div>

                    {/* Right Column: Alerts & Config */}
                    <div className="space-y-6">
                        {/* Regulatory Alerts Config */}
                        <div className="card-premium p-6 bg-gradient-to-br from-primary/10 to-transparent">
                            <h3 className="text-[14px] font-bold mb-4">Emergency Alert System</h3>
                            <div className="space-y-3">
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                    <p className="text-[11px] font-bold mb-1">Target Region</p>
                                    <select className="w-full bg-black/20 border-none rounded-lg text-[12px] h-8 px-2 font-medium">
                                        <option>All Pakistan</option>
                                        <option>Sindh</option>
                                        <option>Punjab</option>
                                        <option>KPK</option>
                                        <option>Balochistan</option>
                                    </select>
                                </div>
                                <Button className="w-full rounded-xl bg-primary h-11 text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
                                    <Megaphone className="h-4 w-4 mr-2" /> Broadcast Alert
                                </Button>
                            </div>
                        </div>

                        {/* Quick Overview */}
                        <div className="card-premium p-6">
                            <h3 className="text-[14px] font-bold mb-4 flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-primary" /> Oversight Summary
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { label: "Total Scans", value: stats?.totalScans ?? "...", icon: Globe2 },
                                    { label: "Fakes Detected", value: stats?.fakeDetected ?? "...", icon: ShieldAlert },
                                    { label: "Suspicious", value: stats?.suspiciousScans ?? "...", icon: AlertTriangle },
                                    { label: "Active Recalls", value: stats?.activeRecalls ?? "...", icon: Megaphone },
                                    { label: "Blacklisted", value: stats?.blacklistedPharmacies ?? "...", icon: Scale },
                                    { label: "Manufacturers", value: stats?.totalManufacturers ?? "...", icon: Building2 },
                                ].map(({ label, value, icon: Icon }) => (
                                    <div key={label} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/20">
                                        <span className="text-[11px] text-muted-foreground flex items-center gap-2">
                                            <Icon className="h-3.5 w-3.5" /> {label}
                                        </span>
                                        <span className="text-[13px] font-bold tabular-nums">{typeof value === "number" ? value.toLocaleString() : value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashShell>
    );
}
