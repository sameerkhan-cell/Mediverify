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

    // ─── STEP 1: Four additional manufacturer users ───────────────────────────

    const gskUser = await prisma.user.upsert({
        where: { email: "gsk@mediverify.com" },
        update: {},
        create: {
            email: "gsk@mediverify.com",
            passwordHash,
            name: "GSK Pakistan",
            role: "MANUFACTURER",
            manufacturer: {
                create: {
                    companyName: "GSK Pakistan",
                    licenseNumber: "DRAP-GSK-2024-001",
                    address: "Karachi, Pakistan",
                },
            },
        },
        include: { manufacturer: true },
    });

    const abbottUser = await prisma.user.upsert({
        where: { email: "abbott@mediverify.com" },
        update: {},
        create: {
            email: "abbott@mediverify.com",
            passwordHash,
            name: "Abbott Laboratories",
            role: "MANUFACTURER",
            manufacturer: {
                create: {
                    companyName: "Abbott Laboratories",
                    licenseNumber: "DRAP-ABT-2024-002",
                    address: "Lahore, Pakistan",
                },
            },
        },
        include: { manufacturer: true },
    });

    const sanofiUser = await prisma.user.upsert({
        where: { email: "sanofi@mediverify.com" },
        update: {},
        create: {
            email: "sanofi@mediverify.com",
            passwordHash,
            name: "Sanofi Pakistan",
            role: "MANUFACTURER",
            manufacturer: {
                create: {
                    companyName: "Sanofi Pakistan",
                    licenseNumber: "DRAP-SNF-2024-003",
                    address: "Islamabad, Pakistan",
                },
            },
        },
        include: { manufacturer: true },
    });

    const highnoonUser = await prisma.user.upsert({
        where: { email: "highnoon@mediverify.com" },
        update: {},
        create: {
            email: "highnoon@mediverify.com",
            passwordHash,
            name: "Highnoon Laboratories",
            role: "MANUFACTURER",
            manufacturer: {
                create: {
                    companyName: "Highnoon Laboratories",
                    licenseNumber: "DRAP-HNL-2024-004",
                    address: "Lahore, Pakistan",
                },
            },
        },
        include: { manufacturer: true },
    });

    // Fetch manufacturer profiles (handle both first-run and re-run cases)
    const gskMfg = gskUser.manufacturer
        ?? await prisma.manufacturer.findUnique({ where: { userId: gskUser.id } });
    const abbottMfg = abbottUser.manufacturer
        ?? await prisma.manufacturer.findUnique({ where: { userId: abbottUser.id } });
    const sanofiMfg = sanofiUser.manufacturer
        ?? await prisma.manufacturer.findUnique({ where: { userId: sanofiUser.id } });
    const highnoonMfg = highnoonUser.manufacturer
        ?? await prisma.manufacturer.findUnique({ where: { userId: highnoonUser.id } });

    if (!gskMfg || !abbottMfg || !sanofiMfg || !highnoonMfg) {
        throw new Error("Manufacturer profile missing — check upsert include.");
    }

    // ─── STEP 2: Medicines (findFirst+create for idempotency) ─────────────────

    const createMedicine = async (name: string, manufacturerId: string, category: string) => {
        const existing = await prisma.medicine.findFirst({ where: { name, manufacturerId } });
        return existing ?? await prisma.medicine.create({ data: { name, manufacturerId, category } });
    };

    const panadol = await createMedicine("Panadol Extra 500mg Tablet", gskMfg.id, "Analgesic");
    const augmentin = await createMedicine("Augmentin 625mg Tablet", gskMfg.id, "Antibiotic");
    const brufen = await createMedicine("Brufen 400mg Tablet", abbottMfg.id, "Anti-inflammatory");
    const glucophage = await createMedicine("Glucophage 500mg Tablet", abbottMfg.id, "Antidiabetic");
    const amaryl = await createMedicine("Amaryl 2mg Tablet", sanofiMfg.id, "Antidiabetic");
    const clexane = await createMedicine("Clexane 40mg Injection", sanofiMfg.id, "Anticoagulant");
    const risek = await createMedicine("Risek 20mg Capsule", highnoonMfg.id, "Antacid");
    const zithromax = await createMedicine("Zithromax 250mg Tablet", highnoonMfg.id, "Antibiotic");

    // ─── STEP 3: 3 Batches per medicine ───────────────────────────────────────

    type BatchSeed = {
        medicine: { id: string };
        prefix: string;
        pillsPerBox: number;
    };

    const batchSeeds: BatchSeed[] = [
        { medicine: panadol, prefix: "PND", pillsPerBox: 20 },
        { medicine: augmentin, prefix: "AUG", pillsPerBox: 20 },
        { medicine: brufen, prefix: "BRF", pillsPerBox: 20 },
        { medicine: glucophage, prefix: "GLC", pillsPerBox: 20 },
        { medicine: amaryl, prefix: "AMR", pillsPerBox: 20 },
        { medicine: clexane, prefix: "CLX", pillsPerBox: 1 },
        { medicine: risek, prefix: "RSK", pillsPerBox: 20 },
        { medicine: zithromax, prefix: "ZTH", pillsPerBox: 20 },
    ];

    const quantityBoxes = 500;

    for (const { medicine: med, prefix, pillsPerBox } of batchSeeds) {
        // Batch 1 — 2023
        const bn1 = `${prefix}-2023-001`;
        await prisma.batch.upsert({
            where: { batchNumber: bn1 },
            update: {},
            create: {
                batchNumber: bn1,
                medicineId: med.id,
                manufacturingDate: new Date("2023-01-15"),
                expiryDate: new Date("2025-06-01"),
                quantityBoxes,
                pillsPerBox,
                totalPillsGenerated: pillsPerBox * quantityBoxes,
                status: "ACTIVE",
                medicineStatus: "MANUFACTURED",
                blockchainStatus: "CONFIRMED",
            },
        });

        // Batch 2 — 2024
        const bn2 = `${prefix}-2024-001`;
        await prisma.batch.upsert({
            where: { batchNumber: bn2 },
            update: {},
            create: {
                batchNumber: bn2,
                medicineId: med.id,
                manufacturingDate: new Date("2024-01-15"),
                expiryDate: new Date("2026-06-01"),
                quantityBoxes,
                pillsPerBox,
                totalPillsGenerated: pillsPerBox * quantityBoxes,
                status: "ACTIVE",
                medicineStatus: "MANUFACTURED",
                blockchainStatus: "CONFIRMED",
            },
        });

        // Batch 3 — Fake detection demo (9999 out-of-sequence)
        const bn3 = `${prefix}-2024-9999`;
        await prisma.batch.upsert({
            where: { batchNumber: bn3 },
            update: {},
            create: {
                batchNumber: bn3,
                medicineId: med.id,
                manufacturingDate: new Date("2024-01-15"),
                expiryDate: new Date("2026-12-01"),
                quantityBoxes,
                pillsPerBox,
                totalPillsGenerated: pillsPerBox * quantityBoxes,
                status: "ACTIVE",
                medicineStatus: "MANUFACTURED",
                blockchainStatus: "CONFIRMED",
            },
        });
    }

    // ─── STEP 4: Pharmacy user + Regulator user ────────────────────────────────

    await prisma.user.upsert({
        where: { email: "pharmacy@mediverify.com" },
        update: {},
        create: {
            email: "pharmacy@mediverify.com",
            passwordHash,
            name: "Al-Shifa Pharmacy",
            role: "PHARMACY",
            pharmacy: {
                create: {
                    name: "Al-Shifa Pharmacy",
                    licenseNumber: "PH-KHI-2024-001",
                    location: "Saddar, Karachi",
                },
            },
        },
    });

    await prisma.user.upsert({
        where: { email: "regulator@mediverify.com" },
        update: {},
        create: {
            email: "regulator@mediverify.com",
            passwordHash,
            name: "DRAP Regulator",
            role: "REGULATOR",
        },
    });

    // ─── STEP 5: Summary logs ─────────────────────────────────────────────────

    console.log("\n✅ Seed data created successfully!\n");
    console.log("─── Existing Accounts ───────────────────────────────────");
    console.log("Manufacturer (Global Pharma): manufacturer@mediverify.com / Password123!");
    console.log("Patient (John Doe):           patient@mediverify.com      / Password123!");
    console.log("\n─── New Manufacturer Accounts ───────────────────────────");
    console.log("GSK Pakistan:          gsk@mediverify.com      / Password123!");
    console.log("Abbott Laboratories:   abbott@mediverify.com   / Password123!");
    console.log("Sanofi Pakistan:       sanofi@mediverify.com   / Password123!");
    console.log("Highnoon Laboratories: highnoon@mediverify.com / Password123!");
    console.log("\n─── Other Accounts ──────────────────────────────────────");
    console.log("Pharmacy (Al-Shifa):   pharmacy@mediverify.com  / Password123!");
    console.log("Regulator (DRAP):      regulator@mediverify.com / Password123!");
    console.log("\n─── Medicines & Batches ─────────────────────────────────");
    console.log("8 medicines seeded with 3 batches each (24 batches total).");
    console.log("Batch suffix -9999 on each medicine is the fake-detection demo batch.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
