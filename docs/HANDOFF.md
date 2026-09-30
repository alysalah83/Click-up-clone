# Handoff: next steps for new chats

Last updated: 2026-09-30 (second sprint: Steps 4–6, shadcn restyle, palette, AI shipped). **Every new chat starts by reading this file.** At the end of each chat, update the "Current state" table and tick the step you finished.

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

- **Repo:** `D:\projects\click-up\click-up-clone`. GitHub `alysalah83/Click-up-clone`. Production branch `master`.
- **Live:**
  - Web: https://click-up-clone-two.vercel.app
  - API: https://click-up-clone-back-end.vercel.app (`/health`)
- **Deploys:** pushing `master` deploys both apps. The API build **applies Prisma migrations to Neon automatically** (`apps/api/scripts/migrate-on-deploy.mjs`). Never ask the owner to run migrations.

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
- **Process:**
  1. `superpowers:brainstorming`: short, and ask the owner only what matters.
  2. Spec in `docs/superpowers/specs/`.
  3. `superpowers:writing-plans`: plan in `docs/superpowers/plans/`.
  4. `superpowers:subagent-driven-development`: one implementer and one reviewer per task, a final review, one fix wave.
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

- [ ] Vercel → API project → Environment Variables: add `CRON_SECRET` (any long random string), then redeploy. Until then, the daily cleanup of old guest accounts doesn't run.
- [ ] Optional: archive the old `Click-up-clone-back-end` GitHub repo.
