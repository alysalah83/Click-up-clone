# A2: API Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `apps/api` safe and trustworthy without breaking the live web app:
- validated input on every route,
- ownership checks on every referenced ID,
- no mass assignment,
- hardened auth,
- a status model that never deletes tasks,
- database indexes,
- guest cleanup,
- a real Postgres-backed test suite running in CI.

**Architecture:** Requests flow routes → `validate()` middleware → thin controllers → services, and only services import Prisma. The zod schemas live in the new `packages/shared`, which web adopts in A4. `assertCanAccess()` is the single ownership check; Spec B re-implements it for workspace membership. Tests use Vitest + supertest against a real Postgres: `embedded-postgres` locally (Docker is not installed), and a service container in CI. **Response shapes stay backward compatible** (spec §0.2): every change is safe to deploy before the web app. The one web change (Task 9) is removing `?select=id`, which the API ignores anyway.

**Tech Stack:** Express 5, Prisma 7 (Neon adapter in production, `@prisma/adapter-pg` locally and in tests), zod 4, express-rate-limit 8, helmet 8, Vitest 4, supertest, embedded-postgres, GitHub Actions Postgres 17 service.

**Spec:** `docs/superpowers/specs/2026-09-28-foundation-design.md` (§0 amendments 1–6, §4.3)

## Global Constraints

- **Prerequisite:** plan A1 is complete. The repo is at `D:\projects\click-up\click-up-clone`, with the API in `apps/api` and pnpm + turbo working.
- Work on a branch: `git checkout -b a2-api-hardening`. Merging and pushing require asking the user in chat first.
- **Backward compatibility:** every existing endpoint keeps its path, method, status code on success, and JSON response shape. The only exceptions are listed in the table below.
- The token stays in the login/register JSON body (spec §0.1).
- Server-side input limits:
  - task name: 1–128
  - list name and workspace name: 1–320
  - status name: 1–320
  - user name: 2–120
  - email: max 100
  - password: register 6–320 (trimmed), login 1–320
- Default statuses keep orders 100 / 200 / 100000 (spec §0.4).
- JWT and API cookie lifetime: 7 days.
- Only files under `src/services/` import `src/lib/prisma.ts`. The exceptions are the test setup/helpers, `app.ts`'s `/health` handler, and `error.middleware.ts`'s import of Prisma error *types*.
- Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

**Deliberate behavior changes (all security or bug fixes):**

| Endpoint | Before | After |
|---|---|---|
| `POST /users/login` | 404 unknown email / 406 wrong password | 401 `Invalid email or password` for both |
| `GET /users/:id` | Returned any user | Removed (404) |
| Any `?select=` | Arbitrary Prisma select (leaked the password hash) | Ignored; fixed shapes |
| `GET /workspaces/:id`, `GET /lists/:listId` | `200 null` when missing | 404 |
| Other user's IDs in bodies or params | Silently accepted | 404 (not found) or 422 (status belongs to another list) |
| `DELETE /statuses/:id` | Cascade-deleted its tasks | Moves tasks to the list's open status |
| Invalid input | 500 / 409 / Prisma error | 422 with `error.errors.fieldErrors` |
| `GET /statuses/statusCounts` | Counted statuses | Counts tasks (same shape) |

## File Structure

```
packages/shared/                     NEW package @clickup/shared (zod schemas + types)
  package.json, tsconfig.json
  src/index.ts                       re-exports
  src/common.ts                      ids, params, count query, priority, sort order
  src/auth.ts                        register/login/updateMe
  src/workspace.ts                   create/update/flow
  src/list.ts                        create/update
  src/status.ts                      create/update
  src/task.ts                        create/update/bulk/query
  src/schemas.test.ts
apps/api/
  vitest.config.ts                   NEW
  scripts/local-db.ts                NEW persistent embedded Postgres for dev
  test/global-setup.ts               NEW start Postgres + migrate
  test/setup.ts                      NEW truncate between tests
  test/helpers.ts                    NEW api(), signUp(), seedWorkspace(), createTask()
  test/{health,validate,auth,workspaces,lists,statuses,tasks,cron}.test.ts
  src/config/env.ts                  NEW required env + defaults (fail fast)
  src/lib/prisma.ts                  adapter switch (Neon vs pg)
  src/lib/middlewares/validate.middleware.ts    NEW
  src/lib/middlewares/rateLimit.middleware.ts   NEW
  src/lib/middlewares/error.middleware.ts       rewritten
  src/lib/middlewares/auth.middleware.ts        uses env, 7d
  src/consts/{auth,status}.const.ts
  src/services/access.service.ts     NEW assertCanAccess / assertStatusInList
  src/services/{user,workspace,list,status,task,guestCleanup}.service.ts   NEW
  src/controllers/*.controller.ts    rewritten thin
  src/routes/*.routes.ts             + validate + limiters; NEW internal.routes.ts
  src/app.ts                         helmet, cors PATCH, /health, /internal
  prisma/schema.prisma               StatusType, isDefault, NoAction FK, indexes
  prisma/migrations/<ts>_status_type_and_indexes/migration.sql
  vercel.json                        zero-config Express + cron
  README.md                          NEW dev/test instructions
apps/web/src/features/list/api/list.ts   drop ?select=id
.github/workflows/ci.yml             Postgres service + TEST_DATABASE_URL
docs/adr/0003-api-layering-and-validation.md
```

---

### Task 1: Test harness, env config, adapter switch, `/health`

**Files:**
- Create: `apps/api/vitest.config.ts`, `apps/api/test/global-setup.ts`, `apps/api/test/setup.ts`, `apps/api/test/helpers.ts`, `apps/api/test/health.test.ts`, `apps/api/test/env.test.ts`, `apps/api/scripts/local-db.ts`, `apps/api/src/config/env.ts`
- Modify: `apps/api/src/lib/prisma.ts`, `apps/api/src/app.ts`, `apps/api/package.json`, `apps/api/tsconfig.json`, `pnpm-workspace.yaml`, `.github/workflows/ci.yml`

**Interfaces:**
- Produces: `env` (from `src/config/env.ts`): `{ NODE_ENV, DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, CRON_SECRET?, GUEST_SIGNUPS_PER_MINUTE, LOGIN_ATTEMPTS_PER_15_MIN }`, plus `loadEnv(): typeof env`.
- Produces: test helpers:
  - `api(): supertest.Agent-like`
  - `signUp(overrides?) → Promise<{ user: { id: string }, token: string, cookie: string, credentials: { name; email; password } }>`
- Produces: `GET /health → 200 { ok: true }`.

- [ ] **Step 1: Add dependencies**

```bash
cd /d/projects/click-up/click-up-clone
git checkout -b a2-api-hardening
pnpm --filter @clickup/api add zod@^4 helmet express-rate-limit
pnpm --filter @clickup/api add -D vitest@^4 supertest @types/supertest embedded-postgres
```

If pnpm prints `Ignored build scripts: ...` for any `embedded-postgres`/`@embedded-postgres/*` package, add those names to `onlyBuiltDependencies` in `pnpm-workspace.yaml` and run `pnpm install` again.

- [ ] **Step 2: Update API scripts and tsconfig**

In `apps/api/package.json`, set these scripts (keep `postinstall`, `dev`, `build`, `lint`, `typecheck`):

```json
"test": "vitest run",
"test:watch": "vitest",
"db:local": "tsx scripts/local-db.ts"
```

In `apps/api/tsconfig.json`, change `include` to:

```json
"include": ["src/**/*.ts", "test/**/*.ts", "scripts/**/*.ts", "prisma.config.ts", "vitest.config.ts"]
```

- [ ] **Step 3: Write the failing tests**

`apps/api/test/health.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { api } from "./helpers.js";

describe("GET /health", () => {
  it("returns ok after touching the database", async () => {
    const res = await api().get("/health").expect(200);
    expect(res.body).toEqual({ ok: true });
  });
});
```

`apps/api/test/env.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import { loadEnv } from "../src/config/env.js";

const original = process.env.JWT_SECRET;

describe("loadEnv", () => {
  afterEach(() => {
    process.env.JWT_SECRET = original;
  });

  it("throws a clear error when JWT_SECRET is missing", () => {
    delete process.env.JWT_SECRET;
    expect(() => loadEnv()).toThrow("Missing required environment variable: JWT_SECRET");
  });

  it("defaults JWT_EXPIRES_IN to 7d", () => {
    delete process.env.JWT_EXPIRES_IN;
    expect(loadEnv().JWT_EXPIRES_IN).toBe("7d");
  });
});
```

- [ ] **Step 4: Create the Vitest config and harness**

`apps/api/vitest.config.ts`:

```ts
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
```

`apps/api/test/global-setup.ts`:

```ts
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
```

`apps/api/test/setup.ts`:

```ts
import { beforeEach, inject } from "vitest";

// Must run before anything imports src/config/env.ts.
process.env.DATABASE_URL = inject("databaseUrl");

const { prisma } = await import("../src/lib/prisma.js");

beforeEach(async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "Task", "Status", "List", "Workspace", "Avatar", "User" RESTART IDENTITY CASCADE',
  );
});
```

`apps/api/test/helpers.ts`:

```ts
import request from "supertest";
import app from "../src/app.js";

export const api = () => request(app);

let counter = 0;

export async function signUp(
  overrides: Partial<{ name: string; email: string; password: string }> = {},
) {
  counter += 1;
  const credentials = {
    name: "Test User",
    email: `user${counter}-${Date.now()}@test.dev`,
    password: "secret123",
    ...overrides,
  };
  const res = await api().post("/api/users/register/user").send(credentials).expect(201);
  const token = res.body.token as string;
  return {
    user: res.body.user as { id: string },
    token,
    cookie: `token=${token}`,
    credentials,
  };
}
```

- [ ] **Step 5: Run the tests to verify they fail**

Run: `pnpm --filter @clickup/api test`

Expected: FAIL. `env.test.ts` fails with a missing-module error for `../src/config/env.js`, and `health.test.ts` returns 404 for `/health`. The first run downloads nothing: embedded-postgres ships its binaries in the npm package. It prints `initdb` output and then Prisma's `Applying migration` lines for all 27 migrations.

- [ ] **Step 6: Create `apps/api/src/config/env.ts`**

```ts
import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function loadEnv() {
  return {
    NODE_ENV: process.env.NODE_ENV ?? "development",
    DATABASE_URL: required("DATABASE_URL"),
    JWT_SECRET: required("JWT_SECRET"),
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
    CRON_SECRET: process.env.CRON_SECRET,
    GUEST_SIGNUPS_PER_MINUTE: Number(process.env.GUEST_SIGNUPS_PER_MINUTE ?? 30),
    LOGIN_ATTEMPTS_PER_15_MIN: Number(process.env.LOGIN_ATTEMPTS_PER_15_MIN ?? 10),
  };
}

// Evaluated once at startup: a missing secret crashes the boot, not a request.
export const env = loadEnv();
```

- [ ] **Step 7: Replace `apps/api/src/lib/prisma.ts` (Neon in production, pg elsewhere)**

```ts
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "../config/env.js";

const isNeon = new URL(env.DATABASE_URL).hostname.endsWith(".neon.tech");

const adapter = isNeon
  ? new PrismaNeon({ connectionString: env.DATABASE_URL })
  : new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
```

- [ ] **Step 8: Add `/health` in `apps/api/src/app.ts` and drop the duplicate `dotenv.config()`**

Replace the file:

```ts
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import "./config/env.js";
import workspaceRoutes from "./routes/workspace.routes.js";
import listsRoutes from "./routes/list.routes.js";
import taskRoutes from "./routes/task.routes.js";
import userRoutes from "./routes/user.routes.js";
import statusRoutes from "./routes/status.routes.js";
import { globalErrorHandler } from "./lib/middlewares/error.middleware.js";
import { catchAsync } from "./lib/utils/catchAsync.js";
import { prisma } from "./lib/prisma.js";

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:3000", "https://click-up-clone-two.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);
app.use(cookieParser());

// Used by the web app to wake the serverless function and the Neon compute before login.
app.get(
  "/health",
  catchAsync(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ ok: true });
  }),
);

app.use("/api/users", userRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/lists", listsRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/statuses", statusRoutes);
app.use(globalErrorHandler);

export default app;
```

- [ ] **Step 9: Make `auth.middleware.ts` read the secret from `env`**

In `apps/api/src/lib/middlewares/auth.middleware.ts`:
- Add `import { env } from "../../config/env.js";`.
- Replace both occurrences of `process.env.JWT_SECRET as string` with `env.JWT_SECRET`.
- Replace the `expiresIn` expression with `const expiresIn = env.JWT_EXPIRES_IN as StringValue;`.

- [ ] **Step 10: Create `apps/api/scripts/local-db.ts` for local development**

```ts
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
```

- [ ] **Step 11: Add a Postgres service to CI**

In `.github/workflows/ci.yml`, add a `services` block under `jobs.ci` and one env var:

```yaml
    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: clickup_test
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready
          --health-interval 5s
          --health-timeout 5s
          --health-retries 10
```

Add this under `jobs.ci.env`:

```yaml
      TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/clickup_test
```

- [ ] **Step 12: Run the tests to verify they pass**

Run: `pnpm --filter @clickup/api test`
Expected: PASS, 3 tests in 2 files.

