# A4: Web Fixes, E2E Tests & Honest README Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix every web-app bug from the foundation audit (spec §4.4) plus the carry-overs from A2 and A3. Add a Playwright end-to-end test of the guest demo path to CI. Rewrite the README so it claims only what the code does.

**Architecture:** Most tasks are small, focused fixes inside the existing feature folders. Where a fix contains logic, the logic moves into a small pure helper with its own unit test. Two tasks touch the API: aggregated endpoints that remove N+1 fetches, and extra status-count fields for the dashboard.

**Findings file:** the current code (quoted with file:line) and the recommended fix direction for every item is in the controller's findings file `.superpowers/sdd/2026-09-29-a4-web-fixes-e2e/findings.md` (git-ignored). Each task names the section numbers (§N) to read. Where the findings offer alternatives, this plan picks one.

**Tech Stack:** Next 16 (App Router, `cacheComponents`), React 19, TanStack Query 5, dnd-kit, recharts, Express 5 + Prisma 7 (API), Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-28-foundation-design.md` (§4.4, §4.5)

## Global Constraints

- **Branch** `a4-web-fixes` (from `master`). Never push; the controller asks the user.
- **Commits:** each message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Visual identity stays** (ClickUp-like dark and light theme). Copy changes are listed explicitly.
- **API compatibility:** existing response shapes stay valid; new fields and query params are additive only.
- **Tests:** every logic change gets a unit test (Vitest). Helpers live next to their feature, e.g. `features/task/lib/*.ts`.
- **Local stack for manual/E2E checks** (see findings §14):
  1. `pnpm --filter @clickup/api db:local` (Postgres on :54329)
  2. `apps/api/.env` and `apps/web/.env.local` already exist
  3. `pnpm --filter @clickup/shared build`
  4. API `pnpm --filter @clickup/api dev` (:5000)
  5. web `pnpm --filter @clickup/web dev` (:3000)
- **Never run two API test suites at once** (Windows embedded Postgres).

---

### Task 1: Status `type` in the web + sidebar "+ task" + stale status copy

**Read:** findings §10, §2, and the "[extra]" note in §10 about `ColumnFeaturesBtn` copy.

**Files:** `features/status/types.ts`, `features/task/types.ts`, `features/status/consts.ts`, every usage listed in §10, `features/list/components/Item.tsx`, new `features/task/actions/create-task-in-list.action.ts`, new `features/status/lib/statusByType.ts` + test, `features/task/views/Board/components/ColumnFeaturesBtn.tsx`.

**Steps:**
- [ ] **Types.** Add `type: "open" | "active" | "done"` and `isDefault: boolean` to the web `Status` type and to the task's embedded `status` type.
- [ ] **Helper.** Create `features/status/lib/statusByType.ts`, with tests written first:
  ```ts
  import type { Status } from "../types";
  export const findOpenStatus = (s: Status[] | undefined) =>
    s?.find((x) => x.type === "open") ?? [...(s ?? [])].sort((a, b) => a.order - b.order)[0];
  export const findDoneStatus = (s: Status[] | undefined) => s?.find((x) => x.type === "done");
  export const isDoneStatus = (s: Pick<Status, "type">) => s.type === "done";
  ```
  Test: `findOpenStatus` picks the open one; it falls back to the lowest order when no open status exists; `undefined` input returns `undefined`.
- [ ] **Replace order constants.** Replace every `STATUS_LOWEST_ORDER`, `STATUS_ACTIVE_ORDER` and `STATUS_HIGHEST_ORDER` comparison, and `statusName !== "complete"` in `OptionsRow.tsx`, with the helpers or `type` checks. Keep `STATUS_ACTIVE_ORDER` only where it truly means "the default in-progress status"; for those, prefer `type === "active" && isDefault`. Delete constants that become unused.
- [ ] **Sidebar "+ task".** Implement the recommended fix in §2: a server action `createTaskInList(listId, name = "Untitled task")` that resolves the clicked list's open status server-side and creates the task. `Item.tsx` calls it in a transition, invalidates `["tasks", listId]` and toasts. Also apply the `useAddTask` guards noted in §2 (`?.find`, `(old: Task[] = [])`).
- [ ] **Delete-status dialog copy** (`ColumnFeaturesBtn`): "Tasks in this status will move to the list's first status."
- [ ] **Verify and commit.** Run `pnpm --filter @clickup/web test lint typecheck`, then commit `fix(web): use status.type everywhere; sidebar add-task resolves the list's own open status`.

### Task 2: Board — drag-and-drop correctness, overlay, card click opens details

**Read:** findings §3, §4, and the `transform3d` part of §5.

**Files:** `features/task/views/Board/contexts/DragProvider.tsx`, `TaskCard.tsx` (split into a presentational `TaskCardView` plus a draggable wrapper), `shared/ui/ModalCompound.tsx` (controlled mode), new `features/task/lib/shouldMoveTask.ts` + test, `features/task/components/TaskDetailPanel/index.ts`.

**Steps:**
- [ ] **Pure helper**, tests first:
  ```ts
  // returns the destination status id when the task must move, else null
  export function shouldMoveTask(activeStatusId: string, overId: string | number | undefined | null): string | null {
    if (overId === undefined || overId === null) return null;
    const target = String(overId);
    return target === activeStatusId ? null : target;
  }
  ```
  Tests: dropping on the same column returns `null`; dropping on nothing returns `null`; dropping on another column returns its id. Use it in `handleDragEnd`, with the card's draggable `data` carrying `statusId`.
- [ ] **Overlay.** The `DragOverlay` renders the non-draggable `TaskCardView`. The source card is not translated while an overlay exists. Fix the invalid `transform3d(` to `translate3d(` wherever it still applies.
- [ ] **Modal controlled mode.** Add optional `open?: boolean` and `onOpenChange?: (open: boolean) => void` props to `Modal`, falling back to the internal state; the API is otherwise unchanged. Test in `Modal.test.tsx`: a controlled open prop shows the dialog; Escape calls `onOpenChange(false)`.
- [ ] **Card click opens details**, per §4 steps 2–5. Click and Enter/Space on the card open `TaskDetailPanel` in a controlled `Modal` (`title="Task details"`). Clicks on buttons, links, inputs, portaled menus and while renaming do **not** open it (use the `closest(...)` guard from §4). The card is `role="button" tabIndex={0}`.
- [ ] **Verify and commit** `fix(web): board drag no-ops on same column, clean drag overlay, click card to open details`.

### Task 3: Calendar and sort fixes

**Read:** findings §5 (all parts except `transform3d`, which Task 2 handled).

**Files:** Calendar components per §5, `features/task/views/Calendar/...CreateTaskRow.tsx`, the `TASK_VIEWS` constant, `features/task/components/Sort/SortBtnWithMenu.tsx`, new `features/task/lib/shiftTaskDates.ts` + test.

**Steps:**
- [ ] **Pure helper**, tests first:
  ```ts
  import { addDays, differenceInCalendarDays } from "date-fns";
  export function shiftTaskDates(
    task: { startDate: Date | string | null; endDate: Date | string | null },
    fromCell: Date,
    toCell: Date,
  ) {
    const diff = differenceInCalendarDays(toCell, fromCell);
    const shift = (d: Date | string | null) => (d ? addDays(new Date(d), diff) : null);
    return { startDate: shift(task.startDate), endDate: shift(task.endDate) };
  }
  ```
  Tests:
  - A 3-day task dragged by its middle segment one day forward shifts both dates by +1.
  - Null dates stay null.
  - Dropping onto the same cell returns the same dates.
- [ ] **Calendar drag.** Carry `cellDate` in the draggable data and use `shiftTaskDates(task, active.cellDate, over.cellDate)`. Add a `DragOverlay` so the dragged item follows the pointer.
- [ ] **CreateTaskRow.** Move the render-time `setValue` into `defaultValues` or an effect, and remove `console.log(errors)`.
- [ ] **Sort control.** Show Sort on the calendar: add `"calendar"` to the right constant, and keep Add Status hidden if the calendar shouldn't have it. Fix `SortBtnWithMenu` always passing `usedFor="board"`; pass the current view.
- [ ] **Verify and commit** `fix(web): calendar drag follows pointer and keeps grab offset; sort works per view`.

### Task 4: React Query hygiene

**Read:** findings §7.

**Files:** new `features/task/hooks/useTasksQueryKey.ts` + test, `useTasks.ts`, `useStatuses.ts`, the five task mutation hooks, `contexts/QueryProvider.tsx`.

**Steps:**
- [ ] **Query key factory.** `useTasksQueryKey()` returns `{ listId, queryKey, baseKey }`. It is used by `useTasks` and by all five mutation hooks, with no duplicated key logic left. Unit-test the pure key builder (`buildTasksQueryKey(listId, sortedFilters)`).
- [ ] **Errors.** Move query-error toasts out of render: add a global `QueryCache({ onError })` in `makeQueryClient` that toasts `query.meta?.errorMessage ?? error.message`. Remove the render-time `window.toast` calls from `useTasks` and `useStatuses`, and return `error` from both hooks.
- [ ] **Fixes:**
  - `useAddTask.onSuccess` uses `queryKey`.
  - `onMutate` defaults the old data to `[]`.
  - `useDeleteTasks` awaits `cancelQueries`.
- [ ] **Devtools.** Render `ReactQueryDevtools` only when `process.env.NODE_ENV === "development"`.
- [ ] **Verify and commit** `refactor(web): one tasks query-key factory, query errors toast via QueryCache, devtools dev-only`.

### Task 5: Workspace avatar saving + dashboard colors

**Read:** findings §1 and §6, including the `indigo` hex "[extra]".

**Files:** `features/workspace/components/Avatar.tsx`, `features/status/components/DashboardStatusPie.tsx` + `DashboardStatusPieChart.tsx`, `shared/ui/ColorPicker/colorTokens.ts`, API `apps/api/src/services/status.service.ts` + test, new `features/status/lib/statusColor.ts` + test.

**Steps:**
- [ ] **Avatar.** Implement §1:
  - Delete the mount effect.
  - Save on icon/color change with an optimistic value and rollback plus a toast on error.
  - Skip the call when nothing changed.
  - Seed the display from server props so a revalidation re-syncs it.
- [ ] **Status counts API.** Additive change: `GET /statuses/statusCounts` also returns `colors: Record<string, string>`, mapping each status name to its `bgColor` (the first status with that name). Add an API test asserting `colors["to do"] === "neutral"` and `colors["complete"] === "emerald"`, while the existing count keys stay unchanged.
- [ ] **Color helper**, tests first. `statusColorHex(name, colors)` returns `COLORS_TOKENS[colors[name]]?.hex`, falling back to a deterministic token picked by a stable string hash of the name. The same input always gives the same output.
- [ ] **Pie chart.** Build the data server-side with `fill`, and strip the name suffix with `/Count$/` without lowercasing first. `DashboardStatusPieChart` uses `entry.fill`; `Math.random` is gone.
- [ ] **Indigo.** Fix `indigo.hex` to Tailwind v4 indigo-600 (`#4f39f6`).
- [ ] **Verify and commit** `fix(web): avatar changes save; dashboard status colors are stable and match status colors`.

### Task 6: Remove N+1 fetches; follow task pagination

**Read:** findings §8 and §11.

**Files:** API `packages/shared/src/common.ts` (or specific query schemas), `apps/api/src/{controllers,services}/{workspace,list}.*`, API tests; web `SpacesList.tsx`, `SpaceItem.tsx`, `ListsSummery` and its services, `shared/lib/axios/server.ts`, `features/task/api/tasks.server.ts`, `app/api/tasks/route.ts`, new `features/task/lib/fetchAllPages.ts` + test.

**Steps:**
- [ ] **API, additive, with tests:**
  - `GET /workspaces?include=lists` returns each workspace with `lists` (ordered by `createdAt` asc).
  - `GET /lists?withCounts=true` returns each list with `totalTasksCount` and `completedTasksCount`, computed with one `groupBy` over done tasks.
  - Extend the query schemas so these params survive `validate()`. Test the existing shapes without the params.
- [ ] **Web.** `SpacesList` does one call and passes each workspace's `lists` to `SpaceItem`, with no per-item fetch. `ListsSummery` uses `withCounts`. Consolidate cache tags as §8 notes, so creating, deleting or renaming lists and tasks still refreshes these views.
- [ ] **Pagination helper**, tests first:
  ```ts
  export async function fetchAllPages<T>(
    fetchPage: (cursor?: string) => Promise<{ items: T[]; nextCursor: string | null }>,
    maxPages = 20,
  ): Promise<T[]> {
    const all: T[] = [];
    let cursor: string | undefined;
    for (let i = 0; i < maxPages; i++) {
      const { items, nextCursor } = await fetchPage(cursor);
      all.push(...items);
      if (!nextCursor) break;
      cursor = nextCursor;
    }
    return all;
  }
  ```
  Tests: one page; three pages concatenated in order; stops at `maxPages`.
- [ ] **Header-aware fetch.** Add a way to read response headers on the server axios instance, e.g. an exported `getWithHeaders<T>(url)` that bypasses the data-unwrap interceptor. Use `fetchAllPages` with `limit=1000&cursor=` in `tasks.server.ts#getTasks` and in `app/api/tasks/route.ts`. The React Query cache shape stays `Task[]`.
- [ ] **Verify and commit** `perf: aggregated workspaces/lists endpoints; web fetches all task pages`.

### Task 7: Header, copy, accessibility, cold-start warm-up

**Read:** findings §9, §12, §13.

**Steps:**
- [ ] **Guest badge.** Guests see a small "Sign up to save your work" button-style link instead of the large underlined "Sign in".
- [ ] **Header title.** Derived from the route in a small client component: "Dashboard", "Whiteboard", "Lists Overview", or the current list's name. For the list name, read the `["list", listId]` query if it is cached, else the list name from the `lists` data; keep it simple and document the choice. The decorative no-op "project list item" button becomes a non-interactive icon.
- [ ] **View tabs** do not wrap: `flex-nowrap overflow-x-auto`, `shrink-0` items, and the pill recomputed on resize.
- [ ] **Copy and a11y fixes** from §12:
  - the Prev button aria-label
  - the list-item tooltip ("List settings")
  - the signup password placeholder (min 6)
  - `not-found.tsx` copy ("Page not found")
  - the `DeleteConfirm` entity name
  - no `<button>` inside `<Link>`: style the `Link` itself as the button
- [ ] **Warm-up.** Add the recommended §13 warm-up: `app/api/warmup/route.ts`, plus a client `ApiWarmup` component rendered on the landing and login pages, deduped per session with `sessionStorage` (wrapped in try/catch).
- [ ] **Verify and commit** `fix(web): header shows real title and guest CTA, tabs don't wrap, copy/a11y fixes, API warm-up`.

### Task 8: Playwright end-to-end test of the demo path + CI

**Read:** findings §14.

**Files:** `apps/web/playwright.config.ts`, `apps/web/e2e/demo-path.spec.ts`, `apps/web/vitest.config.ts` (exclude `e2e/**`), `apps/web/package.json` (`test:e2e`), `.github/workflows/ci.yml` (new `e2e` job).

**Steps:**
- [ ] **Install.** `pnpm --filter @clickup/web add -D @playwright/test`. Use the version matching the locally cached chromium if possible; otherwise run `pnpm --filter @clickup/web exec playwright install chromium`.
- [ ] **Config.** `playwright.config.ts` uses `testDir: "e2e"`, `use.baseURL = "http://localhost:3000"`, and chromium only. `webServer` starts the API (`pnpm --filter @clickup/api dev`, url `http://localhost:5000/health`) and the web app (`pnpm --filter @clickup/web dev`, url `http://localhost:3000/login`), with `reuseExistingServer: !process.env.CI`.
- [ ] **Spec** `demo-path.spec.ts`, one serial test using accessible selectors (roles/labels):
  1. Continue as guest.
  2. Complete the onboarding wizard (space, list, status, task).
  3. On the Board, see the task.
  4. Drag the task to "in progress" with Playwright mouse steps, and assert it is in that column.
  5. Open the task by clicking the card; the "Task details" dialog appears; close it with Escape.
  6. Table view: select all, and bulk-set priority to "urgent".
  7. Calendar view renders.
  8. Sign out, landing on `/login`.
- [ ] **Run** it locally with the local stack. Record the output.
- [ ] **CI job `e2e`,** which needs `ci`:
  - A Postgres service like the `ci` job.
  - Env: `DATABASE_URL`/`DIRECT_URL` pointing at the service, plus `JWT_SECRET`, `API_URL`, `CRON_SECRET`, `GUEST_SIGNUPS_PER_MINUTE: 1000`.
  - Steps: `pnpm install --frozen-lockfile`, then `pnpm --filter @clickup/shared build`, then `pnpm --filter @clickup/api exec prisma migrate deploy`, then `pnpm --filter @clickup/web exec playwright install --with-deps chromium`, then `pnpm --filter @clickup/web test:e2e`.
  - Upload `playwright-report` on failure.
- [ ] **Verify and commit** `test(e2e): playwright demo path + CI job`.

### Task 9: Honest README + cleanup

**Read:** findings §15, `docs/roadmap.md`, `docs/adr/*`.

**Steps:**
- [ ] Rewrite `README.md` with these sections:
  - Title + one-line pitch + "Try the guest demo" link (`https://click-up-clone-two.vercel.app`) + CI badge (`https://github.com/alysalah83/Click-up-clone/actions/workflows/ci.yml/badge.svg`)
  - Screenshots: keep the existing `assets/` images that still match
  - Features: a table with a Built / Roadmap column. Only claim what exists: Board, List, Table and Calendar views; drag and drop; sorting; bulk edit; onboarding wizard; custom statuses; dashboard; whiteboard (Excalidraw, local); guest mode; light and dark theme. Collaboration, assignees, comments, real-time and AI go under Roadmap.
  - Architecture: a Mermaid diagram of browser → Next.js (BFF, server actions) → Express API → Postgres (Neon); the monorepo layout; the key tech list
  - Engineering highlights: layered API with zod validation and ownership checks (ADR 0003); cross-account tests; migrations applied on deploy; the Radix migration behind stable APIs (ADR 0002) and the legacy UI showcase; tests (unit, API integration, E2E)
  - Local development: the steps from `apps/api/README.md` plus the web steps
  - Project evolution: v1 (two repos, hand-built UI) → v2 (monorepo, hardened API, Radix, tests)
  - Roadmap: link `docs/roadmap.md`
- [ ] **Lint override.** Delete the scoped TEMPORARY override for `src/legacy-ui/MenuCompound.tsx` if a `// eslint-disable-next-line react-hooks/set-state-in-effect` with a reason is cleaner. Otherwise keep it with an accurate comment.
- [ ] **Full verification:** `pnpm lint && pnpm typecheck && pnpm test && API_URL=http://localhost:5000/api JWT_SECRET=x pnpm build`, all green.
- [ ] **Commit** `docs: honest README with architecture, highlights and roadmap`.
