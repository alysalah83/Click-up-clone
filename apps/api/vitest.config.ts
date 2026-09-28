import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: ["./test/global-setup.ts"],
    setupFiles: ["./test/setup.ts"],
    // All test files share one database; run them one at a time.
    fileParallelism: false,
    hookTimeout: 180_000,
    testTimeout: 20_000,
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-secret",
      CRON_SECRET: "test-cron-secret",
    },
  },
});
