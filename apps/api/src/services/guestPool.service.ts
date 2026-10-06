import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";

/**
 * A small pool of pre-seeded guest accounts, so "Continue as guest" is one SQL statement
 * instead of ~25 sequential seed writes (seconds on serverless Postgres).
 *
 * A pooled guest is a normal guest whose `pooledAt` is set. Claiming it clears `pooledAt`,
 * resets `createdAt` (guest cleanup counts from the claim), and moves its seeded dates
 * forward so "overdue", "today" and "2h ago" still read correctly however long it waited:
 * task start/due dates, sprint dates and goal due dates by whole UTC days (they sit at 12:00 UTC), other
 * timestamps exactly.
 *
 * Raw SQL on purpose: one round trip, and `FOR UPDATE SKIP LOCKED` keeps concurrent
 * claims from taking the same account.
 */

type Claimed = { id: string; landingListId: string | null };

/**
 * Version of the demo seed a pooled guest was made with. Only guests of the current
 * version are claimed or counted, so a deploy that changes the seed refills the pool,
 * and the leftovers age out through the normal guest cleanup.
 * Increment it whenever the guest seed gains new demo data.
 */
export const POOL_SEED_VERSION = 5;

/** ISO text cast to `timestamp`: UTC wall-clock, the same convention Prisma writes. */
const utc = (date: Date) => date.toISOString();

export async function claimPooledGuest(now = new Date()): Promise<Claimed | undefined> {
  const at = utc(now);
  const rows = await prisma.$queryRaw<Claimed[]>`
    WITH pick AS (
      SELECT id, "pooledAt" FROM "User"
      WHERE "pooledAt" IS NOT NULL AND "poolSeedVersion" = ${POOL_SEED_VERSION}
      ORDER BY "pooledAt" DESC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    ), claimed AS (
      UPDATE "User" u
      SET "pooledAt" = NULL, "createdAt" = ${at}::timestamp, "updatedAt" = ${at}::timestamp
      FROM pick WHERE u.id = pick.id
      RETURNING u.id, u."landingListId",
        ${at}::timestamp - pick."pooledAt" AS shift,
        (${at}::timestamp::date - pick."pooledAt"::date) * interval '1 day' AS days
    ), owned AS (
      SELECT t.id, c.shift FROM "Task" t
      JOIN "List" l ON l.id = t."listId"
      JOIN "Workspace" w ON w.id = l."workspaceId"
      JOIN claimed c ON c.id = w."userId"
    ), tasks AS (
      UPDATE "Task" t
      SET "startDate" = t."startDate" + c.days, "endDate" = t."endDate" + c.days,
          "createdAt" = t."createdAt" + c.shift, "updatedAt" = t."updatedAt" + c.shift,
          "completedAt" = t."completedAt" + c.shift
      FROM claimed c, owned o WHERE t.id = o.id
    ), lists AS (
      UPDATE "List" x SET "sprintStart" = x."sprintStart" + c.days, "sprintEnd" = x."sprintEnd" + c.days
      FROM claimed c, "Workspace" w
      WHERE x."workspaceId" = w.id AND w."userId" = c.id AND x."sprintNumber" IS NOT NULL
    ), comments AS (
      UPDATE "Comment" x SET "createdAt" = x."createdAt" + o.shift, "updatedAt" = x."updatedAt" + o.shift
      FROM owned o WHERE x."taskId" = o.id
    ), attachments AS (
      UPDATE "Attachment" x SET "createdAt" = x."createdAt" + o.shift
      FROM owned o WHERE x."taskId" = o.id
    ), activities AS (
      UPDATE "Activity" x SET "createdAt" = x."createdAt" + o.shift
      FROM owned o WHERE x."taskId" = o.id
    ), entries AS (
      UPDATE "TimeEntry" x
      SET "startedAt" = x."startedAt" + o.shift, "endedAt" = x."endedAt" + o.shift,
          "createdAt" = x."createdAt" + o.shift
      FROM owned o WHERE x."taskId" = o.id
    ), notifications AS (
      UPDATE "Notification" x SET "createdAt" = x."createdAt" + c.shift, "readAt" = x."readAt" + c.shift
      FROM claimed c WHERE x."userId" = c.id
    ), docs AS (
      UPDATE "Doc" x SET "createdAt" = x."createdAt" + c.shift, "updatedAt" = x."updatedAt" + c.shift
      FROM claimed c, "Workspace" w WHERE x."workspaceId" = w.id AND w."userId" = c.id
    ), whiteboards AS (
      UPDATE "Whiteboard" x SET "createdAt" = x."createdAt" + c.shift, "updatedAt" = x."updatedAt" + c.shift
      FROM claimed c, "Workspace" w WHERE x."workspaceId" = w.id AND w."userId" = c.id
    ), goals AS (
      UPDATE "Goal" x
      SET "dueDate" = x."dueDate" + c.days, "createdAt" = x."createdAt" + c.shift, "updatedAt" = x."updatedAt" + c.shift
      FROM claimed c, "Workspace" w WHERE x."workspaceId" = w.id AND w."userId" = c.id
    )
    SELECT id, "landingListId" FROM claimed`;
  return rows[0];
}

/** Marks a freshly seeded guest as waiting in the pool. */
export function markPooled(userId: string, landingListId: string, now = new Date()) {
  return prisma.$executeRaw`
    UPDATE "User" SET "pooledAt" = ${utc(now)}::timestamp, "landingListId" = ${landingListId},
      "poolSeedVersion" = ${POOL_SEED_VERSION}
    WHERE id = ${userId}`;
}

export async function countPooledGuests() {
  const [row] = await prisma.$queryRaw<{ n: number }[]>`
    SELECT count(*)::int AS n FROM "User" WHERE "pooledAt" IS NOT NULL AND "poolSeedVersion" = ${POOL_SEED_VERSION}`;
  return row?.n ?? 0;
}

/** Tops the pool up to GUEST_POOL_SIZE. Seeding is lazy-imported to avoid a cycle. */
export async function refillGuestPool(size = env.GUEST_POOL_SIZE) {
  const missing = size - (await countPooledGuests());
  if (missing <= 0) return 0;
  const { seedGuest } = await import("./user.service.js");
  for (let i = 0; i < missing; i++) await seedGuest({ pooled: true });
  return missing;
}

/**
 * Keeps a promise running after the response is sent. On Vercel this is the request
 * context's waitUntil (what @vercel/functions exports); elsewhere the process stays alive.
 */
export function runAfterResponse(task: Promise<unknown>) {
  const guarded = task.catch((error: unknown) => console.error("guest pool refill failed", error));
  const store = (globalThis as Record<symbol, unknown>)[Symbol.for("@vercel/request-context")] as
    | { get?: () => { waitUntil?: (p: Promise<unknown>) => void } | undefined }
    | undefined;
  store?.get?.()?.waitUntil?.(guarded);
}