Run: `pnpm --filter @clickup/api typecheck`
Expected: exit 0.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "test(api): postgres-backed vitest harness, env fail-fast, /health

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: `@clickup/shared` schemas + `validate()` middleware

**Files:**
- Create: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/{index,common,auth,workspace,list,status,task}.ts`, `packages/shared/src/schemas.test.ts`
- Create: `apps/api/src/lib/middlewares/validate.middleware.ts`, `apps/api/test/validate.test.ts`
- Modify: `apps/api/package.json` (add the dependency)

**Interfaces:**
- Produces (`@clickup/shared`):
  - Common: `idSchema`, `idParamsSchema`, `listIdParamsSchema`, `workspaceIdParamsSchema`, `listInWorkspaceParamsSchema`, `countQuerySchema`, `prioritySchema`, `sortOrderSchema`
  - Auth: `registerSchema`, `loginSchema`, `updateMeSchema`
  - Workspace: `createWorkspaceSchema`, `updateWorkspaceSchema`, `createWorkspaceFlowSchema`
  - List: `createListSchema`, `updateListSchema`
  - Status: `statusTypeSchema`, `createStatusSchema`, `updateStatusSchema`
  - Task: `createTaskSchema`, `updateTaskSchema`, `bulkUpdateTasksSchema`, `bulkDeleteTasksSchema`, `tasksQuerySchema`, `priorityCountsQuerySchema`
  - Types: `RegisterInput`, `LoginInput`, `UpdateMeInput`, `CreateWorkspaceInput`, `UpdateWorkspaceInput`, `CreateWorkspaceFlowInput`, `CreateListInput`, `UpdateListInput`, `CreateStatusInput`, `UpdateStatusInput`, `CreateTaskInput`, `UpdateTaskInput`, `BulkUpdateTasksInput`, `TasksQuery`, `Priority`, `SortOrder`, `StatusType`
- Produces (api): `validate({ params?, query?, body? }): RequestHandler`. On success it replaces `req.params`, `req.query` and `req.body` with the parsed data, so unknown keys are stripped. On failure it calls `next(new ValidationError("Invalid request <part>", z.flattenError(err)))`, which gives a 422 response with `error.errors.fieldErrors`.

- [ ] **Step 1: Create the package skeleton**

`packages/shared/package.json`:

```json
{
  "name": "@clickup/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsc -p tsconfig.json --watch --preserveWatchOutput",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "echo \"shared: no lint rules yet\"",
    "test": "vitest run"
  },
  "dependencies": { "zod": "^4.0.0" },
  "devDependencies": { "typescript": "^5.9.3", "vitest": "^4.0.18" }
}
```

`packages/shared/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts"]
}
```

Run: `pnpm install && pnpm --filter @clickup/api add @clickup/shared@workspace:*`

- [ ] **Step 2: Write the failing schema tests**

`packages/shared/src/schemas.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  createTaskSchema,
  createWorkspaceFlowSchema,
  tasksQuerySchema,
  updateTaskSchema,
  updateWorkspaceSchema,
} from "./index.js";

const id = "3f2b8a4e-9c1d-4e2f-8a6b-1c2d3e4f5a6b";

describe("createTaskSchema", () => {
  it("trims the name, defaults priority to none and coerces ISO dates", () => {
    expect(
      createTaskSchema.parse({
        name: "  Ship it ",
        listId: id,
        statusId: id,
        startDate: "2026-09-28T00:00:00.000Z",
        endDate: null,
      }),
    ).toEqual({
      name: "Ship it",
      listId: id,
      statusId: id,
      priority: "none",
      startDate: new Date("2026-09-28T00:00:00.000Z"),
      endDate: null,
    });
  });

  it("rejects names longer than 128 characters and unknown priorities", () => {
    expect(createTaskSchema.safeParse({ name: "x".repeat(129), listId: id, statusId: id }).success).toBe(false);
    expect(createTaskSchema.safeParse({ name: "a", listId: id, statusId: id, priority: "p0" }).success).toBe(false);
  });
});

describe("updateTaskSchema", () => {
  it("strips fields that must never be client-controlled", () => {
    expect(updateTaskSchema.parse({ name: "a", userId: id, listId: id, id })).toEqual({ name: "a" });
  });
});

describe("updateWorkspaceSchema", () => {
  it("strips userId and avatarId (mass assignment)", () => {
    expect(updateWorkspaceSchema.parse({ name: "A", userId: id, avatarId: id })).toEqual({ name: "A" });
  });
});

describe("createWorkspaceFlowSchema", () => {
  it("drops a smuggled userId from nested objects", () => {
    const parsed = createWorkspaceFlowSchema.parse({
      data: {
        workspace: { name: "Eng", avatar: { icon: "circleDotted", color: "violet" } },
        list: { name: "Sprint", userId: id },
        status: { name: "review", icon: "inProgress", iconColor: "sky", bgColor: "sky" },
        task: { name: "First", userId: id },
      },
    });
    expect(parsed.data.list).toEqual({ name: "Sprint" });
    expect(parsed.data.task).toEqual({ name: "First", priority: "none" });
  });
});

