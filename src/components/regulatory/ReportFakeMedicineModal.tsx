import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertTriangle, ShieldAlert, Upload, MapPin,
    Pill, Send, CheckCircle2, Building, Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegulatoryStore } from "@/store/regulatory-store";

export function ReportFakeMedicineModal({ isOpen, onClose, prefillBatch }: { isOpen: boolean; onClose: () => void; prefillBatch?: string }) {
    const { submitReport } = useRegulatoryStore();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [form, setForm] = useState({
        medicineName: "",
        batchNumber: prefillBatch || "",
        pharmacyName: "",
        location: "",
        description: "",
    });

    const handleSubmit = () => {
        setLoading(true);
        setTimeout(() => {
            submitReport({
                id: Math.random().toString(36).slice(2, 9),
                ...form,
                status: "pending",
                submittedAt: new Date().toISOString(),
            });
            setLoading(false);
            setCompleted(true);
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-background/80 backdrop-blur-xl"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-lg card-premium p-0 overflow-hidden border-destructive/20 shadow-[-20px_20px_60px_rgba(239,68,68,0.1)]"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-gradient-to-r from-destructive/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-[17px] font-black tracking-tight">DRAP Regulatory Report</h3>
                            <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Report Counterfeit Medicine</p>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    {!completed ? (
                        <div className="space-y-6">
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase text-muted-foreground ml-1">Medicine Name</label>
                                    <div className="relative">
                                        <Pill className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            placeholder="e.g. Panadol Extra"
                                            className="pl-9 bg-secondary/30 h-11 text-[13px]"
                                            value={form.medicineName}
                                            onChange={(e) => setForm({ ...form, medicineName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase text-muted-foreground ml-1">Batch Number</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            placeholder="BATCH-ID"
                                            className="pl-9 bg-secondary/30 h-11 text-[13px] font-mono"
                                            value={form.batchNumber}
                                            onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase text-muted-foreground ml-1">Pharmacy / Source</label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder="Name of store where purchased"
                                        className="pl-9 bg-secondary/30 h-11 text-[13px]"
                                        value={form.pharmacyName}
                                        onChange={(e) => setForm({ ...form, pharmacyName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase text-muted-foreground ml-1">Purchased Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder="City, Area"
                                        className="pl-9 bg-secondary/30 h-11 text-[13px]"
                                        value={form.location}
                                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase text-muted-foreground ml-1">Observation / Evidence</label>
                                <textarea
                                    className="w-full bg-secondary/30 border border-input rounded-md p-3 text-[13px] min-h-[100px] focus:outline-none focus:ring-1 focus:ring-primary"
                                    placeholder="Describe why you think this medicine is fake (packaging, taste, color, or verification error)..."
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-4">
                                <Button variant="ghost" onClick={onClose} className="flex-1 rounded-full text-[13px] font-bold uppercase tracking-widest h-12">Cancel</Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 text-[13px] font-bold uppercase tracking-widest h-12 gap-2 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                                >
                                    {loading ? "PROCESING..." : <><Send className="h-4 w-4" /> SUBMIT REPORT</>}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center text-center">
                            <div className="h-20 w-20 rounded-full bg-success/10 border border-success/20 grid place-items-center mb-6">
                                <CheckCircle2 className="h-10 w-10 text-success" />
                            </div>
                            <h4 className="text-xl font-bold mb-2">Report Filed Successfully</h4>
                            <p className="text-[13px] text-muted-foreground max-w-xs leading-relaxed">
                                Your report has been submitted to DRAP and is now being analyzed by our AI fraud network.
                            </p>
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="mt-8 rounded-full px-8 text-[12px] font-black uppercase tracking-widest"
                            >
                                Close Dashboard
                            </Button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
