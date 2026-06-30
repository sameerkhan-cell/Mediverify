import { useState, useCallback, useRef } from "react";
import type { BatchRegistrationForm, DualQRResult, GenerationProgress, GenerationPhase } from "@/types/dual-qr";
import { generateDualQR } from "@/services/qr/qr-generator";

interface UseBatchGenerationReturn {
    progress: GenerationProgress;
    result: DualQRResult | null;
    error: string | null;
    isGenerating: boolean;
    generate: (form: BatchRegistrationForm) => Promise<boolean>;
    reset: () => void;
}

const PHASE_MESSAGES: Record<GenerationPhase, string> = {
    idle: "Ready to generate",
    registering: "Registering batch on blockchain…",
    "generating-box-qr": "Generating Box QR code…",
    "generating-pill-qrs": "Generating individual pill QR codes…",
    complete: "Generation complete!",
    error: "Generation failed",
};

const INITIAL_PROGRESS: GenerationProgress = {
    phase: "idle",
    pillsGenerated: 0,
    totalPills: 0,
    percentage: 0,
    currentMessage: PHASE_MESSAGES["idle"],
};

export function useBatchGeneration(): UseBatchGenerationReturn {
    const [progress, setProgress] = useState<GenerationProgress>(INITIAL_PROGRESS);
    const [result, setResult] = useState<DualQRResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef(false);

    const setPhase = (phase: GenerationPhase, pills = 0, total = 0) => {
        const percentage =
            phase === "registering" ? 8
                : phase === "generating-box-qr" ? 20
                    : phase === "generating-pill-qrs" && total > 0
                        ? Math.round(20 + (pills / total) * 75)
                        : phase === "complete" ? 100
                            : 0;

        setProgress({
            phase,
            pillsGenerated: pills,
            totalPills: total,
            percentage,
            currentMessage:
                phase === "generating-pill-qrs" && total > 0
                    ? `Generating pill QRs… ${pills.toLocaleString()} / ${total.toLocaleString()}`
                    : PHASE_MESSAGES[phase],
        });
    };

    const generate = useCallback(async (form: BatchRegistrationForm) => {
        const { batches, registerNewBatch } = (await import("@/store/qr-store")).useQRStore.getState();

        // 0. Check for duplicates (ONLY if not extending)
        if (!form.isExtension && form.batchNumber && batches.some(b => b.batchNumber === form.batchNumber)) {
            setError("This batch code is already registered");
            return false;
        }

        abortRef.current = false;
        setError(null);
        setResult(null);

        try {
            // Phase 1 — Server-side registration (Prisma + MySQL)
            setPhase("registering");
            const token = (() => {
                try {
                    const session = localStorage.getItem("mediverify_session") || sessionStorage.getItem("mediverify_session");
                    return session ? JSON.parse(session).token : "";
                } catch { return ""; }
            })();
            console.log(`[DEBUG] Attempting batch registration with token: ${token ? "YES" : "NO"}`);

            const response = await fetch("/api/manufacturer/register-batch", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    medicineName: form.medicineName,
                    batchNumber: form.batchNumber,
                    manufacturingDate: form.manufacturingDate ? new Date(form.manufacturingDate).toISOString() : new Date().toISOString(),
                    expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    quantityBoxes: form.quantityBoxes,
                    pillsPerBox: form.pillsPerBox ?? form.totalPillsPerBox,
                    totalCartons: form.totalCartons,
                    category: form.productCategory,
                    allowsExtension: form.isExtension,
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to register batch on server.");
            }

            const { batch: serverBatch, startPillIndex } = data.data;

            // Phase 2 — local box QR generation
            setPhase("generating-box-qr");
            await new Promise((r) => setTimeout(r, 400));
            if (abortRef.current) return false;

            // Phase 3 — pill QR generation (chunked with progress)
            const quantityToGenerate = form.quantityBoxes * form.totalPillsPerBox;
            setPhase("generating-pill-qrs", 0, quantityToGenerate);

            const generated = await generateDualQR(form, {
                onProgress: (done, total) => {
                    if (!abortRef.current) setPhase("generating-pill-qrs", done, total);
                },
                chunkDelay: quantityToGenerate > 500 ? 5 : 15,
                startNumber: startPillIndex,
            });

            if (abortRef.current) return false;

            // Merge server data with generated QRs
            const finalResult: DualQRResult = {
                ...generated,
                batch: {
                    ...generated.batch,
                    ...serverBatch, // Overwrite with server-enriched data (IDs, txHash, cartons, boxes, etc.)
                    txHash: serverBatch.txHash || "PENDING_ANCHOR",
                }
            };

            // Phase 4 — complete
            setPhase("complete", quantityToGenerate, quantityToGenerate);
            setResult(finalResult);

            // Persist to store
            try {
                registerNewBatch(finalResult);
            } catch (e) {
                console.error("Failed to persist batch:", e);
            }

            return true;
        } catch (err) {
            setPhase("error");
            setError(err instanceof Error ? err.message : "Unknown error occurred");
            return false;
        }
    }, []);

    const reset = useCallback(() => {
        abortRef.current = true;
        setProgress(INITIAL_PROGRESS);
        setResult(null);
        setError(null);
    }, []);

    return {
        progress,
        result,
        error,
        isGenerating: progress.phase !== "idle" && progress.phase !== "complete" && progress.phase !== "error",
        generate,
        reset,
    };
}
