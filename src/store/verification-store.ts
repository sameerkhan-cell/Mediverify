import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { VerificationResult } from "@/services/verification/verification-service";

export interface ScanHistoryItem {
    id: string;
    code: string;
    timestamp: string;
    result: VerificationResult;
}

interface VerificationState {
    history: ScanHistoryItem[];
    addToHistory: (code: string, result: VerificationResult) => void;
    clearHistory: () => void;
}

/**
 * Verification Store — Patient Scan History
 * Persists the history of medicine verifications performed by the patient.
 */
export const useVerificationStore = create<VerificationState>()(
    persist(
        (set) => ({
            history: [],
            addToHistory: (code, result) => set((state) => ({
                history: [
                    {
                        id: Math.random().toString(36).slice(2, 10).toUpperCase(),
                        code,
                        timestamp: new Date().toISOString(),
                        result
                    },
                    ...state.history
                ]
            })),
            clearHistory: () => set({ history: [] }),
        }),
        {
            name: "mediverify-verification-history",
        }
    )
);
