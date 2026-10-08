# Handoff: next steps for new chats

Last updated: 2026-10-08 (seventh sprint: custom fields, workload, mind map, chat, import, share links, fresh screenshots). **Every new chat starts by reading this file.** At the end of each chat, update the "Current state" table and tick the step you finished.

## Current state

| Plan | What | Status |
|---|---|---|
| A1 | Monorepo, pnpm + Turborepo, CI | ✅ live |
| A2 | API hardening: validation, ownership checks, auth, tests | ✅ live |
| A3 | Overlays rebuilt on shadcn/Radix behind the old APIs | ✅ live |
| A4 | Web bug fixes, Playwright E2E, honest README (+ leftovers) | ✅ live |
| B1 | Guest demo workspace seed (2 spaces, 4 lists, 80 tasks) | ✅ live |
| B2 | Workspace members/roles, Teams page, assignees, invites, 6 demo teammates | ✅ live |
| B3 | Rich task panel: Tiptap description, subtasks, checklists, tags, activity | ✅ live |
| B4 | Comments (threads, @mentions, reactions) | ✅ live |
| B5 | Home / My Work (`/home/my-work`) | ✅ live |
| B6 | Inbox + unread badge, 30s polling | ✅ live |
| C1 | Real shadcn/ui components + modern restyle; Menu/Modal/ToolTip facades on them | ✅ live |
| C2 | Table/List rows open task panel | ✅ live |
| C3 | Ctrl+K command palette (tasks, lists, members) | ✅ live |
| C4 | Claude AI on task panel: Summarize, Generate subtasks | ✅ live, needs `ANTHROPIC_API_KEY` on the API Vercel project |
| D1 | Restyle: task panel, badges, empty/loading states, Teams/My Work/Inbox on shadcn | ✅ live, eyeballed 2026-09-30 |
| D2 | Timeline (Gantt) view, drag/resize, "blocked by" dependencies | ✅ live, eyeballed 2026-09-30 |
| D3 | Filters, Group by (List/Board), saved views + default | ✅ live, eyeballed 2026-09-30 |
| D4 | Automations per list + rules builder, 2 demo rules | ✅ live, eyeballed 2026-09-30 |
| D5 | Dashboard 2.0: workload, overdue, completed this week, burndown | ✅ live, eyeballed 2026-09-30 |
| E1 | Time tracking: timer on task panel, manual entries, Dashboard totals + per-member chart | ✅ shipped 2026-10-01, not eyeballed |
| E2 | Recurring tasks: Repeat selector, next occurrence spawns on completion | ✅ shipped 2026-10-01, not eyeballed |
| E3 | Docs: nested pages per space, Tiptap editor with autosave, sidebar tree, Ctrl+K | ✅ shipped 2026-10-01, not eyeballed |
| E4 | Mobile layout: sidebar drawer, snap-scroll board, wrapped My Work rows, capped modals | ✅ shipped 2026-10-01 (Playwright at 390px) |
| E4b | Landing page refresh: hero, "Try the live demo", screenshots (`public/landing/`), feature grid | ✅ shipped 2026-10-01 |
| F1 | Instant guest login: pre-seeded guest pool (`guestPool.service.ts`), claim = 1 SQL statement, refill after response | ✅ live 2026-10-06 (API 3.6 s → ~0.8 s; click → board ~2 s) |
| F2 | Calendar on phones: compact month grid with dots + day list, week = day list | ✅ live 2026-10-06 (screenshot at 390px) |
| F3 | Recurrence copies checklists (unchecked) and subtasks; repeat icon in List/Table | ✅ live 2026-10-06 |
| F4 | Portfolio: page titles/description, Open Graph + Twitter card image, README rewrite with demo GIF and fresh screenshots | ✅ live 2026-10-06 |
| G1 | Whiteboards: persisted Excalidraw boards per space, sidebar list, sticky note → task, demo brainstorm boards | ✅ live 2026-10-06 |
| G2 | Sprints: sprint lists with dates (Sprints folder), points, Complete sprint carries unfinished work, burndown + velocity report; Sprints 11–15 seeded, 14 active | ✅ live 2026-10-06 |
| G3 | Goals/OKRs: number/currency/true-false/task targets, live progress from linked tasks, Goals page, 3 demo goals | ✅ live 2026-10-06 |
| G4 | Attachments on Vercel Blob: drag-and-drop upload (4 MB max), image lightbox, download/delete, seeded demo files | ✅ live 2026-10-06 (real upload/download/delete checked) |
| G5 | Task templates: save task (+subtasks, checklists, tags) as template, picker on Board/List add rows, Templates page, 3 seeded | ✅ live 2026-10-06 |
| G6 | Forms: Form tab per list with builder, public `/forms/<slug>` link (no login), submissions create tasks, demo "Report a bug" form | ✅ live 2026-10-06 (public submit checked) |
| G7 | Board swimlanes (assignee/priority) + per-column WIP limits, seeded limits on Sprint 14 and a "By assignee" saved view | ✅ shipped 2026-10-06 |
| H1 | Custom fields per list: 8 types incl. formula (`packages/shared/src/formula.ts`), Table columns, task panel, filter/sort in saved views; 8 seeded on Sprint 14 | ✅ live 2026-10-08 |
| H2 | Workload view: per-person tasks/points by day or week, per-member capacity, red overloads, drag to reassign/reschedule | ✅ live 2026-10-08 |
| H3 | Mind Map view: zoomable tree list → statuses → tasks → subtasks (now 3 levels deep), + node creates a subtask | ✅ live 2026-10-08 |
| H4 | Chat channels per space: polling (4 s / 30 s), mentions → Inbox, threads, reactions, Turn into task; #product seeded | ✅ live 2026-10-08 |
| H5 | CSV / Trello import wizard with column mapping and bundled samples (`public/samples/`) | ✅ live 2026-10-08 |
| H6 | Public read-only share links for lists and docs (`/share/<token>`), seeded on Q4 Launch Campaign + Q4 launch plan | ✅ live 2026-10-08 (logged-out page checked) |
| H7 | Landing tabs Workload / Mind Map / Chat, README screenshots for every new feature, re-captured GIF/OG | ✅ live 2026-10-08 |

