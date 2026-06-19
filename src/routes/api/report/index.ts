import { createAPIFileRoute } from "@/lib/api-route-helper";
import { prisma } from "@/server/db/client";
import { ApiResponse } from "@/server/utils/api-response";
import { JwtService } from "@/server/auth/jwt.service";

export const Route = createAPIFileRoute("/api/report")({
  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const { medicineName, batchNumber, pharmacyName, description } = body;

      if (!medicineName || typeof medicineName !== "string" || medicineName.trim().length < 2) {
        return Response.json(
          ApiResponse.error("Medicine name is required.", 400),
          { status: 400 }
        );
      }
      if (!description || typeof description !== "string" || description.trim().length < 10) {
        return Response.json(
          ApiResponse.error("Please provide more details (at least 10 characters).", 400),
          { status: 400 }
        );
      }

      // Optional auth — logged-in users get their report linked to their account
      let userId: string | null = null;
      const authHeader = request.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const payload = JwtService.verifyAccessToken(authHeader.split(" ")[1]);
          userId = payload.userId;
        } catch {
          // anonymous report — still allowed
        }
      }

      // If no logged-in user, use a fallback anonymous user id or skip relation
      // Report model requires userId — find or create an ANONYMOUS sentinel user
      let reportUserId = userId;
      if (!reportUserId) {
        const ANON_EMAIL = "anonymous@mediverify.internal";
        let anonUser = await prisma.user.findUnique({ where: { email: ANON_EMAIL } });
        if (!anonUser) {
          anonUser = await prisma.user.create({
            data: {
              email: ANON_EMAIL,
              name: "Anonymous",
              role: "PATIENT",
              status: "ACTIVE",
            },
          });
        }
        reportUserId = anonUser.id;
      }

      const report = await prisma.report.create({
        data: {
          userId: reportUserId,
          medicineName: medicineName.trim(),
          batchNumber: batchNumber?.trim() || null,
          pharmacyName: pharmacyName?.trim() || null,
          description: description.trim(),
          status: "PENDING",
        },
      });

      return Response.json(
        ApiResponse.success(
          { reportId: report.id },
          "Your report has been submitted. Our team will investigate."
        )
      );
    } catch (error: any) {
      return Response.json(
        ApiResponse.error("Failed to submit report. Please try again.", 500),
        { status: 500 }
      );
    }
  },
});
