import { beforeEach, inject } from "vitest";

// Must run before anything imports src/config/env.ts.
const databaseUrl = inject("databaseUrl");
process.env.DATABASE_URL = databaseUrl;

// The suite TRUNCATEs every table before each test: never point it at a real database.
const dbHost = new URL(databaseUrl).hostname;
if (!["localhost", "127.0.0.1"].includes(dbHost) && !process.env.CI)
  throw new Error(`Refusing to run tests against non-local database host "${dbHost}" (set CI to override)`);

const { prisma } = await import("../src/lib/prisma.js");

beforeEach(async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "Task", "Status", "List", "Workspace", "Avatar", "User" RESTART IDENTITY CASCADE',
  );
});
