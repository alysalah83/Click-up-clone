/* global process, console */
// Runs `prisma migrate deploy` during Vercel production builds, so schema changes
// ship with the code that needs them. Preview/local builds skip it.
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";

// The production database was created before migration history was tracked
// (no _prisma_migrations table). Every migration older than this one already
// exists in it, so they are marked as applied once ("baselined") instead of re-run.
const FIRST_TRACKED_MIGRATION = "20260928193619_status_type_and_indexes";

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

const env = { ...process.env, DIRECT_URL: url };

function prisma(args) {
  const result = spawnSync("prisma", args, { env, encoding: "utf8", shell: true });
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
  return { ok: result.status === 0, output: `${result.stdout}${result.stderr}` };
}

let deploy = prisma(["migrate", "deploy"]);

if (!deploy.ok && deploy.output.includes("P3005")) {
  console.log("migrate-on-deploy: untracked existing schema (P3005), baselining older migrations");
  const baseline = readdirSync("prisma/migrations", { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name < FIRST_TRACKED_MIGRATION)
    .map((entry) => entry.name)
    .sort();

  for (const name of baseline) {
    if (!prisma(["migrate", "resolve", "--applied", name]).ok) process.exit(1);
  }
  deploy = prisma(["migrate", "deploy"]);
}

process.exit(deploy.ok ? 0 : 1);
