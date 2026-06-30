import dotenv from "dotenv";
dotenv.config();

import { prisma } from "@/server/db/client";

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: "sameerkhan031181@gmail.com" },
        include: {
            manufacturer: true,
            pharmacy: true
        }
    });
    console.log("User:", JSON.stringify(user, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
