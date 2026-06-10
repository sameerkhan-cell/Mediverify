import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@/lib/api-route-helper";

export const APIRoute = createAPIFileRoute("/api/auth/reset-password")({
  POST: async ({ request }) => {
    try {
      const { token, password, confirmPassword } = (await request.json()) as {
        token: string;
        password: string;
        confirmPassword: string;
      };

      if (!token || !password || !confirmPassword) {
        return json({ error: "All fields are required." }, { status: 400 });
      }

      if (password !== confirmPassword) {
        return json({ error: "Passwords do not match." }, { status: 400 });
      }

      if (password.length < 8) {
        return json({ error: "Password must be at least 8 characters." }, { status: 400 });
      }

      // In production: verify token from DB and update user password
      // For demo, we accept any non-empty token
      if (!token || token.length < 10) {
        return json({ error: "Invalid or expired reset token." }, { status: 400 });
      }

      return json({
        success: true,
        message: "Password reset successfully. You can now log in.",
      });
    } catch {
      return json({ error: "Internal server error." }, { status: 500 });
    }
  },
});
