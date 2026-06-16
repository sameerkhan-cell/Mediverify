import { PrismaClient } from "@prisma/client";
import { BatchService } from "../src/server/services/manufacturer/batch.service";

const prisma = new PrismaClient();

async function main() {
    // We need a real user ID. Let's find a manufacturer.
    const manufacturer = await prisma.manufacturer.findFirst({
        include: { user: true }
    });

    if (!manufacturer) {
        console.log("No manufacturer found in DB.");
        return;
    }

    const userId = manufacturer.userId;
    console.log("Testing CSV export logic for userId:", userId);

    try {
        const batches = await BatchService.getManufacturerBatches(userId);
        console.log(`Found ${batches.length} batches.`);

        if (batches.length > 0) {
            console.log("Mapping first batch to CSV row...");
            const b = batches[0];
            const row = `${b.batchNumber},"${b.medicine.name}",${b.totalPillsGenerated},${b.status},${b.createdAt.toISOString().split('T')[0]},${b.expiryDate.toISOString().split('T')[0]}`;
            console.log("Row output:", row);
        }

        console.log("Testing full map...");
        const csvRows = batches.map(b =>
            `${b.batchNumber},"${b.medicine.name}",${b.totalPillsGenerated},${b.status},${b.createdAt.toISOString().split('T')[0]},${b.expiryDate.toISOString().split('T')[0]}`
        ).join("\n");
        console.log("CSV Generation Success!");
    } catch (err: any) {
        console.error("CSV Generation FAILED during map:");
        console.error(err.message);
        console.error(err.stack);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
