import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash("Password123!", 12);

    // 1. Create Manufacturer
    const manufacturer = await prisma.user.upsert({
        where: { email: "manufacturer@mediverify.com" },
        update: {},
        create: {
            email: "manufacturer@mediverify.com",
            passwordHash,
            name: "Global Pharma Services",
            role: "MANUFACTURER",
            manufacturer: {
                create: {
                    companyName: "Global Pharma Services",
                    licenseNumber: "MFG-2024-XPQ-99",
                    address: "Healthcare City, Phase 1",
                },
            },
        },
    });

    // 2. Create Patient
    await prisma.user.upsert({
        where: { email: "patient@mediverify.com" },
        update: {},
        create: {
            email: "patient@mediverify.com",
            passwordHash,
            name: "John Doe",
            role: "PATIENT",
        },
    });

    console.log("Seed data created successfully!");
    console.log("Manufacturer: manufacturer@mediverify.com / Password123!");
    console.log("Patient: patient@mediverify.com / Password123!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
