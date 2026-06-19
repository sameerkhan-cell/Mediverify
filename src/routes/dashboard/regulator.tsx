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
import { useRegulatoryStore } from "@/store/regulatory-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    const { user, isAuthenticated, signOut, isLoading } = useAuth();
    const { reports, recalls, blacklistedPharmacies, updateReportStatus } = useRegulatoryStore();

    useEffect(() => {
        if (isAuthenticated && user?.role !== "manufacturer" && user?.role !== "pharmacy") {
            signOut();
        }
    }, [isAuthenticated, user?.role, signOut]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) return <Navigate to="/auth/login" />;
    // For demo purposes, we'll allow manufacturers and pharmacies to view this
    if (user?.role !== "manufacturer" && user?.role !== "pharmacy") return <Navigate to="/auth/login" />;

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
                    <StatCard icon={Landmark} label="DRAP Inspections" value={142} delta={12} sparkline={[40, 55, 60, 45, 80, 95, 110, 142]} />
                    <StatCard icon={ShieldAlert} label="Active Recalls" value={recalls.length} delta={-2} tone="destructive" sparkline={[5, 8, 12, 10, 15, 8, 6, 4]} />
                    <StatCard icon={FileText} label="Pending Reports" value={reports.filter(r => r.status === 'pending').length} delta={5} tone="warning" sparkline={[20, 25, 30, 45, 50, 42, 38, 35]} />
                    <StatCard icon={Scale} label="Blacklisted Entities" value={blacklistedPharmacies.length} delta={1} tone="destructive" sparkline={[5, 5, 6, 6, 7, 8, 8, 9]} />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column: Complaints & Investigations */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card-premium p-0 overflow-hidden">
                            <Tabs defaultValue="complaints" className="w-full">
                                <div className="px-6 py-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black/10">
                                    <TabsList className="bg-secondary/40 h-9 p-1 w-full sm:w-auto">
                                        <TabsTrigger value="complaints" className="text-[11px] font-bold uppercase tracking-widest px-4 flex-1 sm:flex-none">Consumer Complaints</TabsTrigger>
                                        <TabsTrigger value="inspections" className="text-[11px] font-bold uppercase tracking-widest px-4 flex-1 sm:flex-none">Active Investigations</TabsTrigger>
                                    </TabsList>
                                    <Button variant="outline" size="sm" className="rounded-full h-8 px-4 text-[11px] font-bold w-full sm:w-auto">
                                        <Download className="h-3.5 w-3.5 mr-2" /> Export Audit Log
                                    </Button>
                                </div>
                                <TabsContent value="complaints" className="m-0">
                                    <div className="p-0">
                                        {reports.length === 0 ? (
                                            <div className="py-20 text-center flex flex-col items-center">
                                                <div className="h-16 w-16 bg-secondary/20 rounded-full flex items-center justify-center mb-4">
                                                    <FileText className="h-8 w-8 text-muted-foreground opacity-30" />
                                                </div>
                                                <p className="text-muted-foreground font-medium">No active complaints found in the ledger.</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-white/5">
                                                {reports.map((report) => (
                                                    <ReportListItem key={report.id} report={report} onStatusUpdate={updateReportStatus} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                                <TabsContent value="inspections" className="m-0 p-12 text-center text-muted-foreground">
                                    Inspection tracking module is synchronizing with regional nodes...
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Recent Recalls Monitor */}
                        <div className="card-premium p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[14px] font-bold flex items-center gap-2">
                                    <Megaphone className="h-4 w-4 text-destructive" /> Emergency Recall Monitor
                                </h3>
                                <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/5 font-black text-[10px]">REAL-TIME</Badge>
                            </div>
                            <div className="space-y-4">
                                {recalls.map((recall) => (
                                    <div key={recall.id} className="p-4 rounded-2xl border border-white/5 bg-secondary/20 flex items-center gap-4">
                                        <div className="h-10 w-10 shrink-0 rounded-xl bg-destructive/10 grid place-items-center">
                                            <AlertTriangle className="h-5 w-5 text-destructive" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[13px] font-bold">{recall.medicineName} (Batch {recall.batchNumber})</p>
                                            <p className="text-[11px] text-muted-foreground line-clamp-1">{recall.reason}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[12px] font-black uppercase text-destructive tracking-widest italic">Recall Active</p>
                                            <p className="text-[10px] text-muted-foreground">{new Date(recall.dateInitiated).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Blacklist & Registry */}
                    <div className="space-y-6">
                        <div className="card-premium p-6 border-destructive/20">
                            <h3 className="text-[14px] font-black tracking-widest uppercase text-destructive mb-6 flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4" /> Blacklisted Entities
                            </h3>
                            <div className="space-y-4">
                                {blacklistedPharmacies.map((shop) => (
                                    <div key={shop.id} className="p-4 rounded-2xl border border-destructive/10 bg-destructive/[0.03] space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="min-w-0">
                                                <h4 className="text-[13px] font-bold truncate">{shop.name}</h4>
                                                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" /> {shop.location}
                                                </p>
                                            </div>
                                            <Badge className="bg-destructive text-[9px] font-black shadow-[0_0_10px_rgba(239,68,68,0.3)]">BANNED</Badge>
                                        </div>
                                        <div className="pt-2 border-t border-destructive/10">
                                            <p className="text-[9px] font-black uppercase opacity-50 mb-1">Critical Violations</p>
                                            <ul className="space-y-1">
                                                {shop.violations.map((v, i) => (
                                                    <li key={i} className="text-[10px] text-destructive/80 flex items-start gap-1.5 font-medium">
                                                        <div className="h-1 w-1 rounded-full bg-destructive mt-1 shrink-0" />
                                                        {v}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

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
                                    </select>
                                </div>
                                <Button className="w-full rounded-xl bg-primary h-11 text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
                                    <Megaphone className="h-4 w-4 mr-2" /> Broadcast Alert
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashShell>
    );
}

function ReportListItem({ report, onStatusUpdate }: { report: any, onStatusUpdate: any }) {
    const statusColors = {
        pending: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        investigating: "text-primary bg-primary/10 border-primary/20",
        verified: "text-destructive bg-destructive/10 border-destructive/20",
        dismissed: "text-muted-foreground bg-secondary border-white/5"
    };

    return (
        <div className="p-5 hover:bg-white/[0.02] transition-colors group">
            <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                        <Pill className="h-4 w-4 text-primary shrink-0" />
                        <h4 className="text-[14px] font-bold truncate tracking-tight">{report.medicineName}</h4>
                        <Badge className={`${statusColors[report.status as keyof typeof statusColors]} text-[9px] font-black px-2 py-0 h-4 border uppercase tracking-widest`}>
                            {report.status}
                        </Badge>
                    </div>
                    <p className="text-[12px] text-muted-foreground flex items-center gap-1.5">
                        <Building2 className="h-3 w-3" /> Purchased: {report.pharmacyName} · <MapPin className="h-3 w-3" /> {report.location}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-muted-foreground mb-1">{new Date(report.submittedAt).toLocaleDateString()}</p>
                    <p className="text-[11px] font-mono opacity-50">REF: {report.id.toUpperCase()}</p>
                </div>
            </div>

            <div className="bg-black/20 p-3 rounded-xl border border-white/5 mb-4 group-hover:border-primary/20 transition-colors">
                <p className="text-[12px] text-muted-foreground leading-relaxed italic">"{report.description}"</p>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-[10px] font-bold uppercase"
                        onClick={() => onStatusUpdate(report.id, 'investigating')}
                    >
                        Mark Investigating
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-[10px] font-bold uppercase"
                        onClick={() => onStatusUpdate(report.id, 'verified')}
                    >
                        Verify Fraud
                    </Button>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
