import dotenv from "dotenv";
dotenv.config();

import { AuthService } from "@/server/services/auth.service";

async function main() {
    try {
        console.log("Attempting to register a patient...");
        const result = await AuthService.register({
            email: "test-patient-random123@example.com",
            password: "Password123!",
            fullName: "Test Patient",
            role: "CUSTOMER"
        });
        console.log("Success:", result);
    } catch (error: any) {
        console.error("Error occurred:");
        console.error(error);
        if (error.stack) {
            console.error(error.stack);
        }
    }
}

main();
