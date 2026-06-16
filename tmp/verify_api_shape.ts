import { PrismaClient } from "@prisma/client";
import { BatchService } from "../src/server/services/manufacturer/batch.service";
import { ApiResponse } from "../src/server/utils/api-response";

const prisma = new PrismaClient();

async function main() {
    const batchNumber = "BAT-MQAS7UOD";
    const batchRecord = await prisma.batch.findUnique({
        where: { batchNumber },
        select: { id: true, medicine: { select: { manufacturerId: true } } }
    });

    if (!batchRecord) {
        console.log(`Batch ${batchNumber} not found.`);
        return;
    }

    const userId = "clzw0_MANUFACTURER_USER_ID"; // We need a real user ID or fake it in service
    // Actually, BatchService.getBatchDetails uses userId to find manufacturer.

    const manufacturer = await prisma.manufacturer.findFirst({
        where: { id: batchRecord.medicine.manufacturerId }
    });

    if (!manufacturer) {
        console.log("Manufacturer not found.");
        return;
    }

    const batch = await BatchService.getBatchDetails(manufacturer.userId, batchRecord.id, { allPills: true });
    const response = ApiResponse.success(batch);

    console.log("Full Structure Keys:", Object.keys(response));
    console.log("Data Keys:", Object.keys(response.data));
    console.log("Pills Length:", response.data.pills?.length);
    console.log("Sample Pill:", response.data.pills?.[0]);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
