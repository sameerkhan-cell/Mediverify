import { PrismaClient } from "@prisma/client";
import { BatchService } from "../src/server/services/manufacturer/batch.service";

const prisma = new PrismaClient();

async function main() {
    const batchId = "cmqas7ur107w8bk58357ohza7";
    const b = await prisma.batch.findUnique({
        where: { id: batchId },
        include: { medicine: { include: { manufacturer: { include: { user: true } } } } }
    });

    if (!b) throw new Error("Batch not found in DB");
    const userId = b.medicine.manufacturer.userId;

    console.log("Using User ID:", userId);

    const batch = await BatchService.getBatchDetails(userId, batchId, { allPills: true }) as any;

    const finalData = {
        ...batch,
        totalCartons: batch._count?.cartons ?? batch.cartons?.length ?? 0,
        totalBoxes: batch._count?.boxes ?? batch.boxes?.length ?? 0,
        totalPills: batch._count?.pills ?? batch.pills?.length ?? batch.totalPillsGenerated ?? 0,
    };

    console.log("Success! Final Data Structure Check:");
    console.log("Total Cartons:", finalData.totalCartons);
    console.log("Total Boxes:", finalData.totalBoxes);
    console.log("Total Pills:", finalData.totalPills);
    console.log("Cartons array length:", batch.cartons?.length);
    console.log("Sample Carton Name:", batch.cartons?.[0]?.cartonNumber);
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
