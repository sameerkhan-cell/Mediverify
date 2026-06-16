import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const batchNumber = "BAT-MQAS7UOD";
    const batch = await prisma.batch.findUnique({
        where: { batchNumber },
        include: { pills: true, boxes: true, cartons: true }
    });

    if (!batch) {
        console.log(`Batch ${batchNumber} not found.`);
        return;
    }

    console.log(JSON.stringify({
        status: batch.status,
        medicineStatus: batch.medicineStatus,
        blockchainStatus: batch.blockchainStatus,
        txHash: batch.txHash,
        pillsCount: batch.pills.length,
        boxesCount: batch.boxes.length,
        cartonsCount: batch.cartons.length
    }, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
