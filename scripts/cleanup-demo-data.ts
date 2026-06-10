import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Cleaning up demo data...");

    const tables = [
        "ExportAnalytics",
        "QRAsset",
        "Pill",
        "Batch",
        "Medicine",
        "VerificationLog",
        "AuditLog",
        "DocumentAuditLog",
        "ManufacturerDocument",
        "FraudAlert",
        "GeoAnalytics",
        "RiskScore",
        "Recall",
        "AdminActionLog",
        "SurveillanceEvent",
        "Report",
        "AIInsight",
        "LiveEvent",
        "RiskForecast",
        "Notification",
        "BlockchainTransaction",
        "QRDownload"
    ];

    try {
        // MySQL specific: Disable foreign key checks for thorough cleanup
        process.stdout.write("Disabling foreign key checks... ");
        await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0;");
        console.log("Done.");

        for (const table of tables) {
            process.stdout.write(`Clearing ${table}... `);
            try {
                await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\`;`);
                console.log("Done.");
            } catch (err: any) {
                // Fallback to deleteMany if truncate fails (e.g. if table name is different or missing)
                try {
                    // @ts-ignore
                    await prisma[table.charAt(0).toLowerCase() + table.slice(1)].deleteMany();
                    console.log("Done (via deleteMany).");
                } catch (e) {
                    console.log(`Skipped (${err.message}).`);
                }
            }
        }

        process.stdout.write("Enabling foreign key checks... ");
        await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1;");
        console.log("Done.");

        console.log("\nDemo data cleanup completed successfully.");
    } catch (error) {
        console.error("Cleanup failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