describe("tasksQuerySchema", () => {
  it("treats empty sort values as absent and applies the default limit", () => {
    expect(tasksQuerySchema.parse({ listId: id, status: "", createdAt: "asc" })).toEqual({
      listId: id,
      createdAt: "asc",
      limit: 500,
    });
  });

  it("caps limit at 1000", () => {
    expect(tasksQuerySchema.safeParse({ limit: "5000" }).success).toBe(false);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm --filter @clickup/shared test`
Expected: FAIL, because `./index.js` does not exist.

- [ ] **Step 4: Write the schemas**

`packages/shared/src/common.ts`:

```ts
import { z } from "zod";

export const idSchema = z.uuid();

export const idParamsSchema = z.object({ id: idSchema });
export const listIdParamsSchema = z.object({ listId: idSchema });
export const workspaceIdParamsSchema = z.object({ workspaceId: idSchema });
export const listInWorkspaceParamsSchema = z.object({ listId: idSchema, workspaceId: idSchema });

export const booleanStringSchema = z.enum(["true", "false"]);
export const countQuerySchema = z.object({ count: booleanStringSchema.optional() });

export const prioritySchema = z.enum(["urgent", "high", "normal", "low", "none"]);
export const sortOrderSchema = z.enum(["asc", "desc"]);

/** Sort params arrive as `?status=asc`; an empty value means "not sorted by this". */
export const optionalSortOrderSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  sortOrderSchema.optional(),
);

export type Priority = z.infer<typeof prioritySchema>;
export type SortOrder = z.infer<typeof sortOrderSchema>;
```

`packages/shared/src/auth.ts`:

```ts
import { z } from "zod";

export const emailSchema = z.email().max(100);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  password: z.string().trim().min(6).max(320),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(320),
});

export const updateMeSchema = z.object({ hasOnBoarded: z.boolean() });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
```

`packages/shared/src/list.ts`:

```ts
import { z } from "zod";
import { idSchema } from "./common.js";

export const listNameSchema = z.string().trim().min(1).max(320);

export const createListSchema = z.object({ name: listNameSchema, workspaceId: idSchema });
export const updateListSchema = z.object({ name: listNameSchema.optional() });

export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
```

`packages/shared/src/status.ts`:

```ts
import { z } from "zod";
import { idSchema } from "./common.js";

export const statusTypeSchema = z.enum(["open", "active", "done"]);

export const statusFieldsSchema = z.object({
  name: z.string().trim().min(1).max(320),
  icon: z.string().trim().min(1).max(64),
  iconColor: z.string().trim().min(1).max(32),
  bgColor: z.string().trim().min(1).max(32),
});

export const createStatusSchema = statusFieldsSchema.extend({ listId: idSchema });
export const updateStatusSchema = statusFieldsSchema.partial();

export type StatusType = z.infer<typeof statusTypeSchema>;
export type CreateStatusInput = z.infer<typeof createStatusSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
```

`packages/shared/src/task.ts`:

```ts
import { z } from "zod";
import { booleanStringSchema, idSchema, optionalSortOrderSchema, prioritySchema } from "./common.js";

const optionalDateSchema = z.coerce.date().nullable().optional();

export const taskNameSchema = z.string().trim().min(1).max(128);

/** Fields a client may set when creating a task (without placement). */
export const taskFieldsSchema = z.object({
  name: taskNameSchema,
  priority: prioritySchema.default("none"),
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
});

export const createTaskSchema = taskFieldsSchema.extend({ listId: idSchema, statusId: idSchema });

export const updateTaskSchema = z.object({
  name: taskNameSchema.optional(),
  statusId: idSchema.optional(),
  priority: prioritySchema.optional(),
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
});

export const bulkUpdateTasksSchema = z.object({
  tasksId: z.array(idSchema).min(1).max(500),
  updatedFields: updateTaskSchema,
});

/** The web app sends the ids array as the raw DELETE body. */
export const bulkDeleteTasksSchema = z.array(idSchema).min(1).max(500);

export const tasksQuerySchema = z.object({
  listId: idSchema.optional(),
  status: optionalSortOrderSchema,
  priority: optionalSortOrderSchema,
  dueDate: optionalSortOrderSchema,
  createdAt: optionalSortOrderSchema,
  count: booleanStringSchema.optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(500),
  cursor: idSchema.optional(),
});

export const priorityCountsQuerySchema = z.object({ listId: idSchema.optional() });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type BulkUpdateTasksInput = z.infer<typeof bulkUpdateTasksSchema>;
export type TasksQuery = z.infer<typeof tasksQuerySchema>;
```

`packages/shared/src/workspace.ts`:

```ts
import { z } from "zod";
import { listNameSchema } from "./list.js";
import { statusFieldsSchema } from "./status.js";
import { taskFieldsSchema } from "./task.js";

export const avatarSchema = z.object({
  icon: z.string().trim().min(1).max(64),
  color: z.string().trim().min(1).max(32),
});

export const workspaceNameSchema = z.string().trim().min(1).max(320);

export const createWorkspaceSchema = z.object({ name: workspaceNameSchema, avatar: avatarSchema });

export const updateWorkspaceSchema = z.object({
  name: workspaceNameSchema.optional(),
  avatar: avatarSchema.partial().optional(),
});

/** Onboarding wizard: workspace + list + custom status + first task in one request. */
export const createWorkspaceFlowSchema = z.object({
  data: z.object({
    workspace: createWorkspaceSchema,
    list: z.object({ name: listNameSchema }),
    status: statusFieldsSchema,
    task: taskFieldsSchema,
  }),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type CreateWorkspaceFlowInput = z.infer<typeof createWorkspaceFlowSchema>;
```

`packages/shared/src/index.ts`:

```ts
export * from "./common.js";
export * from "./auth.js";
export * from "./list.js";
export * from "./status.js";
export * from "./task.js";
export * from "./workspace.js";
```

- [ ] **Step 5: Run the schema tests and build**

Run: `pnpm --filter @clickup/shared test && pnpm --filter @clickup/shared build`
Expected: PASS (7 tests), and `packages/shared/dist/index.js` + `index.d.ts` exist.

- [ ] **Step 6: Write the failing middleware test**

`apps/api/test/validate.test.ts`:

```ts
import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { validate } from "../src/lib/middlewares/validate.middleware.js";
import { globalErrorHandler } from "../src/lib/middlewares/error.middleware.js";

const app = express();
app.use(express.json());
app.post(
  "/items/:id",
  validate({
    params: z.object({ id: z.uuid() }),
    query: z.object({ page: z.coerce.number().default(1) }),
    body: z.object({ name: z.string().min(1) }),
  }),
  (req, res) => {
    res.json({ params: req.params, query: req.query, body: req.body });
  },
);
app.use(globalErrorHandler);

describe("validate()", () => {
  it("replaces params, query and body with parsed data and strips unknown keys", async () => {
    const id = crypto.randomUUID();
    const res = await request(app)
      .post(`/items/${id}?page=2`)
      .send({ name: "x", userId: "evil" })
      .expect(200);
    expect(res.body).toEqual({ params: { id }, query: { page: 2 }, body: { name: "x" } });
  });

  it("responds 422 with field errors", async () => {
    const res = await request(app).post("/items/not-a-uuid").send({ name: "x" }).expect(422);
    expect(res.body.error.errors.fieldErrors.id).toBeDefined();
  });
});
```

- [ ] **Step 7: Run it to verify it fails**

Run: `pnpm --filter @clickup/api test -- validate`
Expected: FAIL, because `validate.middleware.js` cannot be found.

- [ ] **Step 8: Implement `apps/api/src/lib/middlewares/validate.middleware.ts`**

```ts
import type { NextFunction, Request, Response } from "express";
import { z, type ZodType } from "zod";
import { ValidationError } from "../errors/index.js";

type RequestSchemas = { params?: ZodType; query?: ZodType; body?: ZodType };

export const validate =
  (schemas: RequestSchemas) => (req: Request, _res: Response, next: NextFunction) => {
    for (const part of ["params", "query", "body"] as const) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part]);
      if (!result.success)
        return next(new ValidationError(`Invalid request ${part}`, z.flattenError(result.error)));

      // Express 5 defines req.query as a getter, so redefine the property on this request.
      Object.defineProperty(req, part, {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }
    next();
  };
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `pnpm --filter @clickup/api test`
Expected: PASS (5 tests).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(shared): zod request schemas package; api validate() middleware

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Status model + indexes migration

**Files:**
- Modify: `apps/api/prisma/schema.prisma`, `apps/api/src/consts/status.const.ts`
- Create: `apps/api/prisma/migrations/<timestamp>_status_type_and_indexes/migration.sql` (generated, then edited)
- Test: `apps/api/test/schema.test.ts`

**Interfaces:**
- Produces: `Status.type: "open" | "active" | "done"` and `Status.isDefault: boolean` on every status JSON. These are additive, so web ignores them until A4.
- Produces (consts): `HIGHEST_ORDER = 100000`; `DEFAULT_STATUS` entries now include `type` and `isDefault`; new `defaultStatusesFor(userId)` returns the createMany rows.

- [ ] **Step 1: Write the failing test**

`apps/api/test/schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { defaultStatusesFor } from "../src/consts/status.const.js";

async function seedTask() {
  const user = await prisma.user.create({ data: { role: "guest" } });
  const avatar = await prisma.avatar.create({ data: { icon: "circleDotted", color: "violet" } });
  const workspace = await prisma.workspace.create({ data: { name: "W", userId: user.id, avatarId: avatar.id } });
  const list = await prisma.list.create({
    data: {
      name: "L",
      userId: user.id,
      workspaceId: workspace.id,
      status: { createMany: { data: defaultStatusesFor(user.id) } },
    },
    include: { status: true },
  });
  const open = list.status.find((s) => s.type === "open")!;
  const task = await prisma.task.create({
    data: { name: "T", userId: user.id, listId: list.id, statusId: open.id },
  });
  return { list, open, task };
}

describe("status model", () => {
  it("default statuses are one open, one active and one done, all marked default", async () => {
    const { list } = await seedTask();
    const shape = list.status
      .sort((a, b) => a.order - b.order)
      .map((s) => [s.order, s.type, s.isDefault]);
    expect(shape).toEqual([
      [100, "open", true],
      [200, "active", true],
      [100000, "done", true],
    ]);
  });

  it("the database refuses to delete a status that still has tasks", async () => {
    const { open, task } = await seedTask();
    await expect(prisma.status.delete({ where: { id: open.id } })).rejects.toThrow();
    expect(await prisma.task.findUnique({ where: { id: task.id } })).not.toBeNull();
  });

  it("deleting a list still removes its statuses and tasks", async () => {
    const { list } = await seedTask();
    await prisma.list.delete({ where: { id: list.id } });
    expect(await prisma.status.count({ where: { listId: list.id } })).toBe(0);
    expect(await prisma.task.count({ where: { listId: list.id } })).toBe(0);
  });
});
```

(Test files import `prisma` directly; that is allowed for tests per Global Constraints.)

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @clickup/api test -- schema`
Expected: FAIL. `defaultStatusesFor` is not exported, and TypeScript/runtime errors appear on `type`.

- [ ] **Step 3: Edit `apps/api/prisma/schema.prisma`**

Add the enum under `enum Priority`:

```prisma
enum StatusType {
  open
  active
  done
}
```

In `model Status`, add two fields after `order Int`, plus an index before the closing brace, next to `@@unique([listId, name])`:

```prisma
  type      StatusType @default(active)
  isDefault Boolean    @default(false)
```

```prisma
  @@index([userId])
```

In `model Task`, change the `status` relation and add indexes:

```prisma
  status Status @relation(fields: [statusId], references: [id], onDelete: NoAction)
```

```prisma
  @@index([listId])
  @@index([statusId])
  @@index([userId])
```

In `model List`, **delete** `@@unique([id, userId])` and add:

```prisma
  @@index([workspaceId])
  @@index([userId])
```

In `model Workspace`, add:

```prisma
  @@index([userId])
```

- [ ] **Step 4: Generate the migration against a local database**

In one terminal: `pnpm --filter @clickup/api db:local` (leave it running).
In another:

```bash
cd apps/api
export DATABASE_URL=postgresql://postgres:postgres@localhost:54329/clickup DIRECT_URL=postgresql://postgres:postgres@localhost:54329/clickup
pnpm exec prisma migrate deploy
pnpm exec prisma migrate dev --create-only --name status_type_and_indexes
```

Expected: `Prisma Migration created: prisma/migrations/<timestamp>_status_type_and_indexes/migration.sql`.

- [ ] **Step 5: Add the backfill and compare the SQL**

Open the generated `migration.sql`. Directly **after** the `ALTER TABLE "Status" ADD COLUMN ...` statement, insert:

```sql
-- Backfill: every list was created with these three built-in statuses.
UPDATE "Status" SET "type" = 'open', "isDefault" = true WHERE "order" = 100;
UPDATE "Status" SET "isDefault" = true WHERE "order" = 200;
UPDATE "Status" SET "type" = 'done', "isDefault" = true WHERE "order" = 100000;
```

The final file must contain these statements; Prisma's ordering and comments may differ:

```sql
CREATE TYPE "StatusType" AS ENUM ('open', 'active', 'done');
ALTER TABLE "Task" DROP CONSTRAINT "Task_statusId_fkey";
DROP INDEX "List_id_userId_key";
ALTER TABLE "Status" ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "type" "StatusType" NOT NULL DEFAULT 'active';
-- (the three UPDATE lines above)
CREATE INDEX "List_workspaceId_idx" ON "List"("workspaceId");
CREATE INDEX "List_userId_idx" ON "List"("userId");
CREATE INDEX "Status_userId_idx" ON "Status"("userId");
CREATE INDEX "Task_listId_idx" ON "Task"("listId");
CREATE INDEX "Task_statusId_idx" ON "Task"("statusId");
CREATE INDEX "Task_userId_idx" ON "Task"("userId");
CREATE INDEX "Workspace_userId_idx" ON "Workspace"("userId");
ALTER TABLE "Task" ADD CONSTRAINT "Task_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
```

`NO ACTION` (not `RESTRICT`) is deliberate. It is checked at the end of the statement, so deleting a whole list, which cascades to both its statuses and its tasks, still works. Deleting a single status that has tasks fails.

Apply it and check for drift:

```bash
pnpm exec prisma migrate deploy
pnpm exec prisma migrate dev --create-only --name drift_check
```

Expected: the second command reports that it is already in sync and creates **no** new folder. If it does create a `drift_check` folder, delete that folder and reconcile `schema.prisma` with the SQL.

- [ ] **Step 6: Update `apps/api/src/consts/status.const.ts`**

```ts
export const HIGHEST_ORDER = 100000;

export const DEFAULT_STATUS = [
  {
    name: "to do",
    icon: "circleDotted",
    iconColor: "neutral",
    bgColor: "neutral",
    order: 100,
    type: "open",
    isDefault: true,
  },
  {
    name: "in progress",
    icon: "inProgress",
    iconColor: "violet",
    bgColor: "violet",
    order: 200,
    type: "active",
    isDefault: true,
  },
  {
    name: "complete",
    icon: "complete",
    iconColor: "emerald",
    bgColor: "emerald",
    order: HIGHEST_ORDER,
    type: "done",
    isDefault: true,
  },
] as const;

/** Rows for `status: { createMany: { data } }` when creating a list. */
export const defaultStatusesFor = (userId: string) =>
  DEFAULT_STATUS.map((status) => ({ ...status, userId }));
```

The existing controllers spread `DEFAULT_STATUS` with `userId` and still compile. `pnpm exec prisma generate` ran as part of `migrate dev`. If typecheck reports stale client types, run it again.

- [ ] **Step 7: Run all API tests and typecheck**

Run: `pnpm --filter @clickup/api test && pnpm --filter @clickup/api typecheck`
Expected: PASS (8 tests), typecheck exit 0.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(api): status type/isDefault, never cascade-delete tasks, FK indexes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Auth hardening (users routes, rate limits, helmet, error handler)

**Files:**
- Create: `apps/api/src/services/user.service.ts`, `apps/api/src/lib/middlewares/rateLimit.middleware.ts`, `apps/api/test/auth.test.ts`
- Modify (replace): `apps/api/src/controllers/user.controller.ts`, `apps/api/src/routes/user.routes.ts`, `apps/api/src/lib/middlewares/error.middleware.ts`, `apps/api/src/consts/auth.const.ts`
- Modify: `apps/api/src/app.ts`

**Interfaces:**
- Consumes: `validate`; `registerSchema`, `loginSchema`, `updateMeSchema`; `env`.
- Produces (`user.service`):
  - `registerUser(input: RegisterInput): Promise<PublicUser>`
  - `registerGuest(): Promise<PublicUser>`
  - `verifyCredentials(input: LoginInput): Promise<PublicUser>`
  - `getMe(userId: string): Promise<PublicUser>`
  - `updateMe(userId: string, input: UpdateMeInput): Promise<PublicUser>`
  - `PublicUser = { id, role, name, email, hasOnBoarded, createdAt, updatedAt }`
- Produces (limiters): `loginLimiter`, `registerLimiter`, `guestLimiter`, each an express `RequestHandler`.

- [ ] **Step 1: Write the failing tests**

`apps/api/test/auth.test.ts`:

```ts
import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { api, signUp } from "./helpers.js";

describe("auth", () => {
  it("register returns the user without a password hash, plus a 7-day token", async () => {
    const { user, token } = await signUp();
    expect(user).not.toHaveProperty("password");
    const decoded = jwt.decode(token) as { exp: number; iat: number; role: string };
    expect(decoded.role).toBe("user");
    expect(decoded.exp - decoded.iat).toBe(7 * 24 * 60 * 60);
  });

  it("register validates input", async () => {
    const res = await api()
      .post("/api/users/register/user")
      .send({ name: "A", email: "not-an-email", password: "123" })
      .expect(422);
    expect(Object.keys(res.body.error.errors.fieldErrors).sort()).toEqual(["email", "name", "password"]);
  });

  it("register rejects a duplicate email", async () => {
    const { credentials } = await signUp();
    await api().post("/api/users/register/user").send(credentials).expect(409);
  });

  it("login gives the same 401 for unknown email and wrong password", async () => {
    const { credentials } = await signUp();
    const wrongPassword = await api()
      .post("/api/users/login")
      .send({ email: credentials.email, password: "nope-nope" })
      .expect(401);
    const unknownEmail = await api()
      .post("/api/users/login")
      .send({ email: "ghost@test.dev", password: "nope-nope" })
      .expect(401);
    expect(wrongPassword.body.error.message).toBe("Invalid email or password");
    expect(unknownEmail.body.error.message).toBe("Invalid email or password");
  });

  it("login succeeds with the right password", async () => {
    const { credentials } = await signUp();
    const res = await api()
      .post("/api/users/login")
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("login is rate limited per email after 10 attempts", async () => {
    const email = `limited-${Date.now()}@test.dev`;
    for (let i = 0; i < 10; i++)
      await api().post("/api/users/login").send({ email, password: "wrong" }).expect(401);
    const res = await api().post("/api/users/login").send({ email, password: "wrong" }).expect(429);
    expect(res.body.error.message).toBe("Too many attempts, please try again later");
  });

  it("guest registration sets exactly one cookie", async () => {
    const res = await api().post("/api/users/register/guest").expect(201);
    expect(res.body.user.role).toBe("guest");
    expect(res.headers["set-cookie"]).toHaveLength(1);
  });

  it("GET /api/users/:id no longer exposes other users", async () => {
    const a = await signUp();
    const b = await signUp();
    await api().get(`/api/users/${b.user.id}`).set("Cookie", a.cookie).expect(404);
  });

  it("GET /api/users requires a token", async () => {
    await api().get("/api/users").expect(401);
  });

  it("PATCH /api/users only accepts a boolean hasOnBoarded", async () => {
    const { cookie } = await signUp();
    await api().patch("/api/users").set("Cookie", cookie).send({ hasOnBoarded: "yes" }).expect(422);
    const res = await api()
      .patch("/api/users")
      .set("Cookie", cookie)
      .send({ hasOnBoarded: true, role: "guest" })
      .expect(200);
    expect(res.body).toMatchObject({ hasOnBoarded: true, role: "user" });
  });

  it("sends security headers", async () => {
    const res = await api().get("/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("answers malformed JSON with 400, not 500", async () => {
    await api()
      .post("/api/users/login")
      .set("Content-Type", "application/json")
      .send("{bad json")
      .expect(400);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @clickup/api test -- auth`
Expected: several failures: the token lifetime is 90d, validation returns 500/400, login returns 404/406, `/users/:id` returns 200, there are 2 cookies, and there is no nosniff header.

- [ ] **Step 3: Create `apps/api/src/services/user.service.ts`**

```ts
import bcrypt from "bcrypt";
import type { LoginInput, RegisterInput, UpdateMeInput } from "@clickup/shared";
import { prisma } from "../lib/prisma.js";
import { ConflictError, NotFoundError, UnauthorizedError } from "../lib/errors/index.js";

const publicUser = {
  id: true,
  role: true,
  name: true,
  email: true,
  hasOnBoarded: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function registerUser({ name, email, password }: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new ConflictError("Email already exists");

  const hashedPassword = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: { name, email, password: hashedPassword, role: "user" },
    select: publicUser,
  });
}

export function registerGuest() {
  return prisma.user.create({ data: { role: "guest" }, select: publicUser });
}

export async function verifyCredentials({ email, password }: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email } });
  const isValid = user?.password ? await bcrypt.compare(password, user.password) : false;
  // One message for both cases, so the endpoint does not reveal which emails exist.
  if (!user || !isValid) throw new UnauthorizedError("Invalid email or password");

  const { password: _password, ...rest } = user;
  return rest;
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUser });
  if (!user) throw new NotFoundError("User not found");
  return user;
}

export function updateMe(userId: string, { hasOnBoarded }: UpdateMeInput) {
  return prisma.user.update({ where: { id: userId }, data: { hasOnBoarded }, select: publicUser });
}
```

- [ ] **Step 4: Create `apps/api/src/lib/middlewares/rateLimit.middleware.ts`**

```ts
import type { NextFunction, Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import { AppError } from "../errors/appError.js";
import { env } from "../../config/env.js";

// Every request reaches the API from the web app's server, so all requests share one IP.
// Limits are therefore keyed by email, or global for anonymous guest sign-ups (spec §0.3).

const handler = (_req: Request, _res: Response, next: NextFunction) =>
  next(new AppError("Too many attempts, please try again later", 429));

const emailKey = (req: Request) =>
  String(req.body?.email ?? "").trim().toLowerCase() || "missing-email";

const shared = {
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler,
  validate: { xForwardedForHeader: false },
} as const;

export const loginLimiter = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  limit: env.LOGIN_ATTEMPTS_PER_15_MIN,
  keyGenerator: emailKey,
});

export const registerLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 60 * 1000,
  limit: 5,
  keyGenerator: emailKey,
});

