import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@/lib/api-route-helper";
import type { LoginCredentials } from "@/types/auth";

// ─── Simulated user DB (replace with real DB/Supabase) ──────────────────────
const MOCK_USERS = [
  {
    id: "usr_001",
    email: "demo@mediverify.com",
    password: "Demo@1234",
    fullName: "Demo User",
    role: "customer" as const,
    emailVerified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "usr_002",
    email: "pharmacy@mediverify.com",
    password: "Pharmacy@1234",
    fullName: "Servaid Pharmacy",
    role: "pharmacy" as const,
    emailVerified: true,
    createdAt: new Date().toISOString(),
  },
];

function signJWT(payload: object): string {
  // Simulated JWT — replace with real jose/jsonwebtoken in production
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }));
  const sig = btoa("mediverify-secret-signature");
  return `${header}.${body}.${sig}`;
}

export const APIRoute = createAPIFileRoute("/api/auth/login")({
  POST: async ({ request }) => {
    try {
      const body = (await request.json()) as LoginCredentials;
      const { email, password } = body;

      if (!email || !password) {
        return json({ error: "Email and password are required." }, { status: 400 });
      }

      const found = MOCK_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!found) {
        return json({ error: "Invalid email or password." }, { status: 401 });
      }

      const { password: _pwd, ...user } = found;
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
      const token = signJWT({ sub: user.id, role: user.role, exp: Math.floor(expiresAt / 1000) });

      return json({
        success: true,
        data: { user, token, expiresAt },
        message: `Welcome back, ${user.fullName}!`,
      });
    } catch {
      return json({ error: "Internal server error." }, { status: 500 });
    }
  },
});
