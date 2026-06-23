import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const medicineCount = await prisma.medicine.count();
    const batchCount = await prisma.batch.count();
    const cartonCount = await prisma.carton.count();
    const boxCount = await prisma.box.count();
    const pillCount = await prisma.pill.count();
    const manufacturers = await prisma.user.findMany({ where: { role: "MANUFACTURER" }, select: { email: true } });
    const pharmacy = await prisma.user.findFirst({ where: { role: "PHARMACY" }, select: { email: true } });
    const regulator = await prisma.user.findFirst({ where: { role: "REGULATOR" }, select: { email: true } });
    console.log({ medicineCount, batchCount, cartonCount, boxCount, pillCount, manufacturers, pharmacy, regulator });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
