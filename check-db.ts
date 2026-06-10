import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const medicines = await prisma.medicine.findMany({
        include: { manufacturer: true }
    });
    console.log(JSON.stringify(medicines, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
