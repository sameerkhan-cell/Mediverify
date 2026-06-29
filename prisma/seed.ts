import { PrismaClient, Role, VerificationStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash("Password123!", 12);

    console.log("🚀 Starting fresh seed rebuild...");

    // ─── STEP 1: Manufacturers ──────────────────────────────────────────────────
    const manufacturersData = [
        { email: "gsk@mediverify.com", companyName: "GSK Pakistan", licenseNumber: "DRAP-GSK-2024-001", address: "Karachi, Pakistan" },
        { email: "abbott@mediverify.com", companyName: "Abbott Laboratories", licenseNumber: "DRAP-ABT-2024-002", address: "Landhi, Karachi" },
        { email: "sanofi@mediverify.com", companyName: "Sanofi Pakistan", licenseNumber: "DRAP-SNF-2024-003", address: "Korangi, Karachi" },
        { email: "highnoon@mediverify.com", companyName: "Highnoon Laboratories", licenseNumber: "DRAP-HNL-2024-004", address: "Lahore, Pakistan" },
    ];

    const manufacturers: any = {};

    for (const m of manufacturersData) {
        const user = await prisma.user.upsert({
            where: { email: m.email },
            update: {
                role: Role.MANUFACTURER,
                name: m.companyName,
            },
            create: {
                email: m.email,
                passwordHash,
                name: m.companyName,
                role: Role.MANUFACTURER,
                manufacturer: {
                    create: {
                        companyName: m.companyName,
                        licenseNumber: m.licenseNumber,
                        address: m.address,
                    },
                },
            },
            include: { manufacturer: true },
        });

        // If user existed but manufacturer didn't (edge case), create it
        if (!user.manufacturer) {
            user.manufacturer = await prisma.manufacturer.create({
                data: {
                    userId: user.id,
                    companyName: m.companyName,
                    licenseNumber: m.licenseNumber,
                    address: m.address,
                }
            }) as any;
        }

        manufacturers[m.email] = user.manufacturer;
    }

    // ─── STEP 2: Medicines ──────────────────────────────────────────────────────
    const medicinesData = [
        { manufacturerEmail: "gsk@mediverify.com", name: "Panadol Extra 500mg Tablet", category: "Analgesic", prefix: "PND" },
        { manufacturerEmail: "gsk@mediverify.com", name: "Augmentin 625mg Tablet", category: "Antibiotic", prefix: "AUG" },
        { manufacturerEmail: "abbott@mediverify.com", name: "Brufen 400mg Tablet", category: "Anti-inflammatory", prefix: "BRF" },
        { manufacturerEmail: "abbott@mediverify.com", name: "Glucophage 500mg Tablet", category: "Antidiabetic", prefix: "GLC" },
        { manufacturerEmail: "sanofi@mediverify.com", name: "Amaryl 2mg Tablet", category: "Antidiabetic", prefix: "AMR" },
        { manufacturerEmail: "sanofi@mediverify.com", name: "Clexane 40mg Injection", category: "Anticoagulant", prefix: "CLX" },
        { manufacturerEmail: "highnoon@mediverify.com", name: "Risek 20mg Capsule", category: "Antacid", prefix: "RSK" },
        { manufacturerEmail: "highnoon@mediverify.com", name: "Zithromax 250mg Tablet", category: "Antibiotic", prefix: "ZTH" },
    ];

    const medicines: any[] = [];

    for (const m of medicinesData) {
        const manufacturer = manufacturers[m.manufacturerEmail];
        let medicine = await prisma.medicine.findFirst({
            where: { name: m.name, manufacturerId: manufacturer.id }
        });

        if (!medicine) {
            medicine = await prisma.medicine.create({
                data: {
                    name: m.name,
                    category: m.category,
                    manufacturerId: manufacturer.id,
                }
            });
        }
        medicines.push({ ...medicine, prefix: m.prefix });
    }

    // ─── STEP 3 & 4: Batches + Hierarchy ────────────────────────────────────────
    for (const med of medicines) {
        const batchDefinitions = [
            {
                batchNumber: `${med.prefix}-2023-001`,
                manufacturingDate: new Date("2023-01-15"),
                expiryDate: new Date("2025-06-01")
            },
            {
                batchNumber: `${med.prefix}-2024-001`,
                manufacturingDate: new Date("2024-01-15"),
                expiryDate: new Date("2026-06-01")
            },
            {
                batchNumber: `${med.prefix}-2024-9999`,
                manufacturingDate: new Date("2024-01-15"),
                expiryDate: new Date("2026-12-01")
            },
        ];

        for (const def of batchDefinitions) {
            const pillsPerBox = med.name.includes("Clexane") ? 1 : 20;
            const quantityBoxes = 10;
            const boxesPerCarton = 5;
            const totalPills = quantityBoxes * pillsPerBox;

            const batch = await prisma.batch.upsert({
                where: { batchNumber: def.batchNumber },
                update: {
                    medicineId: med.id,
                    manufacturingDate: def.manufacturingDate,
                    expiryDate: def.expiryDate,
                    quantityBoxes,
                    pillsPerBox,
                    boxesPerCarton,
                    totalPillsGenerated: totalPills,
                    status: "ACTIVE",
                    medicineStatus: "MANUFACTURED",
                    blockchainStatus: "CONFIRMED",
                },
                create: {
                    batchNumber: def.batchNumber,
                    medicineId: med.id,
                    manufacturingDate: def.manufacturingDate,
                    expiryDate: def.expiryDate,
                    quantityBoxes,
                    pillsPerBox,
                    boxesPerCarton,
                    totalPillsGenerated: totalPills,
                    status: "ACTIVE",
                    medicineStatus: "MANUFACTURED",
                    blockchainStatus: "CONFIRMED",
                },
            });

            // STEP 4: Full Hierarchy for PND-2024-001
            if (def.batchNumber === "PND-2024-001") {
                console.log("📦 Creating full hierarchy for PND-2024-001...");

                // Clear old hierarchy for this batch to avoid duplicates on re-run
                await prisma.pill.deleteMany({ where: { batchId: batch.id } });
                await prisma.box.deleteMany({ where: { batchId: batch.id } });
                await prisma.carton.deleteMany({ where: { batchId: batch.id } });

                const numCartons = 2; // 10 boxes / 5 per carton
                let globalPillIndex = 1;

                for (let c = 1; c <= numCartons; c++) {
                    const cartonNum = `00${c}`;
                    const carton = await prisma.carton.create({
                        data: {
                            batchId: batch.id,
                            cartonNumber: `CARTON-PND-2024-001-${cartonNum}-GSK`,
                            qrCode: `CARTON-PND-2024-001-${cartonNum}-GSK`,
                            boxesCount: boxesPerCarton,
                            status: "ACTIVE",
                        }
                    });

                    for (let b = 1; b <= boxesPerCarton; b++) {
                        const absoluteBoxIdx = (c - 1) * boxesPerCarton + b;
                        const boxNum = absoluteBoxIdx.toString().padStart(4, "0");
                        const box = await prisma.box.create({
                            data: {
                                batchId: batch.id,
                                cartonId: carton.id,
                                boxNumber: `BOX-PND-2024-001-${boxNum}-GSK`,
                                qrCode: `BOX-PND-2024-001-${boxNum}-GSK`,
                                pillsCount: pillsPerBox,
                                status: "ACTIVE",
                            }
                        });

                        const pills = [];
                        for (let p = 1; p <= pillsPerBox; p++) {
                            const pillIdx = globalPillIndex.toString().padStart(4, "0");
                            pills.push({
                                batchId: batch.id,
                                boxId: box.id,
                                pillNumber: pillIdx,
                                serialNumber: `SN-PND-2024-001-${pillIdx}`,
                                qrCode: `PILL-PND-2024-001-${pillIdx}-GSK`,
                                status: "ACTIVE",
                                verificationStatus: "UNVERIFIED",
                                qrScanned: false,
                            });
                            globalPillIndex++;
                        }
                        await prisma.pill.createMany({ data: pills });
                    }
                }
            }
        }
    }

    // ─── STEP 5-7: Other Users ──────────────────────────────────────────────────

    // Pharmacy
    await prisma.user.upsert({
        where: { email: "pharmacy@mediverify.com" },
        update: { role: Role.PHARMACY },
        create: {
            email: "pharmacy@mediverify.com",
            passwordHash,
            name: "Al-Shifa Pharmacy",
            role: Role.PHARMACY,
            pharmacy: {
                create: {
                    name: "Al-Shifa Pharmacy",
                    licenseNumber: "PH-KHI-2024-001",
                    location: "Saddar, Karachi",
                },
            },
        },
    });

    // Regulator
    await prisma.user.upsert({
        where: { email: "regulator@mediverify.com" },
        update: { role: Role.REGULATOR },
        create: {
            email: "regulator@mediverify.com",
            passwordHash,
            name: "DRAP Official",
            role: Role.REGULATOR,
        },
    });

    // Patient
    await prisma.user.upsert({
        where: { email: "patient@mediverify.com" },
        update: { role: Role.PATIENT },
        create: {
            email: "patient@mediverify.com",
            passwordHash,
            name: "Test Patient",
            role: Role.PATIENT,
        },
    });

    // ─── STEP 8: Summary ────────────────────────────────────────────────────────
    const counts = {
        medicines: await prisma.medicine.count(),
        batches: await prisma.batch.count(),
        cartons: await prisma.carton.count(),
        boxes: await prisma.box.count(),
        pills: await prisma.pill.count(),
    };

    console.log("\n✨ NESTED HIERARCHY SEEDED!");
    console.table(counts);

    console.log("\n🔑 ACCESS ACCOUNTS (Password: Password123!)");
    console.log("GSK Pakistan:          gsk@mediverify.com");
    console.log("Abbott Labs:           abbott@mediverify.com");
    console.log("Sanofi Pakistan:       sanofi@mediverify.com");
    console.log("Highnoon Labs:         highnoon@mediverify.com");
    console.log("Pharmacy (Al-Shifa):   pharmacy@mediverify.com");
    console.log("Regulator (DRAP):      regulator@mediverify.com");
    console.log("Patient:               patient@mediverify.com");

    // ─── DRAP Admin account ─────────────────────────────────────────────────────
    await prisma.user.upsert({
        where: { email: "admin@mediverify.com" },
        update: {},
        create: {
            email: "admin@mediverify.com",
            name: "DRAP Admin",
            passwordHash,
            role: "ADMIN",
        }
    });

    console.log("Admin account: admin@mediverify.com / Password123!");

    console.log("\n🎯 DEMO BATCH FOR TESTING: PND-2024-001");
    console.log("Sample Carton QR:  CARTON-PND-2024-001-001-GSK");
    console.log("Sample Box QR:     BOX-PND-2024-001-0001-GSK");
    console.log("Sample Pill QR:    PILL-PND-2024-001-0001-GSK");
    console.log("\n🚫 FAKE DEMO: Try batch number PND-2024-9999");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
