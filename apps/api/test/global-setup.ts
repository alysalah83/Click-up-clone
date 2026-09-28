import { execFileSync, execSync } from "node:child_process";
import { existsSync, readdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import EmbeddedPostgres from "embedded-postgres";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

const TMP_DIR = ".tmp";
const DIR_PREFIX = "pg-test";

let pg: EmbeddedPostgres | undefined;
let dataDir: string | undefined;
let pgCtl: string | undefined;

/** Locate pg_ctl the same way embedded-postgres locates its binaries (its platform package). */
async function findPgCtl(): Promise<string | undefined> {
  try {
    const platform = os.platform() === "win32" ? "windows" : os.platform();
    const fromEmbedded = createRequire(createRequire(import.meta.url).resolve("embedded-postgres"));
    const entry = fromEmbedded.resolve(`@embedded-postgres/${platform}-${os.arch()}`);
    const { pg_ctl } = (await import(pathToFileURL(entry).href)) as { pg_ctl?: string };
    return pg_ctl && existsSync(pg_ctl) ? pg_ctl : undefined;
  } catch {
    return undefined;
  }
}

function pgCtlStop(dir: string, mode: "immediate" | "fast") {
  if (!pgCtl) return false;
  try {
    execFileSync(pgCtl, ["-D", dir, "-m", mode, "-w", "stop"], { stdio: "ignore", timeout: 30_000 });
    return true;
  } catch {
    return false;
  }
}

function removeDir(dir: string) {
  try {
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch {
    // Best effort: a locked leftover dir must never fail the test run.
  }
}

/** Stop and remove data dirs left behind by crashed or killed runs. */
function cleanupStaleDirs() {
  if (!existsSync(TMP_DIR)) return;
  for (const name of readdirSync(TMP_DIR)) {
    if (!name.startsWith(DIR_PREFIX)) continue;
    const dir = path.join(TMP_DIR, name);
    if (existsSync(path.join(dir, "postmaster.pid"))) pgCtlStop(dir, "immediate");
    removeDir(dir);
  }
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, () => {
      const { port } = server.address() as { port: number };
      server.close(() => resolve(port));
    });
  });
}

export default async function setup(project: TestProject) {
  // CI provides a Postgres service; locally we boot an embedded one.
  let url = process.env.TEST_DATABASE_URL;

  if (!url) {
    pgCtl = await findPgCtl();
    cleanupStaleDirs();

    dataDir = path.join(TMP_DIR, `${DIR_PREFIX}-${process.pid}`);
    const port = await freePort();
    pg = new EmbeddedPostgres({
      databaseDir: dataDir,
      user: "postgres",
      password: "postgres",
      port,
      persistent: false,
      // Throwaway data: skip fsync so startup, tests and shutdown checkpoints stay fast.
      postgresFlags: ["-c", "fsync=off"],
    });
    await pg.initialise();
    await pg.start();
    await pg.createDatabase("clickup_test");
    url = `postgresql://postgres:postgres@localhost:${port}/clickup_test`;
  }

  execSync("pnpm exec prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
  });

  project.provide("databaseUrl", url);

  return async () => {
    if (!pg || !dataDir) return;
    // Graceful stop lets postgres release its files; taskkill (pg.stop on Windows) can leave them locked.
    pgCtlStop(dataDir, "fast");
    // Always call pg.stop() too (a no-op kill if already stopped): it resets embedded-postgres'
    // state, otherwise its exit hook waits forever on the already-exited process.
    await pg.stop().catch(() => {});
    removeDir(dataDir);
  };
}
