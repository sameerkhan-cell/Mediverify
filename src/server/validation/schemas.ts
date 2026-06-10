import { z } from "zod";

export const AuthSchemas = {
    login: z.object({
        email: z.string().email(),
        password: z.string().min(8),
    }),
    register: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(2),
        role: z.enum(["PATIENT", "PHARMACY", "MANUFACTURER"]),
    }),
};

export const VerificationSchemas = {
    verify: z.object({
        code: z.string().min(3),
        location: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
    }),
};

export const ManufacturerSchemas = {
    /** Full batch registration (P3 spec) */
    registerBatch: z.object({
        medicineName: z.string().min(1, "Medicine name is required"),
        genericName: z.string().optional(),
        category: z.string().optional(),
        dosage: z.string().optional(),
        description: z.string().optional(),
        batchNumber: z.string().optional().default(""),
        manufacturingDate: z.string().min(1, "Manufacturing date required"),
        expiryDate: z.string().min(1, "Expiry date required"),
        quantityBoxes: z.coerce.number().int().min(1, "quantityBoxes must be >= 1"),
        pillsPerBox: z.coerce.number().int().min(1, "pillsPerBox must be >= 1"),
        dosageStrength: z.string().optional(),
        productType: z.string().optional(),
        allowsExtension: z.boolean().optional().default(false),
    }),

    /** Legacy schema — kept for backward compatibility */
    createBatch: z.object({
        medicineId: z.string(),
        batchNumber: z.string(),
        manufacturingDate: z.string().pipe(z.coerce.date()),
        expiryDate: z.string().pipe(z.coerce.date()),
        pillCount: z.number().min(1).max(100000),
    }),
};