export const guestLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 1000,
  limit: env.GUEST_SIGNUPS_PER_MINUTE,
  keyGenerator: () => "all-guests",
});
```

- [ ] **Step 5: Replace `apps/api/src/controllers/user.controller.ts`**

```ts
import type { Request, Response } from "express";
import type { LoginInput, RegisterInput, UpdateMeInput } from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import { generateToken, type UserRole } from "../lib/middlewares/auth.middleware.js";
import { COOKIES_OPTIONS } from "../consts/auth.const.js";
import * as userService from "../services/user.service.js";

function sendSession(res: Response, status: number, user: { id: string; role: UserRole }) {
  const token = generateToken(user.id, user.role);
  res.cookie("token", token, COOKIES_OPTIONS);
  // The web app's server reads the token from the body and sets its own cookie (spec §0.1).
  res.status(status).json({ user, token });
}

export const registerUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.registerUser(req.body as RegisterInput);
  sendSession(res, 201, user);
});

export const registerGuest = catchAsync(async (_req: Request, res: Response) => {
  const user = await userService.registerGuest();
  sendSession(res, 201, user);
});

export const loginUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.verifyCredentials(req.body as LoginInput);
  sendSession(res, 200, user);
});

export const getUser = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json(await userService.getMe(req.userId));
});

export const updateUser = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json(await userService.updateMe(req.userId, req.body as UpdateMeInput));
});
```

- [ ] **Step 6: Replace `apps/api/src/routes/user.routes.ts`**

```ts
import express from "express";
import { loginSchema, registerSchema, updateMeSchema } from "@clickup/shared";
import {
  getUser,
  loginUser,
  registerGuest,
  registerUser,
  updateUser,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";
import {
  guestLimiter,
  loginLimiter,
  registerLimiter,
} from "../lib/middlewares/rateLimit.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getUser);
router.post("/register/user", registerLimiter, validate({ body: registerSchema }), registerUser);
router.post("/register/guest", guestLimiter, registerGuest);
router.post("/login", loginLimiter, validate({ body: loginSchema }), loginUser);
router.patch("/", authMiddleware, validate({ body: updateMeSchema }), updateUser);

export default router;
```

- [ ] **Step 7: Set the 7-day cookie in `apps/api/src/consts/auth.const.ts`**

```ts
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000; // express res.cookie maxAge is in milliseconds

export const COOKIES_OPTIONS =
  process.env.NODE_ENV === "development"
    ? ({ httpOnly: true, secure: false, sameSite: "lax", maxAge: SEVEN_DAYS_MS } as const)
    : ({ httpOnly: true, secure: true, sameSite: "none", maxAge: SEVEN_DAYS_MS } as const);
```

- [ ] **Step 8: Replace `apps/api/src/lib/middlewares/error.middleware.ts`**

```ts
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/appError.js";
import { handlePrismaError } from "../errors/prismaErrorHandler.js";
import { Prisma } from "../../generated/prisma/client.js";

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    statusCode: number;
    errors?: unknown;
    stack?: string;
  };
}

const isPrismaError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError ||
  error instanceof Prisma.PrismaClientValidationError ||
  error instanceof Prisma.PrismaClientInitializationError ||
  error instanceof Prisma.PrismaClientUnknownRequestError;

const isMalformedJson = (error: unknown) =>
  error instanceof SyntaxError && "status" in error && error.status === 400;

export function globalErrorHandler(
  error: unknown,
  _req: Request,
  res: Response<ErrorResponse>,
  _next: NextFunction,
) {
  const isDev = process.env.NODE_ENV === "development";

  if (isMalformedJson(error))
    return res.status(400).json({
      success: false,
      error: { message: "Malformed JSON body", statusCode: 400 },
    });

  const appError =
    error instanceof AppError ? error : isPrismaError(error) ? handlePrismaError(error) : null;

  if (appError) {
    if (appError.statusCode >= 500) console.error(error);
    return res.status(appError.statusCode).json({
      success: false,
      error: {
        message: appError.message,
        statusCode: appError.statusCode,
        errors: (appError as AppError & { errors?: unknown }).errors,
        ...(isDev && { stack: appError.stack }),
      },
    });
  }

  console.error(error);
  const err = error as Error;
  return res.status(500).json({
    success: false,
    error: {
      message: isDev ? err.message : "Internal server error",
      statusCode: 500,
      ...(isDev && { stack: err.stack }),
    },
  });
}
```

- [ ] **Step 9: Add helmet, allow PATCH, and cap the body size in `apps/api/src/app.ts`**

Add `import helmet from "helmet";` with the other imports. Replace the `app.use(express.json());` line and the `cors(...)` block with:

```ts
app.use(helmet());
app.use(express.json({ limit: "100kb" }));

