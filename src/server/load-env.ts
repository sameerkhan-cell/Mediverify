import { config } from "dotenv";
import { resolve } from "node:path";

// Vite SSR does not always expose non-VITE_ variables to process.env.
// Load .env explicitly so SMTP, JWT, and other server secrets are available.
try {
  config({ path: resolve(process.cwd(), ".env") });
} catch (e) {
  console.warn("Unable to load .env file, relying on environment variables:", e);
}
