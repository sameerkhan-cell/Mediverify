import { VerificationService } from "./verification-service";

export interface SMSResponse {
    status: "Genuine" | "Fake" | "Suspicious" | "Expired" | "Error";
    medicineName?: string;
    message: string;
}

export class SMSSimulator {
    /**
     * Simulate an incoming SMS command
     * Command format: VERIFY {CODE}
     */
    static async processCommand(command: string): Promise<SMSResponse> {
        const parts = command.trim().split(/\s+/);

        if (parts.length < 2 || parts[0].toUpperCase() !== "VERIFY") {
            return {
                status: "Error",
                message: "Invalid command. Use: VERIFY {CODE}"
            };
        }

        const code = parts[1].toUpperCase();

        try {
            const result = await VerificationService.verifyCode(code);

            if (result.status === "genuine") {
                return {
                    status: "Genuine",
                    medicineName: result.batchDetails?.name || result.pillDetails?.pillNumber,
                    message: `GENUINE: ${result.batchDetails?.name || 'Pill #' + result.pillDetails?.pillNumber} verified. Exp: ${result.batchDetails?.expiry || 'N/A'}. DRAP Approved.`
                };
            } else if (result.status === "duplicate") {
                return {
                    status: "Suspicious",
                    message: "SUSPICIOUS: Duplicate scan detected for this code. Report to DRAP via 0800-MEDICINE."
                };
            } else {
                return {
                    status: "Fake",
                    message: "FAKE: This code is not found in our blockchain ledger. DO NOT USE. Report to DRAP."
                };
            }
        } catch (error) {
            return {
                status: "Error",
                message: "System busy. Please try again or call our hotline."
            };
        }
    }
}
