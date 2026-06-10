import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FraudAlert, RiskScores } from "@/services/fraud/fraud-engine";

interface FraudState {
    alerts: FraudAlert[];
    globalScores: RiskScores;

    // Actions
    addAlert: (alert: FraudAlert) => void;
    updateScores: (scores: Partial<RiskScores>) => void;
    clearAlerts: () => void;
}

/**
 * Fraud Store — Persistent Intelligence State
 * Tracks suspicious activities and AI risk ratings.
 */
export const useFraudStore = create<FraudState>()(
    persist(
        (set) => ({
            alerts: [
                {
                    id: "A1",
                    type: "spike_detected",
                    severity: "medium",
                    message: "Unusual verification density in Karachi Central.",
                    targetId: "PNX-990-A",
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    location: "Karachi"
                },
                {
                    id: "A2",
                    type: "pharmacy_risk",
                    severity: "high",
                    message: "Pharmacy Trust Score dropped below threshold: HealthFirst Medicos.",
                    targetId: "Ph-721",
                    timestamp: new Date(Date.now() - 7200000).toISOString(),
                    location: "Lahore"
                }
            ],
            globalScores: {
                medicineRisk: 12,
                pharmacyTrust: 94,
                batchSafety: 98,
                regionThreat: 5
            },

            addAlert: (alert) => set((state) => ({
                alerts: [alert, ...state.alerts].slice(0, 50)
            })),

            updateScores: (newScores) => set((state) => ({
                globalScores: { ...state.globalScores, ...newScores }
            })),

            clearAlerts: () => set({ alerts: [] }),
        }),
        {
            name: "mediverify-fraud-intelligence",
        }
    )
);
