// Runs `prisma migrate deploy` during Vercel production builds, so schema changes
// ship with the code that needs them. Preview/local builds skip it.
/* global process, console */
import { execSync } from "node:child_process";

if (process.env.VERCEL_ENV !== "production") {
  console.log("migrate-on-deploy: not a production build, skipping migrations");
  process.exit(0);
}

// Migrations need Neon's direct (non-pooled) host; derive it from the pooled URL if needed.
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL?.replace("-pooler.", ".");
if (!url) {
  console.error("migrate-on-deploy: DIRECT_URL or DATABASE_URL must be set");
  process.exit(1);
}

execSync("prisma migrate deploy", {
  stdio: "inherit",
  env: { ...process.env, DIRECT_URL: url },
});
