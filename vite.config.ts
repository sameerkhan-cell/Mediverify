// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";

loadDotenv({ path: resolve(process.cwd(), ".env") });

// NOTE: server.entry is intentionally NOT set here.
// src/server.ts is a Cloudflare Workers-specific fetch wrapper — using it as
// the Nitro entry on Vercel produces the wrong server bundle and causes 404s.
// Nitro handles its own Vercel-compatible server entry automatically.
export default defineConfig({
  tanstackStart: {
    importProtection: {
      exclude: ["src/routes/api/**"],
    },
    vite: {
      server: {
        host: '0.0.0.0',
        allowedHosts: ['all']
      }
    }
  },
  nitro: {
    preset: "vercel",
    output: {
      dir: ".vercel/output",
      serverDir: ".vercel/output/functions/__server.func",
      publicDir: ".vercel/output/static",
    }
  }
});
