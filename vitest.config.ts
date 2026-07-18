import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    environmentOptions: {
      jsdom: { url: "http://localhost:3000" },
    },
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: [
        "src/app/api/**/*.ts",
        "src/components/flower-adjustment-panel.tsx",
        "src/components/flower-controls.tsx",
        "src/components/flower-studio.tsx",
        "src/components/saved-flowers-dialog.tsx",
        "src/lib/**/*.ts",
      ],
      exclude: ["tests/**"],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
