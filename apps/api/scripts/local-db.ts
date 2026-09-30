import { existsSync } from "node:fs";
import EmbeddedPostgres from "embedded-postgres";

const DATA_DIR = ".tmp/pg-dev";
const PORT = 54329;

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: "postgres",
  password: "postgres",
  port: PORT,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});

const firstRun = !existsSync(DATA_DIR);
if (firstRun) await pg.initialise();
await pg.start();
if (firstRun) await pg.createDatabase("clickup");

console.log(`Postgres ready: postgresql://postgres:postgres@localhost:${PORT}/clickup (Ctrl+C to stop)`);

process.on("SIGINT", async () => {
  await pg.stop();
  process.exit(0);
});