app.use(
  cors({
    origin: ["http://localhost:3000", "https://click-up-clone-two.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);
```

- [ ] **Step 10: Run all API tests**

Run: `pnpm --filter @clickup/api test && pnpm --filter @clickup/api typecheck`
Expected: PASS (all auth tests plus earlier ones), typecheck exit 0.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "fix(api): harden auth - validation, generic login error, email-keyed rate limits, helmet, 7d tokens

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Ownership checks + workspaces

**Files:**
- Create: `apps/api/src/services/access.service.ts`, `apps/api/src/services/workspace.service.ts`, `apps/api/test/workspaces.test.ts`
- Modify (replace): `apps/api/src/controllers/workspace.controller.ts`, `apps/api/src/routes/workspace.routes.ts`
- Modify: `apps/api/test/helpers.ts` (add `seedWorkspace`)

**Interfaces:**
- Produces (`access.service`):
  - `type AccessTarget = { workspaceId: string } | { listId: string } | { statusId: string } | { taskId: string }`
  - `assertCanAccess(userId: string, target: AccessTarget): Promise<void>`, which throws `NotFoundError("<Entity> not found")`.
  - `assertStatusInList(userId: string, statusId: string, listId: string): Promise<void>`, which throws a 422 `ValidationError("Status does not belong to this list")`.
- Produces (`workspace.service`):
  - `listWorkspaces(userId)`, `countWorkspaces(userId)`, `getWorkspace(userId, id)`
  - `createWorkspace(userId, input)`, `updateWorkspace(userId, id, input)`, `deleteWorkspace(userId, id)`
  - `createWorkspaceFlow(userId, input: CreateWorkspaceFlowInput)`
- Produces (helpers): `seedWorkspace(cookie) → Promise<{ workspace, list, statuses, openStatus, doneStatus }>`.

- [ ] **Step 1: Add `seedWorkspace` to `apps/api/test/helpers.ts`**

Append:

```ts
type StatusJson = { id: string; name: string; type: "open" | "active" | "done"; order: number };

export async function seedWorkspace(cookie: string, name = "Engineering") {
  const workspace = await api()
    .post("/api/workspaces")
    .set("Cookie", cookie)
    .send({ name, avatar: { icon: "circleDotted", color: "violet" } })
    .expect(201);
  const list = await api()
    .post("/api/lists")
    .set("Cookie", cookie)
    .send({ name: "Sprint 1", workspaceId: workspace.body.id })
    .expect(201);
  const statuses = list.body.status as StatusJson[];
  return {
    workspace: workspace.body as { id: string; avatarId: string },
    list: list.body as { id: string; workspaceId: string },
    statuses,
    openStatus: statuses.find((s) => s.type === "open")!,
    doneStatus: statuses.find((s) => s.type === "done")!,
  };
}
```

- [ ] **Step 2: Write the failing tests**

`apps/api/test/workspaces.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { api, seedWorkspace, signUp } from "./helpers.js";

const avatar = { icon: "circleDotted", color: "violet" };

describe("workspaces", () => {
  it("lists only the caller's workspaces, and count=true returns a number", async () => {
    const a = await signUp();
    const b = await signUp();
    await seedWorkspace(a.cookie, "A-space");
    await seedWorkspace(b.cookie, "B-space");

    const res = await api().get("/api/workspaces").set("Cookie", a.cookie).expect(200);
    expect(res.body.map((w: { name: string }) => w.name)).toEqual(["A-space"]);
    expect(res.body[0].avatar).toMatchObject(avatar);

    const count = await api().get("/api/workspaces?count=true").set("Cookie", a.cookie).expect(200);
    expect(count.body).toBe(1);
  });

  it("GET /:id is 404 for another user's or a missing workspace, and 422 for a bad id", async () => {
    const a = await signUp();
    const b = await signUp();
    const { workspace } = await seedWorkspace(b.cookie);
    await api().get(`/api/workspaces/${workspace.id}`).set("Cookie", a.cookie).expect(404);
    await api().get(`/api/workspaces/${crypto.randomUUID()}`).set("Cookie", a.cookie).expect(404);
    await api().get("/api/workspaces/abc").set("Cookie", a.cookie).expect(422);
  });

  it("PATCH ignores userId/avatarId in the body (mass assignment)", async () => {
    const a = await signUp();
    const b = await signUp();
    const { workspace } = await seedWorkspace(a.cookie);

    const res = await api()
      .patch(`/api/workspaces/${workspace.id}`)
      .set("Cookie", a.cookie)
      .send({ name: "Renamed", userId: b.user.id, avatarId: crypto.randomUUID(), avatar: { color: "sky" } })
      .expect(200);

    expect(res.body).toMatchObject({ name: "Renamed", avatar: { icon: "circleDotted", color: "sky" } });
    const row = await prisma.workspace.findUniqueOrThrow({ where: { id: workspace.id } });
    expect(row.userId).toBe(a.user.id);
    expect(row.avatarId).toBe(workspace.avatarId);
  });

  it("PATCH and DELETE on another user's workspace are 404", async () => {
    const a = await signUp();
    const b = await signUp();
    const { workspace } = await seedWorkspace(b.cookie);
    await api().patch(`/api/workspaces/${workspace.id}`).set("Cookie", a.cookie).send({ name: "x" }).expect(404);
    await api().delete(`/api/workspaces/${workspace.id}`).set("Cookie", a.cookie).expect(404);
  });

  it("DELETE removes the workspace, its avatar, lists and tasks", async () => {
    const a = await signUp();
    const { workspace, list } = await seedWorkspace(a.cookie);
    await api().delete(`/api/workspaces/${workspace.id}`).set("Cookie", a.cookie).expect(204);
    expect(await prisma.workspace.count()).toBe(0);
    expect(await prisma.avatar.count({ where: { id: workspace.avatarId } })).toBe(0);
    expect(await prisma.list.count({ where: { id: list.id } })).toBe(0);
  });

  it("POST /flow creates workspace, list, 3 defaults + 1 custom status and a task, owned by the caller", async () => {
    const a = await signUp();
    const b = await signUp();
    const res = await api()
      .post("/api/workspaces/flow")
      .set("Cookie", a.cookie)
      .send({
        data: {
          workspace: { name: "Eng", avatar },
          list: { name: "Sprint", userId: b.user.id },
          status: { name: "review", icon: "inProgress", iconColor: "sky", bgColor: "sky" },
          task: { name: "First task", priority: "high", userId: b.user.id },
        },
      })
      .expect(201);

    expect(res.body.task).toMatchObject({ name: "First task", priority: "high", userId: a.user.id });
    expect(res.body.task.status).toMatchObject({ name: "review", type: "active", order: 300 });
    expect(res.body.list.userId).toBe(a.user.id);
    expect(await prisma.status.count({ where: { listId: res.body.list.id } })).toBe(4);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `pnpm --filter @clickup/api test -- workspaces`
Expected: failures. `GET /:id` of another user's workspace returns `200 null`; PATCH of B's workspace returns 404 through Prisma but a bad id gives 500/422 inconsistently; the flow test has `userId` overridden to B.

- [ ] **Step 4: Create `apps/api/src/services/access.service.ts`**

```ts
import { prisma } from "../lib/prisma.js";
import { NotFoundError, ValidationError } from "../lib/errors/index.js";

export type AccessTarget =
  | { workspaceId: string }
  | { listId: string }
  | { statusId: string }
  | { taskId: string };

/**
 * Throws 404 unless `userId` may access the target. Not-owned and missing look the same,
 * so IDs from other accounts are not revealed. Spec B re-implements this for workspace
 * membership + roles; callers do not change.
 */
export async function assertCanAccess(userId: string, target: AccessTarget): Promise<void> {
  let entity: string;
  let count: number;

  if ("workspaceId" in target) {
    entity = "Workspace";
    count = await prisma.workspace.count({ where: { id: target.workspaceId, userId } });
  } else if ("listId" in target) {
    entity = "List";
    count = await prisma.list.count({ where: { id: target.listId, userId } });
  } else if ("statusId" in target) {
    entity = "Status";
    count = await prisma.status.count({ where: { id: target.statusId, userId } });
  } else {
    entity = "Task";
    count = await prisma.task.count({ where: { id: target.taskId, userId } });
  }

  if (count === 0) throw new NotFoundError(`${entity} not found`);
}

/** A task's status must come from the same list as the task. */
export async function assertStatusInList(userId: string, statusId: string, listId: string) {
  const count = await prisma.status.count({ where: { id: statusId, listId, userId } });
  if (count === 0)
    throw new ValidationError("Status does not belong to this list", {
      formErrors: [],
      fieldErrors: { statusId: ["Status does not belong to this list"] },
    });
}
```

- [ ] **Step 5: Create `apps/api/src/services/workspace.service.ts`**

```ts
import type {
  CreateWorkspaceFlowInput,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from "@clickup/shared";
import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../lib/errors/index.js";
import { defaultStatusesFor } from "../consts/status.const.js";
import { assertCanAccess } from "./access.service.js";

const withAvatar = { avatar: true } as const;

export function listWorkspaces(userId: string) {
  return prisma.workspace.findMany({
    where: { userId },
    include: withAvatar,
    orderBy: { createdAt: "asc" },
  });
}

export function countWorkspaces(userId: string) {
  return prisma.workspace.count({ where: { userId } });
}

export async function getWorkspace(userId: string, id: string) {
  const workspace = await prisma.workspace.findFirst({ where: { id, userId }, include: withAvatar });
  if (!workspace) throw new NotFoundError("Workspace not found");
  return workspace;
}

export function createWorkspace(userId: string, { name, avatar }: CreateWorkspaceInput) {
  return prisma.workspace.create({
    data: { name, user: { connect: { id: userId } }, avatar: { create: avatar } },
    include: withAvatar,
  });
}

export async function updateWorkspace(userId: string, id: string, { name, avatar }: UpdateWorkspaceInput) {
  await assertCanAccess(userId, { workspaceId: id });
  return prisma.workspace.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(avatar && { avatar: { update: avatar } }),
    },
    include: withAvatar,
  });
}

export async function deleteWorkspace(userId: string, id: string) {
  const workspace = await getWorkspace(userId, id);
  // Sequential: the workspace row references the avatar (ON DELETE RESTRICT).
  await prisma.$transaction([
    prisma.workspace.delete({ where: { id } }),
    prisma.avatar.delete({ where: { id: workspace.avatarId } }),
  ]);
}

export function createWorkspaceFlow(userId: string, { data }: CreateWorkspaceFlowInput) {
  const { workspace, list, status, task } = data;

  return prisma.$transaction(async (tx) => {
    const createdAvatar = await tx.avatar.create({ data: workspace.avatar });

    const createdWorkspace = await tx.workspace.create({
      data: { name: workspace.name, userId, avatarId: createdAvatar.id },
      include: withAvatar,
    });

    const createdList = await tx.list.create({
      data: {
        name: list.name,
        userId,
        workspaceId: createdWorkspace.id,
        status: { createMany: { data: defaultStatusesFor(userId) } },
      },
    });

    const createdStatus = await tx.status.create({
      data: { ...status, userId, listId: createdList.id, order: 300, type: "active" },
    });

    const createdTask = await tx.task.create({
      data: {
        name: task.name,
        priority: task.priority,
        startDate: task.startDate,
        endDate: task.endDate,
        userId,
        listId: createdList.id,
        statusId: createdStatus.id,
      },
      include: { status: true },
    });

    return { workspace: createdWorkspace, list: createdList, status: createdStatus, task: createdTask };
  });
}
```

- [ ] **Step 6: Replace `apps/api/src/controllers/workspace.controller.ts`**

```ts
import type { Request, Response } from "express";
import type {
  CreateWorkspaceFlowInput,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import * as workspaceService from "../services/workspace.service.js";

type IdParams = { id: string };

export const createWorkspace = catchAsync(async (req: Request, res: Response) => {
  res.status(201).json(await workspaceService.createWorkspace(req.userId, req.body as CreateWorkspaceInput));
});

export const createWorkspaceFlow = catchAsync(async (req: Request, res: Response) => {
  res
    .status(201)
    .json(await workspaceService.createWorkspaceFlow(req.userId, req.body as CreateWorkspaceFlowInput));
});

export const getWorkspaces = catchAsync(async (req: Request, res: Response) => {
  if (req.query.count === "true")
    return res.status(200).json(await workspaceService.countWorkspaces(req.userId));
  res.status(200).json(await workspaceService.listWorkspaces(req.userId));
});

export const getWorkspace = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as IdParams;
  res.status(200).json(await workspaceService.getWorkspace(req.userId, id));
});

export const updateWorkspace = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as IdParams;
  res
    .status(200)
    .json(await workspaceService.updateWorkspace(req.userId, id, req.body as UpdateWorkspaceInput));
});

export const deleteWorkspace = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as IdParams;
  await workspaceService.deleteWorkspace(req.userId, id);
  res.status(204).send();
});
```

- [ ] **Step 7: Replace `apps/api/src/routes/workspace.routes.ts`**

```ts
import express from "express";
import {
  countQuerySchema,
  createWorkspaceFlowSchema,
  createWorkspaceSchema,
  idParamsSchema,
  updateWorkspaceSchema,
} from "@clickup/shared";
import {
  createWorkspace,
  createWorkspaceFlow,
  deleteWorkspace,
  getWorkspace,
  getWorkspaces,
  updateWorkspace,
} from "../controllers/workspace.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", validate({ body: createWorkspaceSchema }), createWorkspace);
router.post("/flow", validate({ body: createWorkspaceFlowSchema }), createWorkspaceFlow);
router.get("/", validate({ query: countQuerySchema }), getWorkspaces);
router.get("/:id", validate({ params: idParamsSchema }), getWorkspace);
router.patch("/:id", validate({ params: idParamsSchema, body: updateWorkspaceSchema }), updateWorkspace);
router.delete("/:id", validate({ params: idParamsSchema }), deleteWorkspace);

export default router;
```

- [ ] **Step 8: Run all API tests**

Run: `pnpm --filter @clickup/api test && pnpm --filter @clickup/api typecheck`
Expected: PASS. `seedWorkspace` creates lists through the old list controller, which still works; the `type`/`isDefault` columns come from the defaults.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "fix(api): workspace service with ownership checks, no mass assignment, transactional delete

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Lists

**Files:**
- Create: `apps/api/src/services/list.service.ts`, `apps/api/test/lists.test.ts`
- Modify (replace): `apps/api/src/controllers/list.controller.ts`, `apps/api/src/routes/list.routes.ts`

**Interfaces:**
- Consumes: `assertCanAccess`, `defaultStatusesFor`.
- Produces (`list.service`):
  - `listLists(userId)`, `countLists(userId)`, `getList(userId, id)`
  - `getLatestList(userId) → { id, name, workspaceId } | null`
  - `listWorkspaceLists(userId, workspaceId)`, `isListInWorkspace(userId, listId, workspaceId): Promise<boolean>`
  - `createList(userId, input)`, which returns the list with a `status` array sorted by order.
  - `updateList(userId, id, input)`, `deleteList(userId, id)`

- [ ] **Step 1: Write the failing tests**

`apps/api/test/lists.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { api, seedWorkspace, signUp } from "./helpers.js";

describe("lists", () => {
  it("creates a list with open/active/done default statuses in order", async () => {
    const a = await signUp();
    const { list, statuses } = await seedWorkspace(a.cookie);
    expect(list.workspaceId).toBeDefined();
    expect(statuses.map((s) => [s.name, s.type])).toEqual([
      ["to do", "open"],
      ["in progress", "active"],
      ["complete", "done"],
    ]);
  });

  it("refuses to create a list in another user's workspace", async () => {
    const a = await signUp();
    const b = await signUp();
    const { workspace } = await seedWorkspace(b.cookie);
    await api()
      .post("/api/lists")
      .set("Cookie", a.cookie)
      .send({ name: "sneaky", workspaceId: workspace.id })
      .expect(404);
    expect(await prisma.list.count({ where: { workspaceId: workspace.id } })).toBe(1);
  });

  it("PATCH renames but never moves a list to another workspace", async () => {
    const a = await signUp();
    const b = await signUp();
    const { list } = await seedWorkspace(a.cookie);
    const other = await seedWorkspace(b.cookie);
    const res = await api()
      .patch(`/api/lists/${list.id}`)
      .set("Cookie", a.cookie)
      .send({ name: "Renamed", workspaceId: other.workspace.id, userId: b.user.id })
      .expect(200);
    expect(res.body).toMatchObject({ name: "Renamed", workspaceId: list.workspaceId, userId: a.user.id });
  });

  it("another user's list is 404 for read, update, delete and workspace listing", async () => {
    const a = await signUp();
    const b = await signUp();
    const { list, workspace } = await seedWorkspace(b.cookie);
    await api().get(`/api/lists/${list.id}`).set("Cookie", a.cookie).expect(404);
    await api().patch(`/api/lists/${list.id}`).set("Cookie", a.cookie).send({ name: "x" }).expect(404);
    await api().delete(`/api/lists/${list.id}`).set("Cookie", a.cookie).expect(404);
    await api().get(`/api/lists/workspace/${workspace.id}`).set("Cookie", a.cookie).expect(404);
  });

  it("/latest returns a fixed shape and ignores ?select=", async () => {
    const a = await signUp();
    const { list } = await seedWorkspace(a.cookie);
    const res = await api().get("/api/lists/latest?select=user").set("Cookie", a.cookie).expect(200);
    expect(res.body).toEqual({ id: list.id, name: "Sprint 1", workspaceId: list.workspaceId });
  });

  it("count, workspace listing and belong-to", async () => {
    const a = await signUp();
    const { list, workspace } = await seedWorkspace(a.cookie);
    const other = await seedWorkspace(a.cookie, "Second");
    expect((await api().get("/api/lists?count=true").set("Cookie", a.cookie)).body).toBe(2);
    const inWorkspace = await api().get(`/api/lists/workspace/${workspace.id}`).set("Cookie", a.cookie);
    expect(inWorkspace.body.map((l: { id: string }) => l.id)).toEqual([list.id]);
    const yes = await api().get(`/api/lists/${list.id}/belong-to/${workspace.id}`).set("Cookie", a.cookie);
    const no = await api().get(`/api/lists/${list.id}/belong-to/${other.workspace.id}`).set("Cookie", a.cookie);
    expect([yes.body, no.body]).toEqual([true, false]);
  });

  it("DELETE removes the list and its tasks", async () => {
    const a = await signUp();
    const { list } = await seedWorkspace(a.cookie);
    await api().delete(`/api/lists/${list.id}`).set("Cookie", a.cookie).expect(200);
    expect(await prisma.list.count({ where: { id: list.id } })).toBe(0);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @clickup/api test -- lists`
Expected: failures. The list gets created in B's workspace, PATCH moves the workspace, GET of another user's list returns `200 null`, and `/latest?select=user` returns `{ user: {...} }`.

- [ ] **Step 3: Create `apps/api/src/services/list.service.ts`**

```ts
import type { CreateListInput, UpdateListInput } from "@clickup/shared";
import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../lib/errors/index.js";
import { defaultStatusesFor } from "../consts/status.const.js";
import { assertCanAccess } from "./access.service.js";

export function listLists(userId: string) {
  return prisma.list.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
}

export function countLists(userId: string) {
  return prisma.list.count({ where: { userId } });
}

export async function getList(userId: string, id: string) {
  const list = await prisma.list.findFirst({ where: { id, userId } });
  if (!list) throw new NotFoundError("List not found");
  return list;
}

export function getLatestList(userId: string) {
  return prisma.list.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, workspaceId: true },
  });
}

export async function listWorkspaceLists(userId: string, workspaceId: string) {
  await assertCanAccess(userId, { workspaceId });
  return prisma.list.findMany({ where: { workspaceId, userId }, orderBy: { createdAt: "asc" } });
}

export async function isListInWorkspace(userId: string, listId: string, workspaceId: string) {
  return (await prisma.list.count({ where: { id: listId, workspaceId, userId } })) > 0;
}

export async function createList(userId: string, { name, workspaceId }: CreateListInput) {
  await assertCanAccess(userId, { workspaceId });
  return prisma.list.create({
    data: {
      name,
      workspaceId,
      userId,
      status: { createMany: { data: defaultStatusesFor(userId) } },
    },
    include: { status: { orderBy: { order: "asc" } } },
  });
}

export async function updateList(userId: string, id: string, { name }: UpdateListInput) {
  await assertCanAccess(userId, { listId: id });
  return prisma.list.update({ where: { id }, data: { ...(name !== undefined && { name }) } });
}

export async function deleteList(userId: string, id: string) {
  await assertCanAccess(userId, { listId: id });
  await prisma.list.delete({ where: { id } });
}
```

- [ ] **Step 4: Replace `apps/api/src/controllers/list.controller.ts`**

```ts
import type { Request, Response } from "express";
import type { CreateListInput, UpdateListInput } from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import * as listService from "../services/list.service.js";

export const createList = catchAsync(async (req: Request, res: Response) => {
  res.status(201).json(await listService.createList(req.userId, req.body as CreateListInput));
});

export const getLists = catchAsync(async (req: Request, res: Response) => {
  if (req.query.count === "true") return res.status(200).json(await listService.countLists(req.userId));
  res.status(200).json(await listService.listLists(req.userId));
});

export const getList = catchAsync(async (req: Request, res: Response) => {
  const { listId } = req.params as { listId: string };
  res.status(200).json(await listService.getList(req.userId, listId));
});

export const getLatestList = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json(await listService.getLatestList(req.userId));
});

export const getListsByWorkspace = catchAsync(async (req: Request, res: Response) => {
  const { workspaceId } = req.params as { workspaceId: string };
  res.status(200).json(await listService.listWorkspaceLists(req.userId, workspaceId));
});

export const checkListOwnership = catchAsync(async (req: Request, res: Response) => {
  const { listId, workspaceId } = req.params as { listId: string; workspaceId: string };
  res.status(200).json(await listService.isListInWorkspace(req.userId, listId, workspaceId));
});

export const updateList = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await listService.updateList(req.userId, id, req.body as UpdateListInput));
});

export const deleteList = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await listService.deleteList(req.userId, id);
  res.status(200).json({ message: "List deleted successfully" });
});
```

- [ ] **Step 5: Replace `apps/api/src/routes/list.routes.ts`**

```ts
import express from "express";
import {
  countQuerySchema,
  createListSchema,
  idParamsSchema,
  listIdParamsSchema,
  listInWorkspaceParamsSchema,
  updateListSchema,
  workspaceIdParamsSchema,
} from "@clickup/shared";
import {
  checkListOwnership,
  createList,
  deleteList,
  getLatestList,
  getList,
  getLists,
  getListsByWorkspace,
  updateList,
} from "../controllers/list.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", validate({ query: countQuerySchema }), getLists);
router.get("/latest", getLatestList);
router.get("/workspace/:workspaceId", validate({ params: workspaceIdParamsSchema }), getListsByWorkspace);
router.get("/:listId", validate({ params: listIdParamsSchema }), getList);
router.get(
  "/:listId/belong-to/:workspaceId",
  validate({ params: listInWorkspaceParamsSchema }),
  checkListOwnership,
);
router.post("/", validate({ body: createListSchema }), createList);
router.patch("/:id", validate({ params: idParamsSchema, body: updateListSchema }), updateList);
router.delete("/:id", validate({ params: idParamsSchema }), deleteList);

export default router;
```

- [ ] **Step 6: Run all API tests**

Run: `pnpm --filter @clickup/api test && pnpm --filter @clickup/api typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "fix(api): list service with ownership checks; drop arbitrary ?select; 404 for missing

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Statuses (safe delete, rename, real task counts)

**Files:**
- Create: `apps/api/src/services/status.service.ts`, `apps/api/test/statuses.test.ts`
- Modify (replace): `apps/api/src/controllers/status.controller.ts`, `apps/api/src/routes/status.routes.ts`
- Modify: `apps/api/test/helpers.ts` (add `createTask`)

**Interfaces:**
- Produces (`status.service`):
  - `listStatuses(userId, listId)`, `createStatus(userId, input)`, `updateStatus(userId, id, input)`
  - `deleteStatus(userId, id) → deleted status & { movedTasksCount: number }`
  - `taskCountsByStatusName(userId) → { totalCount: number, [`${name}Count`]: number }`
- Produces (helpers): `createTask(cookie, { listId, statusId, name?, priority? }) → Promise<TaskJson>`.
- New endpoint: `PATCH /api/statuses/:id` with body `{ name?, icon?, iconColor?, bgColor? }`.

- [ ] **Step 1: Add `createTask` to `apps/api/test/helpers.ts`**

```ts
export async function createTask(
  cookie: string,
  input: { listId: string; statusId: string; name?: string; priority?: string },
) {
  const res = await api()
    .post("/api/tasks")
    .set("Cookie", cookie)
    .send({ name: "Task", ...input })
    .expect(201);
  return res.body as { id: string; listId: string; statusId: string; name: string };
}
```

- [ ] **Step 2: Write the failing tests**

`apps/api/test/statuses.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { api, createTask, seedWorkspace, signUp } from "./helpers.js";

const style = { icon: "inProgress", iconColor: "sky", bgColor: "sky" };

describe("statuses", () => {
  it("creates a custom active status after the last non-done status", async () => {
    const a = await signUp();
    const { list } = await seedWorkspace(a.cookie);
    const res = await api()
      .post("/api/statuses")
      .set("Cookie", a.cookie)
      .send({ name: "review", listId: list.id, ...style })
      .expect(201);
    expect(res.body).toMatchObject({ name: "review", type: "active", isDefault: false, order: 300 });
  });

  it("refuses to add a status to another user's list", async () => {
    const a = await signUp();
    const b = await signUp();
    const { list } = await seedWorkspace(b.cookie);
    await api()
      .post("/api/statuses")
      .set("Cookie", a.cookie)
      .send({ name: "x", listId: list.id, ...style })
      .expect(404);
  });

  it("renames a status and reports duplicate names as 409", async () => {
    const a = await signUp();
    const { openStatus } = await seedWorkspace(a.cookie);
    const res = await api()
      .patch(`/api/statuses/${openStatus.id}`)
      .set("Cookie", a.cookie)
      .send({ name: "backlog", iconColor: "sky", order: 5 })
      .expect(200);
    expect(res.body).toMatchObject({ name: "backlog", iconColor: "sky", order: 100 });
    await api()
      .patch(`/api/statuses/${openStatus.id}`)
      .set("Cookie", a.cookie)
      .send({ name: "complete" })
      .expect(409);
  });

  it("default statuses cannot be deleted", async () => {
    const a = await signUp();
    const { openStatus } = await seedWorkspace(a.cookie);
    await api().delete(`/api/statuses/${openStatus.id}`).set("Cookie", a.cookie).expect(403);
  });

  it("deleting a custom status moves its tasks to the open status instead of deleting them", async () => {
    const a = await signUp();
    const { list, openStatus } = await seedWorkspace(a.cookie);
    const custom = await api()
      .post("/api/statuses")
      .set("Cookie", a.cookie)
      .send({ name: "review", listId: list.id, ...style })
      .expect(201);
    const task = await createTask(a.cookie, { listId: list.id, statusId: custom.body.id });

    const res = await api().delete(`/api/statuses/${custom.body.id}`).set("Cookie", a.cookie).expect(200);

    expect(res.body).toMatchObject({ id: custom.body.id, movedTasksCount: 1 });
    const moved = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
    expect(moved.statusId).toBe(openStatus.id);
  });

  it("another user's status is 404 for rename and delete", async () => {
    const a = await signUp();
    const b = await signUp();
    const { list } = await seedWorkspace(b.cookie);
    const custom = await api()
      .post("/api/statuses")
      .set("Cookie", b.cookie)
      .send({ name: "review", listId: list.id, ...style })
      .expect(201);
    await api().patch(`/api/statuses/${custom.body.id}`).set("Cookie", a.cookie).send({ name: "x" }).expect(404);
    await api().delete(`/api/statuses/${custom.body.id}`).set("Cookie", a.cookie).expect(404);
  });

  it("GET /list/:listId is 404 for another user's list", async () => {
    const a = await signUp();
    const b = await signUp();
    const { list } = await seedWorkspace(b.cookie);
    await api().get(`/api/statuses/list/${list.id}`).set("Cookie", a.cookie).expect(404);
  });

  it("statusCounts counts tasks per status name", async () => {
    const a = await signUp();
    const { list, openStatus, doneStatus } = await seedWorkspace(a.cookie);
    await createTask(a.cookie, { listId: list.id, statusId: openStatus.id });
    await createTask(a.cookie, { listId: list.id, statusId: openStatus.id });
    await createTask(a.cookie, { listId: list.id, statusId: doneStatus.id });

    const res = await api().get("/api/statuses/statusCounts").set("Cookie", a.cookie).expect(200);
    expect(res.body).toEqual({
      totalCount: 3,
      "to doCount": 2,
      "in progressCount": 0,
      completeCount: 1,
    });
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `pnpm --filter @clickup/api test -- statuses`
Expected: failures. The status gets created in B's list, `PATCH` returns 404 (the route does not exist yet), `statusCounts` counts statuses, and deleting a custom status with tasks fails with 422 (the FK now blocks it) instead of moving the tasks.

- [ ] **Step 4: Create `apps/api/src/services/status.service.ts`**

```ts
import type { CreateStatusInput, UpdateStatusInput } from "@clickup/shared";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors/appError.js";
import { ForbiddenError, NotFoundError } from "../lib/errors/index.js";
import { assertCanAccess } from "./access.service.js";

export async function listStatuses(userId: string, listId: string) {
  await assertCanAccess(userId, { listId });
  return prisma.status.findMany({ where: { listId }, orderBy: { order: "asc" } });
}

export async function createStatus(userId: string, { listId, ...fields }: CreateStatusInput) {
  await assertCanAccess(userId, { listId });
  const last = await prisma.status.findFirst({
    where: { listId, type: { not: "done" } },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return prisma.status.create({
    data: { ...fields, listId, userId, type: "active", order: (last?.order ?? 100) + 100 },
  });
}

export async function updateStatus(userId: string, id: string, data: UpdateStatusInput) {
  await assertCanAccess(userId, { statusId: id });
  return prisma.status.update({ where: { id }, data });
}

export async function deleteStatus(userId: string, id: string) {
  const status = await prisma.status.findFirst({ where: { id, userId } });
  if (!status) throw new NotFoundError("Status not found");
  if (status.isDefault) throw new ForbiddenError("Default statuses cannot be deleted");

  return prisma.$transaction(async (tx) => {
    const fallback = await tx.status.findFirst({
      where: { listId: status.listId, type: "open" },
      orderBy: { order: "asc" },
      select: { id: true },
    });
    if (!fallback) throw new AppError("List has no open status to move tasks into", 500);

    const moved = await tx.task.updateMany({ where: { statusId: id }, data: { statusId: fallback.id } });
    const deleted = await tx.status.delete({ where: { id } });
    return { ...deleted, movedTasksCount: moved.count };
  });
}

/** Shape kept for the dashboard: `{ totalCount, "<status name>Count": n }`. */
export async function taskCountsByStatusName(userId: string) {
  const statuses = await prisma.status.findMany({
    where: { userId },
    select: { name: true, _count: { select: { tasks: true } } },
  });

  const counts: Record<string, number> = {};
  let totalCount = 0;
  for (const status of statuses) {
    const key = `${status.name}Count`;
    counts[key] = (counts[key] ?? 0) + status._count.tasks;
    totalCount += status._count.tasks;
  }
  return { totalCount, ...counts };
}
```

- [ ] **Step 5: Replace `apps/api/src/controllers/status.controller.ts`**

```ts
import type { Request, Response } from "express";
import type { CreateStatusInput, UpdateStatusInput } from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import * as statusService from "../services/status.service.js";

export const createStatus = catchAsync(async (req: Request, res: Response) => {
  res.status(201).json(await statusService.createStatus(req.userId, req.body as CreateStatusInput));
});

export const getStatuses = catchAsync(async (req: Request, res: Response) => {
  const { listId } = req.params as { listId: string };
  res.status(200).json(await statusService.listStatuses(req.userId, listId));
});

export const getStatusTasksCount = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json(await statusService.taskCountsByStatusName(req.userId));
});

export const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await statusService.updateStatus(req.userId, id, req.body as UpdateStatusInput));
});

export const deleteStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await statusService.deleteStatus(req.userId, id));
});
```

- [ ] **Step 6: Replace `apps/api/src/routes/status.routes.ts`**

```ts
import express from "express";
import {
  createStatusSchema,
  idParamsSchema,
  listIdParamsSchema,
  updateStatusSchema,
} from "@clickup/shared";
import {
  createStatus,
  deleteStatus,
  getStatuses,
  getStatusTasksCount,
  updateStatus,
} from "../controllers/status.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", validate({ body: createStatusSchema }), createStatus);
router.get("/list/:listId", validate({ params: listIdParamsSchema }), getStatuses);
router.get("/statusCounts", getStatusTasksCount);
router.patch("/:id", validate({ params: idParamsSchema, body: updateStatusSchema }), updateStatus);
router.delete("/:id", validate({ params: idParamsSchema }), deleteStatus);

export default router;
```

- [ ] **Step 7: Run all API tests**

Run: `pnpm --filter @clickup/api test && pnpm --filter @clickup/api typecheck`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "fix(api): status delete moves tasks instead of deleting them; rename endpoint; real task counts

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Tasks (ownership, status-in-list, bulk fixes, pagination)

**Files:**
- Create: `apps/api/src/services/task.service.ts`, `apps/api/test/tasks.test.ts`
- Modify (replace): `apps/api/src/controllers/task.controller.ts`, `apps/api/src/routes/task.routes.ts`
- Delete: `apps/api/src/types/task.dto.ts`, `list.dto.ts`, `user.dto.ts`, `workspace.dto.ts` (replaced by `@clickup/shared` types)

**Interfaces:**
- Produces (`task.service`):
  - `createTask(userId, input)`, `countTasks(userId, listId?)`
  - `listTasks(userId, query: TasksQuery) → { tasks, nextCursor: string | null }`
  - `priorityCounts(userId, listId?) → Record<Priority, number>` (only priorities with tasks)
  - `completeAndTotalCounts(userId, listId) → { totalTasksCount, completedTasksCount }`
  - `updateTask(userId, id, input)`, `updateTasks(userId, input: BulkUpdateTasksInput)`
  - `deleteTask(userId, id)`, `deleteTasksInList(userId, listId, ids) → number`
- `GET /api/tasks` sets the response header `X-Next-Cursor` when more rows exist.

- [ ] **Step 1: Write the failing tests**

`apps/api/test/tasks.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { api, createTask, seedWorkspace, signUp } from "./helpers.js";

describe("tasks", () => {
  it("rejects a status from a different list (422) and another user's list (404)", async () => {
    const a = await signUp();
    const b = await signUp();
    const one = await seedWorkspace(a.cookie);
    const two = await seedWorkspace(a.cookie, "Second");
    const foreign = await seedWorkspace(b.cookie);

    await api()
      .post("/api/tasks")
      .set("Cookie", a.cookie)
      .send({ name: "x", listId: one.list.id, statusId: two.openStatus.id })
      .expect(422);
    await api()
      .post("/api/tasks")
      .set("Cookie", a.cookie)
      .send({ name: "x", listId: foreign.list.id, statusId: foreign.openStatus.id })
      .expect(404);
    await api()
      .post("/api/tasks")
      .set("Cookie", a.cookie)
      .send({ name: "x", listId: one.list.id, statusId: foreign.openStatus.id })
      .expect(422);
  });

  it("update cannot move a task to another list's status or change its list/owner", async () => {
    const a = await signUp();
    const one = await seedWorkspace(a.cookie);
    const two = await seedWorkspace(a.cookie, "Second");
    const task = await createTask(a.cookie, { listId: one.list.id, statusId: one.openStatus.id });

    await api()
      .patch(`/api/tasks/${task.id}`)
      .set("Cookie", a.cookie)
      .send({ statusId: two.openStatus.id })
      .expect(422);

    const res = await api()
      .patch(`/api/tasks/${task.id}`)
      .set("Cookie", a.cookie)
      .send({ name: "Renamed", listId: two.list.id, userId: crypto.randomUUID(), statusId: one.doneStatus.id })
      .expect(200);
    expect(res.body).toMatchObject({ name: "Renamed", listId: one.list.id, statusId: one.doneStatus.id });
    expect(res.body.status.type).toBe("done");
  });

  it("another user's task is 404 for update and delete", async () => {
    const a = await signUp();
    const b = await signUp();
    const foreign = await seedWorkspace(b.cookie);
    const task = await createTask(b.cookie, { listId: foreign.list.id, statusId: foreign.openStatus.id });
    await api().patch(`/api/tasks/${task.id}`).set("Cookie", a.cookie).send({ name: "x" }).expect(404);
    await api().delete(`/api/tasks/${task.id}`).set("Cookie", a.cookie).expect(404);
  });

  it("bulk delete only deletes tasks in the list named in the URL", async () => {
    const a = await signUp();
    const one = await seedWorkspace(a.cookie);
    const two = await seedWorkspace(a.cookie, "Second");
    const inOne = await createTask(a.cookie, { listId: one.list.id, statusId: one.openStatus.id });
    const inTwo = await createTask(a.cookie, { listId: two.list.id, statusId: two.openStatus.id });

    const res = await api()
      .delete(`/api/tasks/${one.list.id}/bulk`)
      .set("Cookie", a.cookie)
      .send([inOne.id, inTwo.id])
      .expect(200);

    expect(res.body.deletedCount).toBe(1);
    expect(await prisma.task.findUnique({ where: { id: inTwo.id } })).not.toBeNull();
  });

  it("bulk update is all-or-nothing when any id is not the caller's", async () => {
    const a = await signUp();
    const b = await signUp();
    const mine = await seedWorkspace(a.cookie);
    const theirs = await seedWorkspace(b.cookie);
    const t1 = await createTask(a.cookie, { listId: mine.list.id, statusId: mine.openStatus.id });
    const t2 = await createTask(b.cookie, { listId: theirs.list.id, statusId: theirs.openStatus.id });

    await api()
      .patch("/api/tasks/bulk")
      .set("Cookie", a.cookie)
      .send({ tasksId: [t1.id, t2.id], updatedFields: { priority: "urgent" } })
      .expect(404);
    expect((await prisma.task.findUniqueOrThrow({ where: { id: t1.id } })).priority).toBe("none");

    await api()
      .patch("/api/tasks/bulk")
      .set("Cookie", a.cookie)
      .send({ tasksId: [t1.id], updatedFields: { priority: "urgent" } })
      .expect(204);
    expect((await prisma.task.findUniqueOrThrow({ where: { id: t1.id } })).priority).toBe("urgent");
  });

  it("bulk endpoints validate their bodies", async () => {
    const a = await signUp();
    const { list } = await seedWorkspace(a.cookie);
    await api().patch("/api/tasks/bulk").set("Cookie", a.cookie).send({ tasksId: [], updatedFields: {} }).expect(422);
    await api().delete(`/api/tasks/${list.id}/bulk`).set("Cookie", a.cookie).send([]).expect(422);
  });

  it("GET ignores ?select=, accepts empty sort params and paginates with X-Next-Cursor", async () => {
    const a = await signUp();
    const { list, openStatus } = await seedWorkspace(a.cookie);
    for (const name of ["one", "two", "three"])
      await createTask(a.cookie, { listId: list.id, statusId: openStatus.id, name });

    const page1 = await api()
      .get(`/api/tasks?listId=${list.id}&createdAt=asc&status=&select=user&limit=2`)
      .set("Cookie", a.cookie)
      .expect(200);
    expect(page1.body).toHaveLength(2);
    expect(page1.body[0]).not.toHaveProperty("user");
    expect(page1.body[0].status).toMatchObject({ type: "open" });
    const cursor = page1.headers["x-next-cursor"];
    expect(cursor).toEqual(expect.any(String));

    const page2 = await api()
      .get(`/api/tasks?listId=${list.id}&createdAt=asc&limit=2&cursor=${cursor}`)
      .set("Cookie", a.cookie)
      .expect(200);
    expect(page2.body.map((t: { name: string }) => t.name)).toEqual(["three"]);
    expect(page2.headers["x-next-cursor"]).toBeUndefined();

    const count = await api().get(`/api/tasks?listId=${list.id}&count=true`).set("Cookie", a.cookie);
    expect(count.body).toBe(3);
  });

  it("complete/total and priority counts", async () => {
    const a = await signUp();
    const { list, openStatus, doneStatus } = await seedWorkspace(a.cookie);
    await createTask(a.cookie, { listId: list.id, statusId: openStatus.id, priority: "high" });
    await createTask(a.cookie, { listId: list.id, statusId: doneStatus.id, priority: "high" });
    await createTask(a.cookie, { listId: list.id, statusId: doneStatus.id });

    const totals = await api()
      .get(`/api/tasks/${list.id}/completeAndTotalTasksCounts`)
      .set("Cookie", a.cookie)
      .expect(200);
    expect(totals.body).toEqual({ totalTasksCount: 3, completedTasksCount: 2 });

    const priorities = await api().get("/api/tasks/priorityCounts").set("Cookie", a.cookie).expect(200);
    expect(priorities.body).toEqual({ high: 2, none: 1 });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @clickup/api test -- tasks`
Expected: failures. A cross-list status is accepted, bulk delete deletes both tasks, bulk update partially applies, `?select=user` leaks `user`, and there is no `X-Next-Cursor`.

- [ ] **Step 3: Create `apps/api/src/services/task.service.ts`**

```ts
import type {
  BulkUpdateTasksInput,
  CreateTaskInput,
  TasksQuery,
  UpdateTaskInput,
} from "@clickup/shared";
import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../lib/errors/index.js";
import { assertCanAccess, assertStatusInList } from "./access.service.js";

const withStatus = { status: true } as const;

export async function createTask(userId: string, input: CreateTaskInput) {
  await assertCanAccess(userId, { listId: input.listId });
  await assertStatusInList(userId, input.statusId, input.listId);
  return prisma.task.create({ data: { ...input, userId }, include: withStatus });
}

export function countTasks(userId: string, listId?: string) {
  return prisma.task.count({ where: { userId, ...(listId && { listId }) } });
}

export async function listTasks(userId: string, query: TasksQuery) {
  const orderBy: Prisma.TaskOrderByWithRelationInput[] = [];
  if (query.status) orderBy.push({ status: { order: query.status } });
  if (query.priority) orderBy.push({ priority: query.priority });
  if (query.createdAt) orderBy.push({ createdAt: query.createdAt });
  if (query.dueDate) orderBy.push({ startDate: query.dueDate });
  orderBy.push({ id: "asc" }); // tie-breaker so cursor pagination is stable

  const tasks = await prisma.task.findMany({
    where: { userId, ...(query.listId && { listId: query.listId }) },
    include: withStatus,
    orderBy,
    take: query.limit,
    ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }),
  });

  const nextCursor = tasks.length === query.limit ? tasks[tasks.length - 1]!.id : null;
  return { tasks, nextCursor };
}

export async function priorityCounts(userId: string, listId?: string) {
  const groups = await prisma.task.groupBy({
    where: { userId, ...(listId && { listId }) },
    by: "priority",
    _count: { priority: true },
  });
  const counts: Record<string, number> = {};
  for (const group of groups) counts[group.priority] = group._count.priority;
  return counts;
}

export async function completeAndTotalCounts(userId: string, listId: string) {
  await assertCanAccess(userId, { listId });
  const [completedTasksCount, totalTasksCount] = await Promise.all([
    prisma.task.count({ where: { listId, status: { type: "done" } } }),
    prisma.task.count({ where: { listId } }),
  ]);
  return { totalTasksCount, completedTasksCount };
}

export async function updateTask(userId: string, id: string, data: UpdateTaskInput) {
  const task = await prisma.task.findFirst({ where: { id, userId }, select: { listId: true } });
  if (!task) throw new NotFoundError("Task not found");
  if (data.statusId) await assertStatusInList(userId, data.statusId, task.listId);
  return prisma.task.update({ where: { id }, data, include: withStatus });
}

export async function updateTasks(userId: string, { tasksId, updatedFields }: BulkUpdateTasksInput) {
  const ids = [...new Set(tasksId)];
  const tasks = await prisma.task.findMany({
    where: { id: { in: ids }, userId },
    select: { listId: true },
  });
  if (tasks.length !== ids.length) throw new NotFoundError("One or more tasks not found");

  if (updatedFields.statusId)
    for (const listId of new Set(tasks.map((t) => t.listId)))
      await assertStatusInList(userId, updatedFields.statusId, listId);

  await prisma.task.updateMany({ where: { id: { in: ids }, userId }, data: updatedFields });
}

export async function deleteTask(userId: string, id: string) {
  await assertCanAccess(userId, { taskId: id });
  return prisma.task.delete({ where: { id } });
}

export async function deleteTasksInList(userId: string, listId: string, ids: string[]) {
  const result = await prisma.task.deleteMany({ where: { userId, listId, id: { in: ids } } });
  return result.count;
}
```

- [ ] **Step 4: Replace `apps/api/src/controllers/task.controller.ts`**

```ts
import type { Request, Response } from "express";
import type {
  BulkUpdateTasksInput,
  CreateTaskInput,
  TasksQuery,
  UpdateTaskInput,
} from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import * as taskService from "../services/task.service.js";

export const createTask = catchAsync(async (req: Request, res: Response) => {
  res.status(201).json(await taskService.createTask(req.userId, req.body as CreateTaskInput));
});

export const getTasks = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as unknown as TasksQuery;
  if (query.count === "true")
    return res.status(200).json(await taskService.countTasks(req.userId, query.listId));

  const { tasks, nextCursor } = await taskService.listTasks(req.userId, query);
  if (nextCursor) res.set("X-Next-Cursor", nextCursor);
  res.status(200).json(tasks);
});

export const getTasksPriorityCounts = catchAsync(async (req: Request, res: Response) => {
  const { listId } = req.query as { listId?: string };
  res.status(200).json(await taskService.priorityCounts(req.userId, listId));
});

export const getTotalAndCompleteTasksCount = catchAsync(async (req: Request, res: Response) => {
  const { listId } = req.params as { listId: string };
  res.status(200).json(await taskService.completeAndTotalCounts(req.userId, listId));
});

export const updateTask = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await taskService.updateTask(req.userId, id, req.body as UpdateTaskInput));
});

export const updateManyTasks = catchAsync(async (req: Request, res: Response) => {
  await taskService.updateTasks(req.userId, req.body as BulkUpdateTasksInput);
  res.status(204).send();
});

export const deleteTask = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await taskService.deleteTask(req.userId, id));
});

export const deleteManyTasks = catchAsync(async (req: Request, res: Response) => {
  const { listId } = req.params as { listId: string };
  const deletedCount = await taskService.deleteTasksInList(req.userId, listId, req.body as string[]);
  res.status(200).json({ message: `${deletedCount} tasks deleted successfully`, deletedCount });
});
```

- [ ] **Step 5: Replace `apps/api/src/routes/task.routes.ts`**

```ts
import express from "express";
import {
  bulkDeleteTasksSchema,
  bulkUpdateTasksSchema,
  createTaskSchema,
  idParamsSchema,
  listIdParamsSchema,
  priorityCountsQuerySchema,
  tasksQuerySchema,
  updateTaskSchema,
} from "@clickup/shared";
import {
  createTask,
  deleteManyTasks,
  deleteTask,
  getTasks,
  getTasksPriorityCounts,
  getTotalAndCompleteTasksCount,
  updateManyTasks,
  updateTask,
} from "../controllers/task.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", validate({ body: createTaskSchema }), createTask);
router.get("/priorityCounts", validate({ query: priorityCountsQuerySchema }), getTasksPriorityCounts);
router.get("/", validate({ query: tasksQuerySchema }), getTasks);
router.get(
  "/:listId/completeAndTotalTasksCounts",
  validate({ params: listIdParamsSchema }),
  getTotalAndCompleteTasksCount,
);
router.patch("/bulk", validate({ body: bulkUpdateTasksSchema }), updateManyTasks);
router.patch("/:id", validate({ params: idParamsSchema, body: updateTaskSchema }), updateTask);
router.delete("/:id", validate({ params: idParamsSchema }), deleteTask);
router.delete(
  "/:listId/bulk",
  validate({ params: listIdParamsSchema, body: bulkDeleteTasksSchema }),
  deleteManyTasks,
);

export default router;
```

- [ ] **Step 6: Delete the obsolete DTO files and confirm the Prisma import boundary**

```bash
git rm -q apps/api/src/types/task.dto.ts apps/api/src/types/list.dto.ts apps/api/src/types/user.dto.ts apps/api/src/types/workspace.dto.ts
grep -rln "lib/prisma" apps/api/src | sort
```

Expected: only `src/app.ts` and files under `src/services/`. If a controller still imports `prisma`, move that logic into its service.

- [ ] **Step 7: Run everything**

Run: `pnpm --filter @clickup/api test && pnpm --filter @clickup/api typecheck && pnpm --filter @clickup/api lint`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "fix(api): task service - status must match list, scoped bulk ops, pagination, no ?select

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Guest cleanup cron, Vercel config, web adaptation, docs

**Files:**
- Create: `apps/api/src/services/guestCleanup.service.ts`, `apps/api/src/routes/internal.routes.ts`, `apps/api/test/cron.test.ts`, `apps/api/README.md`, `docs/adr/0003-api-layering-and-validation.md`
- Modify: `apps/api/src/app.ts`, `apps/api/vercel.json`, `apps/api/.env.example`, `apps/web/src/features/list/api/list.ts`

**Interfaces:**
- Produces: `deleteStaleGuests(olderThanDays = 7, now = new Date()): Promise<number>`.
- Produces: `GET /internal/cron/cleanup-guests`, which requires `Authorization: Bearer ${CRON_SECRET}` and returns `{ deletedGuests: number }`.

- [ ] **Step 1: Write the failing test**

`apps/api/test/cron.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { api, createTask, seedWorkspace, signUp } from "./helpers.js";

const EIGHT_DAYS_AGO = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

async function guestWithData() {
  const res = await api().post("/api/users/register/guest").expect(201);
  const cookie = `token=${res.body.token}`;
  const seeded = await seedWorkspace(cookie);
  await createTask(cookie, { listId: seeded.list.id, statusId: seeded.openStatus.id });
  return { id: res.body.user.id as string, avatarId: seeded.workspace.avatarId };
}

describe("GET /internal/cron/cleanup-guests", () => {
  it("rejects calls without the cron secret", async () => {
    await api().get("/internal/cron/cleanup-guests").expect(401);
    await api().get("/internal/cron/cleanup-guests").set("Authorization", "Bearer wrong").expect(401);
  });

  it("deletes guests older than 7 days with all their data, and keeps everyone else", async () => {
    const stale = await guestWithData();
    const fresh = await guestWithData();
    const member = await signUp();
    await prisma.user.update({ where: { id: stale.id }, data: { createdAt: EIGHT_DAYS_AGO } });
    await prisma.user.update({ where: { id: member.user.id }, data: { createdAt: EIGHT_DAYS_AGO } });

    const res = await api()
      .get("/internal/cron/cleanup-guests")
      .set("Authorization", "Bearer test-cron-secret")
      .expect(200);

    expect(res.body).toEqual({ deletedGuests: 1 });
    expect(await prisma.user.findUnique({ where: { id: stale.id } })).toBeNull();
    expect(await prisma.task.count({ where: { userId: stale.id } })).toBe(0);
    expect(await prisma.avatar.count({ where: { id: stale.avatarId } })).toBe(0);
    expect(await prisma.user.findUnique({ where: { id: fresh.id } })).not.toBeNull();
    expect(await prisma.user.findUnique({ where: { id: member.user.id } })).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @clickup/api test -- cron`
Expected: FAIL with 404, because the route does not exist.

- [ ] **Step 3: Create `apps/api/src/services/guestCleanup.service.ts`**

```ts
import { prisma } from "../lib/prisma.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 500;

/** Deletes up to BATCH_SIZE guest accounts older than `olderThanDays`, with everything they own. */
export async function deleteStaleGuests(olderThanDays = 7, now = new Date()) {
  const cutoff = new Date(now.getTime() - olderThanDays * DAY_MS);
  const guests = await prisma.user.findMany({
    where: { role: "guest", createdAt: { lt: cutoff } },
    select: { id: true },
    take: BATCH_SIZE,
  });
  const userIds = guests.map((guest) => guest.id);
  if (userIds.length === 0) return 0;

  const workspaces = await prisma.workspace.findMany({
    where: { userId: { in: userIds } },
    select: { avatarId: true },
  });
  const byOwner = { userId: { in: userIds } };

  // Children first: tasks block status deletion (NO ACTION), workspaces block avatars (RESTRICT).
  await prisma.$transaction([
    prisma.task.deleteMany({ where: byOwner }),
    prisma.status.deleteMany({ where: byOwner }),
    prisma.list.deleteMany({ where: byOwner }),
    prisma.workspace.deleteMany({ where: byOwner }),
    prisma.avatar.deleteMany({ where: { id: { in: workspaces.map((w) => w.avatarId) } } }),
    prisma.user.deleteMany({ where: { id: { in: userIds } } }),
  ]);

  return userIds.length;
}
```

- [ ] **Step 4: Create `apps/api/src/routes/internal.routes.ts` and mount it**

```ts
import express from "express";
import { catchAsync } from "../lib/utils/catchAsync.js";
import { UnauthorizedError } from "../lib/errors/index.js";
import { env } from "../config/env.js";
import { deleteStaleGuests } from "../services/guestCleanup.service.js";

const router = express.Router();

// Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
router.get(
  "/cron/cleanup-guests",
  catchAsync(async (req, res) => {
    if (!env.CRON_SECRET || req.headers.authorization !== `Bearer ${env.CRON_SECRET}`)
      throw new UnauthorizedError("Invalid cron secret");
    res.status(200).json({ deletedGuests: await deleteStaleGuests() });
  }),
);

export default router;
```

In `apps/api/src/app.ts`, add `import internalRoutes from "./routes/internal.routes.js";` and `app.use("/internal", internalRoutes);` directly before `app.use(globalErrorHandler);`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter @clickup/api test`
Expected: PASS, all files.

- [ ] **Step 6: Switch `apps/api/vercel.json` to zero-config Express + cron**

The legacy `builds` config does not run a build step, but the API now needs `@clickup/shared` built first. Vercel's Express preset detects `src/index.ts` (default export `app`) and honors `buildCommand`.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd ../.. && pnpm turbo run build --filter=@clickup/api",
  "crons": [{ "path": "/internal/cron/cleanup-guests", "schedule": "0 3 * * *" }]
}
```

Add to `apps/api/.env.example`:

```dotenv
# Vercel Cron sends this as a Bearer token to /internal/cron/cleanup-guests
CRON_SECRET=change-me
```

- [ ] **Step 7: Stop the web app sending `?select=id`**

In `apps/web/src/features/list/api/list.ts`, inside `getLatestCreatedListId`, replace `"/lists/latest?select=id"` with `"/lists/latest"`. The response is `{ id, name, workspaceId } | null`, which is compatible with the existing `{ id } | undefined` usage. Run `pnpm --filter @clickup/web typecheck`; expected: exit 0.

- [ ] **Step 8: Write `apps/api/README.md`**

````markdown
# @clickup/api

Express 5 + Prisma 7 API for the ClickUp clone.

## Layout

- `routes/`: HTTP paths plus `validate()` with zod schemas from `@clickup/shared`
- `controllers/`: HTTP only (read the validated request, call a service, send JSON)
- `services/`: business logic; the only layer that talks to Prisma
- `services/access.service.ts`: `assertCanAccess()`, the single ownership check

## Local development

```bash
pnpm install
pnpm --filter @clickup/api db:local        # embedded Postgres on :54329 (no Docker needed)
cp apps/api/.env.example apps/api/.env     # defaults point at the local database
pnpm --filter @clickup/api exec prisma migrate deploy
pnpm --filter @clickup/shared build
pnpm --filter @clickup/api dev             # http://localhost:5000
```

## Tests

`pnpm --filter @clickup/api test` boots a throwaway embedded Postgres on :54330, applies all migrations and runs the suite. In CI, `TEST_DATABASE_URL` points at a Postgres service container instead.
````

- [ ] **Step 9: Write `docs/adr/0003-api-layering-and-validation.md`**

```markdown
# ADR 0003: API layering, validation and ownership checks

- Status: Accepted
- Date: 2026-09-28

## Context
The original controllers called Prisma directly, trusted request bodies, and passed a few of them straight into `data`. They never checked that referenced IDs belonged to the caller. An authenticated user could:
- move their list into someone else's workspace,
- attach tasks to someone else's statuses,
- read their own password hash through `?select=user`.

Deleting a status also silently deleted all of its tasks.

## Decision
- **Layers:** routes → `validate()` → controllers (HTTP only) → services (logic + Prisma).
- **Schemas:** zod schemas live in `@clickup/shared`, so the web app can reuse them. Parsing strips unknown keys, which makes mass assignment impossible by construction.
- **Ownership:** every ID a request references goes through `assertCanAccess()`, which returns 404 for both not-owned and missing. A task's status must belong to the task's list.
- **Statuses:** statuses have a `type` (open / active / done) and an `isDefault` flag instead of magic order numbers. The task → status foreign key is `NO ACTION`, and deleting a status moves its tasks to the list's open status.
- **Rate limits:** keyed by email (login, register) or global (guest sign-up), because every request reaches the API from the web app's server with the same IP. The in-memory store is per serverless instance, which is an accepted limitation for a free-tier portfolio deployment.
- **Compatibility:** response shapes stay backwards compatible, because the web and API deploy separately.

## Consequences
- **Gain:** cross-account tests (A vs B) guard every resource. Spec B only needs to change `assertCanAccess()` to check workspace membership.
- **Cost:** each write does one or two extra ownership queries, backed by the new foreign-key indexes.
```

- [ ] **Step 10: Full verification from the repo root**

Run: `pnpm lint && pnpm typecheck && pnpm test && API_URL=http://localhost:5000/api JWT_SECRET=x pnpm build`
Expected: every package passes.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(api): daily guest cleanup cron, zero-config Vercel build, README and ADR 0003

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 12: 👤 Deploy (ask the user first)**

1. Ask the user to add `CRON_SECRET` (a long random string) to the API project's Vercel environment variables for Production and Preview. Ask them to check that Framework Preset is "Express" (or "Other"; Vercel auto-detects Express).
2. Ask: *"OK to push branch `a2-api-hardening`? It creates a Vercel preview and runs CI."* Only after a yes: `git push -u origin a2-api-hardening`.
3. Once CI is green, ask the user to open `<api-preview-url>/health` and confirm it shows `{"ok":true}`.
   - If the preview build fails because Express is not detected, restore the old `builds` block alongside `buildCommand`, and add `"vercel-build": "pnpm --filter @clickup/shared build && prisma generate"` to `apps/api/package.json`.
4. The Neon production database needs the new migration. Ask the user to run it locally with the **production** `DIRECT_URL` (from Neon), or to approve adding `prisma migrate deploy` to the build:

   ```bash
   DIRECT_URL=<neon direct url> DATABASE_URL=<neon url> pnpm --filter @clickup/api exec prisma migrate deploy
   ```

   The migration is additive apart from the FK change and the index swap, and it is safe to run before merging.
5. Ask permission to merge into `master`. Then smoke-test production: guest login → onboarding → create a task → change its status → delete a custom status that has a task (the task should move to "to do") → Dashboard pie shows counts.
