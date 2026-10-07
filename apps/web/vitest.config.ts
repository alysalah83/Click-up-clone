import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@clickup/shared/formula": path.resolve(__dirname, "../../packages/shared/src/formula.ts"),
      "@clickup/shared/importParse": path.resolve(__dirname, "../../packages/shared/src/importParse.ts"),
    },
  },
});
