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

    console.log("-----------------------------------------");
    console.log("Pills:", batch.pills.length, "sample qrCode:", batch.pills[0]?.qrCode);
    console.log("Boxes:", batch.boxes.length, "sample qrCode:", batch.boxes[0]?.qrCode);
    console.log("Cartons:", batch.cartons.length, "sample qrCode:", batch.cartons[0]?.qrCode);
    console.log("-----------------------------------------");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
