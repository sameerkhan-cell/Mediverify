import { createAPIFileRoute } from "@/lib/api-route-helper";
import { prisma } from "@/server/db/client";
import { ApiResponse } from "@/server/utils/api-response";
import { PasswordService } from "@/server/auth/password.service";

export const Route = createAPIFileRoute("/api/auth/reset-password")({
  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const { token, password } = body ?? {};

      if (!token || typeof token !== "string") {
        return Response.json(
          ApiResponse.error("Reset token is missing.", 400),
          { status: 400 }
        );
      }
      if (!password || typeof password !== "string") {
        return Response.json(
          ApiResponse.error("New password is required.", 400),
          { status: 400 }
        );
      }

      // Find user with valid non-expired token
      const user = await prisma.user.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetExpiry: { gt: new Date() },
        },
      });

      if (!user) {
        return Response.json(
          ApiResponse.error(
            "This reset link is invalid or has expired. Please request a new one.",
            400
          ),
          { status: 400 }
        );
      }

      if (!PasswordService.validate(password)) {
        return Response.json(
          ApiResponse.error(
            "Password must be at least 8 characters and include uppercase, lowercase, and a number.",
            400
          ),
          { status: 400 }
        );
      }

      const passwordHash = await PasswordService.hash(password);

      // Update password and clear the reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpiry: null,
        },
      });

      return Response.json(
        ApiResponse.success(null, "Password reset successfully. You can now sign in.")
      );
    } catch (error: any) {
      return Response.json(
        ApiResponse.error("Something went wrong. Please try again.", 500),
        { status: 500 }
      );
    }
  },
});
