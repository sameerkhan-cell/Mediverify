import { createAPIFileRoute } from "@/lib/api-route-helper";
import { prisma } from "@/server/db/client";
import { authorizeRequest } from "@/server/middleware/auth.middleware";

export const Route = createAPIFileRoute("/api/regulator/stats")({
    GET: async ({ request }) => {
        try {
            await authorizeRequest(request, ["ADMIN", "REGULATOR", "DRAP_ADMIN"]);

            const [totalScans, fakeDetected, suspiciousScans, activeRecalls, blacklistedPharmacies, totalManufacturers] = await Promise.all([
                prisma.verificationLog.count(),
                prisma.verificationLog.count({ where: { status: "INVALID" } }),
                prisma.verificationLog.count({ where: { status: "SUSPECTED" } }),
                prisma.batch.count({ where: { isRecalled: true } }),
                prisma.pharmacy.count({ where: { isBlacklisted: true } }),
                prisma.manufacturer.count(),
            ]);

            return Response.json({
                success: true,
                data: { totalScans, fakeDetected, suspiciousScans, activeRecalls, blacklistedPharmacies, totalManufacturers },
            });
        } catch (err: any) {
            const status = err.statusCode || 500;
            return Response.json({ success: false, error: err.message }, { status });
        }
    },
});
