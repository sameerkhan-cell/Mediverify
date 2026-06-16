import { prisma } from "../../db/client";
import { ApiError } from "../../utils/api-response";
import { QRService } from "../qr/qr.service";
import { AuditLogService } from "../audit/audit-log.service";

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface BatchRegistrationData {
    // Medicine fields
    medicineName: string;
    genericName?: string;
    category?: string;
    dosage?: string;
    description?: string;

    // Batch fields
    batchNumber: string;
    manufacturingDate: string;
    expiryDate: string;
    quantityBoxes: number;
    pillsPerBox: number;
    boxesPerCarton: number;
    dosageStrength?: string;
    productType?: string;

    // Extension flag
    allowsExtension?: boolean;
}

export interface DashboardStats {
    totalMedicines: number;
    totalBatches: number;
    totalPillsGenerated: number;
    activeBatches: number;
    expiredBatches: number;
    recalledBatches: number;

    // Hardening metrics
    totalBoxQRGenerated: number;
    totalPillQRGenerated: number;
    totalPDFExports: number;
    totalZIPExports: number;
    lastExportDate: string | null;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class BatchService {
    /**
     * POST /api/manufacturer/batches  (and /register-batch legacy)
     *
     * Registers a new pharmaceutical batch, creates all individual pill
     * records, persists QRAsset entries, and emits audit events.
     */
    static async registerBatch(
        userId: string,
        data: BatchRegistrationData,
        requestMeta?: { ipAddress?: string; userAgent?: string }
    ) {
        const {
            medicineName,
            genericName,
            category,
            dosage,
            description,
            batchNumber,
            manufacturingDate,
            expiryDate,
            quantityBoxes,
            pillsPerBox,
            boxesPerCarton,
            dosageStrength,
            productType,
        } = data;

        // 1. Resolve manufacturer
        const manufacturer = await prisma.manufacturer.findUnique({
            where: { userId },
        });
        if (!manufacturer) throw new ApiError(404, "Manufacturer profile not found.");

        // 2. Business validations
        if (quantityBoxes < 1) throw new ApiError(400, "Quantity of boxes must be at least 1.");
        if (pillsPerBox < 1) throw new ApiError(400, "Pills per box must be at least 1.");

        const expiry = new Date(expiryDate);
        if (isNaN(expiry.getTime())) throw new ApiError(400, "Invalid expiry date format.");
        if (expiry <= new Date()) throw new ApiError(400, "Expiry date must be in the future.");

        const mfgDate = new Date(manufacturingDate);
        if (isNaN(mfgDate.getTime())) throw new ApiError(400, "Invalid manufacturing date format.");
        if (mfgDate > new Date()) throw new ApiError(400, "Manufacturing date cannot be in the future.");

        // 3. Auto-generate batch number if blank
        const finalBatchNumber =
            batchNumber && batchNumber.trim()
                ? batchNumber.trim()
                : `BAT-${Date.now().toString(36).toUpperCase()}`;

        // 4. Locate or create Medicine (scoped to this manufacturer)
        let medicine = await prisma.medicine.findFirst({
            where: { name: medicineName, manufacturerId: manufacturer.id },
        });

        if (!medicine) {
            medicine = await prisma.medicine.create({
                data: {
                    name: medicineName,
                    genericName: genericName ?? null,
                    category: category ?? null,
                    dosage: dosage ?? null,
                    description: description ?? null,
                    manufacturerId: manufacturer.id,
                },
            });
        } else if (genericName || category || dosage || description) {
            // Update medicine metadata if caller supplied richer data
            medicine = await prisma.medicine.update({
                where: { id: medicine.id },
                data: {
                    genericName: genericName ?? medicine.genericName,
                    category: category ?? medicine.category,
                    dosage: dosage ?? medicine.dosage,
                    description: description ?? medicine.description,
                },
            });
        }

        // 5. Check existing batch / extension logic
        const existingBatch = await prisma.batch.findUnique({
            where: { batchNumber: finalBatchNumber },
            include: { medicine: true },
        });

        const isExtension = !!existingBatch;

        if (isExtension) {
            // Hardening: Enforce strict uniqueness. A batch code can only ever belong to ONE medicine.
            // It can only be reused for the SAME medicine if the extension flow is explicitly triggered.
            if (existingBatch.medicineId !== medicine.id || !data.allowsExtension) {
                throw new ApiError(400, "This batch code is already registered");
            }
        }

        // 6. QR code identities
        const companyCode = manufacturer.companyCode || (manufacturer.companyName.substring(0, 3)).toUpperCase();
        // For backward compatibility in logs and the batch record, we use the first box index as the "primary" box QR if needed
        const boxQRCode = QRService.formatBoxCode(finalBatchNumber, 1, companyCode);
        const newPillsCount = quantityBoxes * pillsPerBox;
        const startPillIndex = isExtension
            ? existingBatch!.totalPillsGenerated + 1
            : 1;
        const finalTotalPills = isExtension
            ? existingBatch!.totalPillsGenerated + newPillsCount
            : newPillsCount;

        if (finalTotalPills > 100_000) {
            throw new ApiError(400, "Cumulative batch size exceeds system limit (100,000 pills).");
        }

        // 7. Atomic transaction — batch + pills + QRAsset
        const result = await prisma.$transaction(
            async (tx) => {
                let batch;

                if (isExtension) {
                    batch = await tx.batch.update({
                        where: { id: existingBatch!.id },
                        data: {
                            quantityBoxes: { increment: quantityBoxes },
                            totalPillsGenerated: { increment: newPillsCount },
                            boxesPerCarton: boxesPerCarton ?? existingBatch.boxesPerCarton,
                        },
                        include: { medicine: { include: { manufacturer: true } } },
                    });
                } else {
                    batch = await tx.batch.create({
                        data: {
                            medicineId: medicine!.id,
                            batchNumber: finalBatchNumber,
                            manufacturingDate: mfgDate,
                            expiryDate: expiry,
                            quantityBoxes,
                            pillsPerBox,
                            boxesPerCarton: boxesPerCarton ?? 10,
                            totalPillsGenerated: newPillsCount,
                            boxQRCode,
                            dosageStrength: dosageStrength ?? dosage ?? null,
                            category: category ?? null,
                            productType: productType ?? null,
                            status: "ACTIVE",
                            medicineStatus: "MANUFACTURED",
                            blockchainStatus: "PENDING",
                        },
                        include: { medicine: { include: { manufacturer: true } } },
                    });
                }

                // ── QR ASSET STORAGE (Hardening) ──────────────────────────
                // Generate and save the first Box QR as a representative PNG file for the batch
                const boxQrBuffer = await QRService.generatePNGBuffer(boxQRCode, 800);
                const boxQrPath = await QRService.saveAsset(batch.id, "box.png", boxQrBuffer);

                // Persist representative Box QRAsset record
                await tx.qRAsset.create({
                    data: {
                        batchId: batch.id,
                        type: "BOX_QR",
                        fileUrl: boxQrPath,
                        metadata: JSON.stringify({ width: 800, height: 800 }),
                    },
                });

                // ─── 3-Level Supply Chain Generation ───
                const totalBoxes = quantityBoxes;
                const finalBoxesPerCarton = boxesPerCarton ?? 10;
                const totalCartons = Math.ceil(totalBoxes / finalBoxesPerCarton);

                const allCartons = [];
                const allBoxes = [];

                for (let c = 1; c <= totalCartons; c++) {
                    const boxesInThisCarton = Math.min(finalBoxesPerCarton, totalBoxes - (c - 1) * finalBoxesPerCarton);
                    const cartonCode = QRService.formatCartonCode(finalBatchNumber, c, companyCode);
                    const carton = await tx.carton.create({
                        data: {
                            batchId: batch.id,
                            cartonNumber: cartonCode,
                            qrCode: cartonCode,
                            boxesCount: boxesInThisCarton,
                            status: "ACTIVE"
                        }
                    });
                    allCartons.push(carton);

                    for (let b = 1; b <= boxesInThisCarton; b++) {
                        const globalBoxIndex = (c - 1) * finalBoxesPerCarton + b;
                        const boxCode = QRService.formatBoxCode(finalBatchNumber, globalBoxIndex, companyCode);
                        const box = await tx.box.create({
                            data: {
                                batchId: batch.id,
                                cartonId: carton.id,
                                boxNumber: boxCode,
                                qrCode: boxCode,
                                pillsCount: pillsPerBox,
                                status: "ACTIVE"
                            }
                        });
                        allBoxes.push(box);

                        const pillsData = [];
                        for (let p = 1; p <= pillsPerBox; p++) {
                            const currentBoxPillIndex = (globalBoxIndex - 1) * pillsPerBox + p;
                            const globalPillNum = startPillIndex + currentBoxPillIndex - 1;
                            const pillCode = QRService.formatPillCode(finalBatchNumber, globalPillNum, companyCode);

                            pillsData.push({
                                batchId: batch.id,
                                boxId: box.id,
                                pillNumber: globalPillNum.toString().padStart(4, "0"),
                                serialNumber: `SN-${finalBatchNumber}-${globalPillNum.toString().padStart(4, "0")}`,
                                qrCode: pillCode,
                                status: "ACTIVE",
                                verificationStatus: "UNVERIFIED",
                                qrScanned: false
                            });
                        }
                        await tx.pill.createMany({ data: pillsData, skipDuplicates: true });
                    }
                }

                await tx.batch.update({
                    where: { id: batch.id },
                    data: { totalPillsGenerated: totalBoxes * pillsPerBox }
                });

                return { batch, startPillIndex, newPillsCount, cartons: allCartons, boxes: allBoxes };
            },
            { timeout: 900000 }
        );

        // 8. Audit logs (non-blocking)
        void AuditLogService.log({
            manufacturerId: manufacturer.id,
            batchId: result.batch.id,
            action: isExtension ? "QR_GENERATED" : "BATCH_CREATED",
            metadata: {
                batchNumber: finalBatchNumber,
                pillsGenerated: newPillsCount,
                totalPillsAfter: finalTotalPills,
            },
            ...requestMeta,
        });

        void AuditLogService.log({
            manufacturerId: manufacturer.id,
            batchId: result.batch.id,
            action: "QR_GENERATED",
            metadata: {
                boxQRCode,
                pillsGenerated: newPillsCount,
                startIndex: startPillIndex,
            },
            ...requestMeta,
        });

        return {
            batch: result.batch,
            startPillIndex: result.startPillIndex,
            newPillsCount: result.newPillsCount,
            cartons: result.cartons,
            boxes: result.boxes
        };
    }

    // ── Queries ──────────────────────────────────────────────────────────────

    static async getManufacturerBatches(userId: string) {
        const batches = await prisma.batch.findMany({
            where: {
                medicine: { manufacturer: { userId } },
            },
            include: {
                medicine: { include: { manufacturer: true } },
                _count: { select: { pills: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return batches.map(b => this.decorateBatchStatus(b));
    }

    static async getBatchDetails(
        userId: string,
        batchId: string,
        options: { allPills?: boolean } = {}
    ) {
        const batch = await prisma.batch.findFirst({
            where: { id: batchId, medicine: { manufacturer: { userId } } },
            include: {
                medicine: { include: { manufacturer: true } },
                pills: options.allPills ? true : { take: 50 },
                boxes: options.allPills ? true : { take: 1 },
                cartons: options.allPills ? true : { take: 1 },
                qrAssets: { orderBy: { createdAt: "desc" } },
                _count: {
                    select: {
                        pills: true,
                        boxes: true,
                        cartons: true
                    }
                },
            },
        });

        if (!batch) throw new ApiError(404, "Batch not found or unauthorized.");
        return this.decorateBatchStatus(batch);
    }

    static async getManufacturerMedicines(userId: string) {
        const manufacturer = await prisma.manufacturer.findUnique({ where: { userId } });
        if (!manufacturer) throw new ApiError(404, "Manufacturer profile not found.");

        return prisma.medicine.findMany({
            where: { manufacturerId: manufacturer.id },
            include: {
                _count: { select: { batches: true } },
                batches: {
                    select: {
                        id: true,
                        batchNumber: true,
                        status: true,
                        totalPillsGenerated: true,
                        expiryDate: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: "desc" },
                    take: 5,
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    /**
     * Aggregated stats for the manufacturer dashboard overview.
     */
    static async getDashboardStats(userId: string): Promise<DashboardStats> {
        const manufacturer = await prisma.manufacturer.findUnique({ where: { userId } });
        if (!manufacturer) throw new ApiError(404, "Manufacturer profile not found.");

        const mId = manufacturer.id;
        const now = new Date();

        const [totalMedicines, batches] = await Promise.all([
            prisma.medicine.count({ where: { manufacturerId: mId } }),
            prisma.batch.findMany({
                where: { medicine: { manufacturerId: mId } },
                select: {
                    id: true,
                    status: true,
                    isRecalled: true,
                    expiryDate: true,
                    totalPillsGenerated: true,
                },
            }),
        ]);

        const totalBatches = batches.length;
        const totalPillsGenerated = batches.reduce(
            (sum, b) => sum + b.totalPillsGenerated,
            0
        );

        // Auto-status logic for counts
        const decorated = batches.map(b => ({
            ...b,
            status: (new Date(b.expiryDate) <= now && b.status !== "RECALLED") ? "EXPIRED" : b.status
        }));

        const activeBatches = decorated.filter(b => b.status === "ACTIVE" || b.status === "MANUFACTURED").length;
        const expiredBatches = decorated.filter(b => b.status === "EXPIRED").length;
        const recalledBatches = decorated.filter(b => b.isRecalled || b.status === "RECALLED").length;

        // Extended metrics
        const exportLogs = await prisma.exportAnalytics.findMany({
            where: { manufacturerId: mId },
            orderBy: { timestamp: "desc" },
        });

        return {
            totalMedicines,
            totalBatches,
            totalPillsGenerated,
            activeBatches,
            expiredBatches,
            recalledBatches,
            totalBoxQRGenerated: totalBatches,
            totalPillQRGenerated: totalPillsGenerated,
            totalPDFExports: exportLogs.filter(e => e.exportType === "PDF").length,
            totalZIPExports: exportLogs.filter(e => e.exportType === "ZIP").length,
            lastExportDate: exportLogs[0]?.timestamp.toISOString() || null,
        };
    }

    /**
     * Record export audit events for PDF / ZIP downloads.
     */
    static async recordExportAudit(
        userId: string,
        batchId: string,
        exportType: "PDF_EXPORTED" | "ZIP_EXPORTED",
        requestMeta?: { ipAddress?: string; userAgent?: string }
    ): Promise<void> {
        const manufacturer = await prisma.manufacturer.findUnique({ where: { userId } });
        if (!manufacturer) return;

        // 1. Audit Log (Backward compat)
        void AuditLogService.log({
            manufacturerId: manufacturer.id,
            batchId,
            action: exportType,
            metadata: { exportedAt: new Date().toISOString() },
            ...requestMeta,
        });

        // 2. Export Analytics (New Hardening requirement)
        await prisma.exportAnalytics.create({
            data: {
                manufacturerId: manufacturer.id,
                batchId,
                exportType: exportType === "PDF_EXPORTED" ? "PDF" : "ZIP",
                exportedBy: userId,
            }
        }).catch(err => console.error("[ExportAnalytics] Failed:", err));
    }

    /**
     * Helper to automatically expose EXPIRED status for batches.
     */
    private static decorateBatchStatus(batch: any) {
        if (!batch) return batch;
        const now = new Date();
        const expiry = new Date(batch.expiryDate);

        if (expiry < now && batch.status !== "RECALLED") {
            return { ...batch, status: "EXPIRED" };
        }
        return batch;
    }
}
