import { prisma } from "../db/client";
import { ApiError } from "../utils/api-response";

export class MedicineService {
    static async createBatch(data: {
        medicineId: string,
        batchNumber: string,
        manufacturingDate: Date,
        expiryDate: Date,
        pillCount: number
    }) {
        // 1. Create Batch
        return await prisma.$transaction(async (tx) => {
            const batch = await tx.batch.create({
                data: {
                    batchNumber: data.batchNumber,
                    medicineId: data.medicineId,
                    manufacturingDate: data.manufacturingDate,
                    expiryDate: data.expiryDate,
                }
            });

            // 2. Generate Pills in Bulk
            const pillsData = Array.from({ length: data.pillCount }).map((_, i) => ({
                batchId: batch.id,
                pillNumber: (i + 1).toString().padStart(4, '0'),
                qrCode: `PILL-${batch.batchNumber}-${(i + 1).toString().padStart(4, '0')}`,
            }));

            await tx.pill.createMany({
                data: pillsData,
            });

            return batch;
        });
    }

    static async getMedicineAnalytics(manufacturerId: string) {
        return await prisma.medicine.findMany({
            where: { manufacturerId },
            include: {
                _count: {
                    select: { batches: true }
                },
                batches: {
                    include: {
                        _count: {
                            select: { pills: true }
                        }
                    }
                }
            }
        });
    }
}
