import { beforeEach, inject } from "vitest";

// Must run before anything imports src/config/env.ts.
process.env.DATABASE_URL = inject("databaseUrl");

const { prisma } = await import("../src/lib/prisma.js");

beforeEach(async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "Task", "Status", "List", "Workspace", "Avatar", "User" RESTART IDENTITY CASCADE',
  );
});