- **Repo:** `D:\projects\click-up\click-up-clone`. GitHub `alysalah83/Click-up-clone`. Production branch `master`.
- **Live:**
  - Web: https://click-up-clone-two.vercel.app
  - API: https://click-up-clone-back-end.vercel.app (`/health`)
- **Deploys:** pushing `master` deploys both apps. The API build **applies Prisma migrations to Neon automatically** (`apps/api/scripts/migrate-on-deploy.mjs`). Never ask the owner to run migrations.

## Seventh sprint (2026-10-08): seven more

H1–H7 above (`34327c4`, `f2131b3`, `8f6e2ff`, `9b57498`, `4b20354`, `357e476`, `e21a485`), plus fixes: seed transaction timeout raised to 30 s (`320136a`; the grown seed crossed Prisma's 5 s default and inline guest seeding returned 500), and chat window scroll / clipped whiteboard text / tiny mind map zoom (`99dc7e9`).
- **Other sessions share this checkout.** Stage only your own files (never `git add -A` with someone else's work in the tree). One push here also published another session's local commit `23418e8`.
- **`POOL_SEED_VERSION` is 13.** Increment it on every seed change.
- **Deploys can fail on a Neon cold start** (P1001 during `migrate-on-deploy`). Redeploy the same build: `vercel redeploy <deployment-url> --target production` from a dir linked to the project.
- **Local dev is broken by a route slug conflict:** `apps/web/src/app/api/workspaces/[id]/members/[userId]/capacity/route.ts` sits next to `[workspaceId]/tags/route.ts`; Next 16 returns 500 on every route under `next dev`/`next start` locally (production works, checked). Fix: move the capacity route under `[workspaceId]` and rename the param. Not done yet (awaiting the owner).
- **`packages/shared` must be built** (`pnpm --filter @clickup/shared build`) before API tests when shared changed. The web imports some pure shared files by path alias (`@clickup/shared/formula`, `importParse`), not as a dependency.
- **Known gaps:** custom field values aren't copied by recurrence/templates/sprint carry-over; workload capacity is the same on weekends; deeper subtasks can only be created from the Mind Map; chat edits older than the loaded 50 messages appear on reload; import samples' dates are static; the whiteboard font fix and the chat/mind map fixes were verified only by the re-captured screenshots.

## Sixth sprint (2026-10-06): seven features

G1–G7 above, one commit each on master (`eb5d8c6`, `0785811`, `b3a6f48`, `10cd063`, `2c8be83`, `9e33c68`, `36748ab`), built by one subagent at a time with a shared brief, then lint/typecheck/test/build and push. API checks after each deploy hit the live guest demo; nothing was eyeballed in a browser.
- **Guest pool seed version:** pooled guests now carry `User.poolSeedVersion`; only guests of `POOL_SEED_VERSION` (`guestPool.service.ts`, now 8) are claimed or counted. **Increment it whenever the guest seed changes**, or new guests land on the old seed. (A time cutoff was tried first and leaked old-seed guests pooled during the deploy.) The first guest after such a deploy is seeded inline (~6–10 s); the pool then refills.
- **Date shift:** `claimPooledGuest` also shifts whiteboards, sprint dates, `Task.completedAt`, goal due dates, attachments, templates and forms. New seeded tables with visible dates must be added there.
- **Blob:** store `clickup-attachments` (public, iad1) is connected to the API project; `BLOB_READ_WRITE_TOKEN` exists for Production and Preview only, so local uploads return 503 "Attachments are not configured". The API calls the Blob REST API directly (`lib/blobStorage.ts`, no `@vercel/blob`). Seeded attachments point at `WEB_URL` public files (empty `pathname` = never deleted from Blob).
- **Known gaps:** whiteboard convert pill can sit off-screen near edges; last-save-wins on boards. Burndown has no scope-change line; completing a sprint early keeps the next sprint's planned dates; empty "Sprints" section shows in Marketing. Goals: no folders, target name/value not editable after creation. Attachments: list/space deletion doesn't delete blobs. Templates: contents not editable, no template button in Calendar/Timeline. Forms: field reorder by buttons only; the web copy of form validation must stay in sync with `packages/shared/src/form.ts`; per-visitor rate limit trusts `X-Client-Ip`. Swimlanes: WIP count ignores filters, no add-task on the swimlane grid, lanes only for people with visible tasks. Landing/README screenshots predate these features (`capture-screenshots.mjs`).

## Fifth sprint (2026-10-06): portfolio pass

F1–F4 above, plus two bugs found while capturing: the Docs header said "List", and My Work/Docs dates followed the browser locale (now `en-US`).
- **Guest pool:** `User.pooledAt` / `User.landingListId` (migration `20261008120000_guest_pool`). Pool size is `GUEST_POOL_SIZE` (default 3, 0 in tests). `registerGuest` claims the newest pooled guest with `FOR UPDATE SKIP LOCKED` and shifts its seeded dates (task dates by whole UTC days, other timestamps exactly) to the claim time; if the pool is empty it seeds inline (~4–7 s) as before. Refill runs through Vercel's request-context `waitUntil` (no `@vercel/functions` dependency). The pool code is raw SQL only. The schema has no index on `pooledAt` (the pool is tiny). Unclaimed pool guests older than 7 days are removed by the normal guest cleanup.
- Three guest logins returned 500 while the deploy was rolling out; none since (sequential and 5 concurrent all 201). If 500s reappear, check the API logs on Vercel.
- **Images:** `node apps/web/scripts/capture-screenshots.mjs [baseUrl] [--only=landing,readme,gif,og]` re-captures `public/landing/*.webp`, `assets/screenshots/*.png`, `assets/demo.gif` and `src/app/opengraph-image.png` / `twitter-image.png` from the live demo. Re-run after visible UI changes.
- **Known gaps:** at desktop widths around 1280px with the sidebar open, the Calendar month grid scrolls sideways (Saturday is clipped), and continuation chips of multi-day tasks have no text. The "Guest xxxx" name shows in activity feeds. Not checked: link previews on LinkedIn (use https://www.linkedin.com/post-inspector/ after deploy to refresh its cache).

## Fourth sprint (2026-10-01)

E1–E4b shipped, plus the empty Automations dialog fix (an open Saved-views popover was dismissing it via focus-outside). Known gaps: "this week" is a rolling 7 days; recurrence creates only the next occurrence and doesn't copy subtasks/checklists; repeat icon only on board cards; one-running-timer is service-enforced only; Calendar keeps an 840px min width on phones; landing screenshots need re-capturing if the UI changes (Playwright against the live guest demo). Nothing from this sprint was eyeballed in a real browser. Local dev DB `clickup` is WIN1252 and rejects emoji seeds; use a UTF-8 database.

## Third sprint (2026-09-30)

D1–D5 built by parallel subagents, merged, then walked through on the live guest demo (Board, task panel, Timeline, filters + saved views, Automations, My Work, Inbox, Dashboard, Teams). Fixes: three Next proxy routes (dashboard burndown, dependencies, saved-views) had never been committed and 404ed in production (task panel showed "Something went wrong"); view tabs now only show on list routes; header toolbar stacks until `xl`; saved-views popover widened; pie animation off. Not checked: drag on Timeline, phone width, light theme (pane screenshots stall). Known: opening Automations while the Saved views popover is open renders an empty dialog body.

## Where the sprint chat stopped (2026-09-30)

- Steps 0–3 are merged to master and deployed. The owner asked for **less process**: skip spec/plan docs and manual browser runs, keep tests essential, ship features.
- Seeds: `apps/api/src/seed/demoWorkspace.ts` (stable keys), `demoTeammates.ts`; all written in one transaction in `registerGuest` (`apps/api/src/services/user.service.ts`).
- Known gaps to pick up:
  - Table and List views don't open the task panel yet (Board and Calendar do).
  - No UI for checklist-item assignees, renaming checklists, or renaming/deleting tags (API exists).
  - Invites always grant `member` and are reusable for 7 days; guests joining by invite show as "Guest xxxx".
  - Dashboard status pie groups by status name (~15 slices with the seed).
  - Guest cleanup deletes real users' rows created inside a purged guest's workspace (by design).
  - The new UI (Teams, picker, task panel) has not been eyeballed in a browser; do a quick visual pass first thing.

## Rules for every chat

- **One step per chat.** Chats run out of context; small steps finish cleanly.
- **Process:** minimal. No spec or plan docs, at most 2 agents at once (sharing one checkout and one install), run the checks, ship.
- **Owner preferences:**
  - This is a portfolio flagship; recruiters click the **guest demo** alone, so **visible features first**.
  - Keep the ClickUp look.
  - Hosting stays free with no credit card: Vercel + Neon, **no WebSockets/real-time**.
  - The owner wants me to merge and push `master` myself once a step's work is reviewed and green. Say it clearly in chat when doing it.
- **Commits** end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Before finishing a chat:** update this file, and the memory note `flagship-roadmap.md` if the state changed.

---

## Step 0: Ship A4 (short chat) ✅

**Prompt to paste:**
> Read docs/HANDOFF.md. Do Step 0: fast-forward master to a4-web-fixes, push, then verify the live site and API.

**What to do:**
1. `git checkout master && git merge --ff-only a4-web-fixes && git push origin master`
2. Wait for the deploy. Poll `https://click-up-clone-back-end.vercel.app/health` and the web `/login` page.
   - The API build applies the `Status.createdAt` migration, which is additive and safe.
3. Verify on the live site as a guest:
   - The header shows the real title.
   - Clicking a board card opens the details.
   - Calendar drag works.
   - The dashboard pie has stable colors.
   - The sidebar lists load.
4. Check the GitHub Actions run, including the new `e2e` job; it has **never run on a real runner**. If it fails, fix it in this chat.
5. Leftovers from A4 to fix if time allows, otherwise carry them to Step 1:
   - The sidebar "Create task" can double-submit.
   - The gear button opens a second detail modal; remove it, since card click is the main path now.
   - The dead zustand `*Sorts` slots.
   - `WorkspaceWithLists.lists` duplicates the `List` type.
   - A dev-only "No queryFn" warning for the header title.

---

## Spec B: Collaboration core, split into chat-sized steps

The order is chosen so the demo improves visibly after every step.

### Step 1: Demo workspace seeding ✅ (biggest recruiter impact)

**Prompt:**
> Read docs/HANDOFF.md. Do Step 1: brainstorm, spec, plan and build the guest demo workspace seeding.

**Goal:** "Continue as Guest" lands in a realistic, ready team workspace instead of an empty screen and a wizard.

**Scope ideas to settle in brainstorming:**
- A seed template in the API: 2 spaces (e.g. "Product", "Marketing"), 3–4 lists, custom statuses, and about 60–100 realistic tasks across statuses, priorities and dates (overdue, today, next week).
- Seeding happens in one transaction when the guest registers. It must be fast: batched `createMany`, with a target under 1 s.
- Skip the onboarding wizard for seeded guests. Keep the wizard for real sign-ups.
- The daily guest cleanup (the cron) must still delete all seeded data. Test it.
- Fake teammates come in Step 2. Design the seed so assignees can be added then.

**Done when:** a new guest sees a full Board, Table, Calendar and Dashboard within a few seconds, with tests for the seed and the cleanup.

### Step 2: Workspace membership, Teams page, assignees ✅

**Prompt:**
> Read docs/HANDOFF.md. Do Step 2: workspace members/roles, Teams page, task assignees.

**Scope:**
- **Data model:**
  - `WorkspaceMember(userId, workspaceId, role: owner | admin | member | guest)`
  - `TaskAssignee(taskId, userId)`
  - A migration that backfills an owner membership from the current `Workspace.userId`.
- **API authorization:** `assertCanAccess()` (`apps/api/src/services/access.service.ts`) moves from "owns the row" to "is a member with role X" (ADR 0003 anticipated this).
  - Every list, status and task query must scope by membership, not `userId`.
  - Keep the cross-account tests, and add member vs non-member tests.
- **Invites:** an invite link with a token and expiry, and an accept flow. **Demo trick:** an "Open as teammate" button that creates an invite link to open in an incognito window, so a recruiter can test two accounts alone.
- **Seeded teammates** (from Step 1): 5–6 fake members with avatars, assigned across tasks.
- **UI:**
  - A **Teams** sidebar item with members, roles and invite.
  - Assignee avatars on cards, table and list rows.
  - An assignee picker (reusing the Menu facade).
  - Filter or group by assignee on the Board if cheap.

### Step 3: Rich task page ✅

**Prompt:**
> Read docs/HANDOFF.md. Do Step 3: the ClickUp-style task page.

**Scope:**
- The existing card-click detail modal becomes a ClickUp-style split panel:
  - title,
  - status / priority / dates / assignees,
  - **rich-text description** (e.g. Tiptap),
  - **subtasks** (parent `taskId`),
  - **checklists**,
  - **tags** (per workspace, colored),
  - an **activity log** (who changed what, stored in an `Activity` table written by the API services).
- Optional: a deep-linkable URL `/home/lists/:listId/task/:taskId`.

### Step 4: Comments and @mentions ☐

**Prompt:**
> Read docs/HANDOFF.md. Do Step 4: comments with @mentions and reactions on the task page.

**Scope:**
- A `Comment` table with threaded replies.
- `@mention` parsing that feeds notifications.
- Emoji reactions.
- Seeded demo comments so the feature is visible immediately.

### Step 5: Home / My Work ☐

**Prompt:**
> Read docs/HANDOFF.md. Do Step 5: Home / My Work page.

**Scope:**
- A sidebar **Home** page showing tasks assigned to me, grouped into Overdue, Today and Next 7 days, plus Recently updated.
- Quick status and priority changes inline.
- Uses the assignees from Step 2.

### Step 6: Inbox notifications ☐

**Prompt:**
> Read docs/HANDOFF.md. Do Step 6: Inbox notifications (no real-time).

**Scope:**
- A `Notification` table, written by the API on assign, mention, and status change of tasks I follow.
- A sidebar **Inbox** with an unread badge and mark-read or mark-all.
- Updates by **polling every 30–60 s plus refetch-on-focus** (React Query `refetchInterval`), never WebSockets.
- Seeded demo notifications.

---

## After Spec B: later phases (see `docs/roadmap.md`)

Brainstorm each as its own spec when you get there:
- **Ctrl+K command palette:** Postgres full-text search, keyboard shortcuts.
- **Gantt / Timeline view:** dependency arrows, drag to reschedule.
- **Filters, group-by and saved views;** a virtualized list for 10k tasks.
- **Claude-powered AI** (use the `claude-api` skill): summarize a task or thread, generate subtasks, "ask my workspace".
- **Automations:** a trigger → condition → action builder, using Vercel Cron or queued jobs, free-tier only.
- **Docs;** whiteboards saved per workspace.
- **Dashboards 2.0:** configurable cards, sprint burndown, Goals.

## Reference

| What | Where |
|---|---|
| Roadmap | `docs/roadmap.md` |
| Foundation spec | `docs/superpowers/specs/2026-09-28-foundation-design.md` |
| Plans A1–A4 | `docs/superpowers/plans/` |
| Decisions | `docs/adr/0001-monorepo.md`, `0002-adopt-shadcn-ui.md`, `0003-api-layering-and-validation.md` |
| API dev/test guide | `apps/api/README.md` |
| Execution ledgers (git-ignored, local) | `.superpowers/sdd/<plan-name>/progress.md` |

## Local development

```bash
pnpm install
pnpm --filter @clickup/api db:local          # embedded Postgres :54329 (keep running)
pnpm --filter @clickup/shared build
pnpm --filter @clickup/api exec prisma migrate deploy   # DATABASE_URL/DIRECT_URL = local DB
pnpm --filter @clickup/api dev               # :5000
pnpm --filter @clickup/web dev               # :3000
```

- `apps/api/.env` and `apps/web/.env.local` exist locally (git-ignored).
- **Tests:**
  - Everything: `pnpm lint && pnpm typecheck && pnpm test && API_URL=http://localhost:5000/api JWT_SECRET=x pnpm build`
  - API: its tests boot their own Postgres on :54330. **Run only one API test run at a time.**
  - Web E2E: `pnpm --filter @clickup/web test:e2e`.
- **Windows:** if Postgres won't start (EPERM or "shared memory"), run `taskkill //F //IM postgres.exe` and delete `apps/api/.tmp/pg-test*`. Never delete `.tmp/pg-dev`.
- **Claude Desktop browser pane:** it can show stale screenshots and stall CSS animations while hidden. For UI checks, inject `*{animation:none!important;transition:none!important}`, click by element ref, and read state from the DOM.

## Owner's to-do

- [ ] Vercel → API project → add `ANTHROPIC_API_KEY`, redeploy. Without it the AI buttons show "AI is not configured".
- [ ] Not yet restyled: task panel, badges, empty/loading states. Nothing from the second sprint was eyeballed in a browser; do a visual pass first.

- [x] `CRON_SECRET` is set on the API project (seen 2026-10-06).
- [ ] Optional: archive the old `Click-up-clone-back-end` GitHub repo.
