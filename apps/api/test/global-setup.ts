import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import EmbeddedPostgres from "embedded-postgres";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

const DATA_DIR = ".tmp/pg-test";
const PORT = 54330;

let pg: EmbeddedPostgres | undefined;

export default async function setup(project: TestProject) {
  // CI provides a Postgres service; locally we boot an embedded one.
  let url = process.env.TEST_DATABASE_URL;

  if (!url) {
    rmSync(DATA_DIR, { recursive: true, force: true });
    pg = new EmbeddedPostgres({
      databaseDir: DATA_DIR,
      user: "postgres",
      password: "postgres",
      port: PORT,
      persistent: false,
    });
    await pg.initialise();
    await pg.start();
    await pg.createDatabase("clickup_test");
    url = `postgresql://postgres:postgres@localhost:${PORT}/clickup_test`;
  }

  execSync("pnpm exec prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
  });

  project.provide("databaseUrl", url);

  return async () => {
    await pg?.stop();
  };
}
