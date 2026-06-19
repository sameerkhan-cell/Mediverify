<<<<<<< HEAD
// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
=======
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite"; // FIX: was missing entirely
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
>>>>>>> c03fd2fd22a2c9fe60064b13147069c2d55c6ce1
import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";

loadDotenv({ path: resolve(process.cwd(), ".env") });

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
<<<<<<< HEAD
  tanstackStart: {
    server: { entry: "server" },
    importProtection: {
      exclude: ["src/routes/api/**"],
    },
    vite: {
      server: {
        host: '0.0.0.0',
        allowedHosts: ['all']
      }
    }
=======
  plugins: [
    tsconfigPaths(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    tanstackStart({
      srcDirectory: "src",
      start: {
        entry: "./src/start.ts",
      },
    }),
    react(), // must come AFTER tanstackStart()
  ],
  server: {
    host: "0.0.0.0",
    allowedHosts: ["all"],
>>>>>>> c03fd2fd22a2c9fe60064b13147069c2d55c6ce1
  },
});
