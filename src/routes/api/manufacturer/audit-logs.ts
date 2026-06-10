/**
 * GET  /api/manufacturer/audit-logs
 *
 * Returns the last 200 audit log events for the authenticated manufacturer.
 * Includes BATCH_CREATED, QR_GENERATED, PDF_EXPORTED, ZIP_EXPORTED.
 */
import { createAPIFileRoute } from "@/lib/api-route-helper";
import { AuditLogService } from "@/server/services/audit/audit-log.service";
import { authorizeRequest } from "@/server/middleware/auth.middleware";
import { ApiResponse } from "@/server/utils/api-response";
import { prisma } from "@/server/db/client";

export const Route = createAPIFileRoute("/api/manufacturer/audit-logs")({
    GET: async ({ request }: { request: Request }) => {
        try {
            const payload = await authorizeRequest(request, ["MANUFACTURER"]);

            const manufacturer = await prisma.manufacturer.findUnique({
                where: { userId: payload.userId },
            });
            if (!manufacturer) {
                return Response.json(
                    ApiResponse.error("Manufacturer profile not found.", 404),
                    { status: 404 }
                );
            }

            const logs = await AuditLogService.getManufacturerLogs(manufacturer.id);
            return Response.json(ApiResponse.success(logs));
        } catch (error: any) {
            const status = error.statusCode || 401;
            return Response.json(ApiResponse.error(error.message, status), { status });
        }
    },
});
