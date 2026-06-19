import { createAPIFileRoute } from "@/lib/api-route-helper";
import { prisma } from "@/server/db/client";
import { ApiResponse } from "@/server/utils/api-response";
import { MfaService } from "@/server/services/mfa.service";
import crypto from "crypto";

export const Route = createAPIFileRoute("/api/auth/forgot-password")({
  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

      if (!email) {
        return Response.json(
          ApiResponse.error("Email is required.", 400),
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({ where: { email } });

      // Always return success to prevent email enumeration
      const SUCCESS_MSG = "If an account exists, a reset link has been sent.";

      if (!user) {
        return Response.json(ApiResponse.success(null, SUCCESS_MSG));
      }

      // Generate secure random token
      const token = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: token,
          passwordResetExpiry: expiry,
        },
      });

      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.VITE_APP_URL ||
        "http://localhost:3000";
      const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;

      // Try to send email — falls back to console.log if SMTP not configured
      try {
        await MfaService.sendPasswordResetEmail(user.email, resetUrl);
      } catch {
        console.log(`[PASSWORD_RESET] Reset URL for ${user.email}: ${resetUrl}`);
      }

      return Response.json(ApiResponse.success(null, SUCCESS_MSG));
    } catch (error: any) {
      return Response.json(
        ApiResponse.error("Something went wrong. Please try again.", 500),
        { status: 500 }
      );
    }
  },
});
