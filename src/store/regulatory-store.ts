import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface MedicineRecall {
    id: string;
    batchNumber: string;
    medicineName: string;
    reason: string;
    severity: "urgent" | "standard";
    dateInitiated: string;
    status: "active" | "resolved";
}

export interface FakeMedicineReport {
    id: string;
    medicineName: string;
    batchNumber?: string;
    pharmacyName: string;
    location: string;
    description: string;
    evidenceUrl?: string;
    status: "pending" | "investigating" | "verified" | "dismissed";
    submittedAt: string;
}

export interface BlacklistedPharmacy {
    id: string;
    name: string;
    licenseNumber: string;
    location: string;
    riskScore: number;
    violations: string[];
    status: "blacklisted" | "under_probation";
}

interface RegulatoryState {
    recalls: MedicineRecall[];
    reports: FakeMedicineReport[];
    blacklistedPharmacies: BlacklistedPharmacy[];

    // Actions
    addRecall: (recall: MedicineRecall) => void;
    submitReport: (report: FakeMedicineReport) => void;
    updateReportStatus: (id: string, status: FakeMedicineReport["status"]) => void;
    blacklistPharmacy: (pharmacy: BlacklistedPharmacy) => void;
}

export const useRegulatoryStore = create<RegulatoryState>()(
    persist(
        (set) => ({
            recalls: [
                {
                    id: "R1",
                    batchNumber: "AUG-77821-C",
                    medicineName: "Augmentin 625mg",
                    reason: "Potency variance detection in Punjab region.",
                    severity: "urgent",
                    dateInitiated: new Date().toISOString(),
                    status: "active"
                }
            ],
            reports: [],
            blacklistedPharmacies: [
                {
                    id: "P1",
                    name: "Ali Healthcare & Medicos",
                    licenseNumber: "DRAP-PK-9210",
                    location: "Lahore, Johar Town",
                    riskScore: 98,
                    violations: ["Distribution of expired antibiotics", "Counterfeit labels found"],
                    status: "blacklisted"
                }
            ],

            addRecall: (recall) => set((state) => ({
                recalls: [recall, ...state.recalls]
            })),

            submitReport: (report) => set((state) => ({
                reports: [report, ...state.reports]
            })),

            updateReportStatus: (id, status) => set((state) => ({
                reports: state.reports.map((r) => r.id === id ? { ...r, status } : r)
            })),

            blacklistPharmacy: (pharmacy) => set((state) => ({
                blacklistedPharmacies: [pharmacy, ...state.blacklistedPharmacies]
            })),
        }),
        {
            name: "mediverify-regulatory-ledger",
        }
    )
);
