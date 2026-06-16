import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const id = "cmqas7ur107w8bk58357ohza7";
    try {
        console.log("Starting query for batch:", id);
        const batch = await prisma.batch.findFirst({
            where: { id },
            include: {
                medicine: { include: { manufacturer: true } },
                pills: { take: 50 },
                boxes: { take: 1 },
                cartons: { take: 1 },
                _count: {
                    select: {
                        pills: true,
                        boxes: true,
                        cartons: true
                    }
                },
            },
        });
        console.log("Query success!");
        console.log("Counts:", JSON.stringify(batch?._count, null, 2));
    } catch (err: any) {
        console.error("Query failed with error:");
        console.error(err.message);
        if (err.stack) console.error(err.stack);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
