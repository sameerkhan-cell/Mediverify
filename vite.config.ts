import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite"; // FIX: was missing entirely
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";

loadDotenv({ path: resolve(process.cwd(), ".env") });

export default defineConfig({
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
  },
});
