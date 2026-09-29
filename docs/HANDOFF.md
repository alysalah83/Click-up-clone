# Handoff: where the flagship upgrade stands

Last updated: 2026-09-29. Read this first in a new chat.

## TL;DR

- **Repo:** `D:\projects\click-up\click-up-clone`, a pnpm + Turborepo monorepo.
  - GitHub: `alysalah83/Click-up-clone`
  - Production branch: `master`
- **Live:**
  - Web: https://click-up-clone-two.vercel.app (Vercel root `apps/web`)
  - API: https://click-up-clone-back-end.vercel.app (Vercel root `apps/api`, `/health` → `{"ok":true}`)
- **Deploys:** pushing `master` deploys both apps. **The API build applies Prisma migrations to Neon automatically** (`apps/api/scripts/migrate-on-deploy.mjs`, production builds only). Never run migrations by hand.
- **Done and live:** Plan A1 (monorepo + CI), A2 (API hardening), A3 (shadcn/Radix overlays behind the old APIs).
- **In progress:** Plan A4 on branch **`a4-web-fixes`** (not pushed). Tasks 1–6 are done and reviewed; **Tasks 7, 8 and 9 remain**.
- **After A4:** start **Spec B: Collaboration core**. These are the visible features the owner is waiting for.

## Owner preferences (important)

- This is a **portfolio flagship**. Recruiters click the guest demo alone, so visible, impressive features matter most. The owner was frustrated that A1–A3 changed nothing visible, so **prioritise user-visible features after A4.**
- Keep the ClickUp look (current dark/light theme); don't redesign.
- **Hosting must stay free with no credit card:** Vercel + Neon. **No real-time/WebSockets for now.**
- The owner prefers that I handle deploys: merge and push `master`, with migrations automatic. Confirm first when something is destructive.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Key documents

| What | Where |
|---|---|
| Roadmap (all phases) | `docs/roadmap.md` |
| Foundation spec (A1–A4), incl. §0 amendments | `docs/superpowers/specs/2026-09-28-foundation-design.md` |
| Plans | `docs/superpowers/plans/2026-09-28-a1-monorepo.md`, `…-a2-api-hardening.md`, `2026-09-29-a3-shadcn-ui.md`, `2026-09-29-a4-web-fixes-e2e.md` |
| Decisions | `docs/adr/0001-monorepo.md`, `0002-adopt-shadcn-ui.md`, `0003-api-layering-and-validation.md` |
| API dev/test guide | `apps/api/README.md` |
| A4 execution ledger (git-ignored, local only) | `.superpowers/sdd/2026-09-29-a4-web-fixes-e2e/progress.md` |
| A4 findings: current code + fix direction per item, referenced by the plan (git-ignored) | `.superpowers/sdd/2026-09-29-a4-web-fixes-e2e/findings.md` |

## How to resume A4

1. `git checkout a4-web-fixes`
2. Use **superpowers:subagent-driven-development** with plan `docs/superpowers/plans/2026-09-29-a4-web-fixes-e2e.md`.
   - The ledger shows Tasks 1–6 complete; start at Task 7.
   - Task briefs `task-7-brief.md`, `task-8-brief.md` and `task-9-brief.md` are already in the ledger folder.
3. The remaining tasks:
   - **Task 7:** header shows the real page/list title, a guest "Sign up to save your work" link, view tabs that don't wrap, copy/a11y fixes (findings §12), and an API warm-up ping (findings §13: `app/api/warmup/route.ts` plus an `ApiWarmup` client component).
   - **Task 8:** Playwright end-to-end test of the guest demo path, plus a CI `e2e` job (findings §14). Chromium is already cached at `C:\Users\alysa\AppData\Local\ms-playwright`.
   - **Task 9:** honest README rewrite (feature table Built/Roadmap, Mermaid architecture, highlights, local dev, project evolution), plus a cleanup of the legacy lint override.
4. Then: a final whole-branch review on the most capable model, one fix wave, and a scoped re-review. After that, fast-forward `master`, push, and verify the live site.
   - A4 includes a new migration, `Status.createdAt`, which is applied automatically on deploy.

### A4 deferred minors (for the final review to triage)

- Task 1: the "no open status" error in the create-task-in-list action is a plain `Error`, so it shows a generic toast.
- Task 2: the gear button (`TaskOptionsButton`) still opens a second, redundant detail modal; card click is now the main path.
- Task 3: the zustand `*Sorts` store slots are write-only dead state (URL params drive sorting).
- Task 6: `WorkspaceWithLists.lists` duplicates the `List` type inline. `getWorkspaceLists` / `lists-${workspaceId}` is still used by the delete-workspace flow.

### Known deferred items from A3 (not blocking)

- ARIA attributes sit on the trigger wrapper span/div instead of the inner button. The fix: let `ButtonIcon`/`Avatar` accept `ref` (React 19) and use `asChild`.
- Each tooltip has its own `Tooltip.Provider`, so adjacent tooltips don't get Radix's skip-delay.
- In a dialog, if the user clicks inside with the mouse and then presses Escape, focus goes to `body`. This is the side effect of skipping focus-return after a pointer close.

## Local development

```bash
pnpm install
pnpm --filter @clickup/api db:local          # embedded Postgres :54329 (keep running)
pnpm --filter @clickup/shared build
pnpm --filter @clickup/api exec prisma migrate deploy   # with DATABASE_URL/DIRECT_URL of the local DB
pnpm --filter @clickup/api dev               # :5000
pnpm --filter @clickup/web dev               # :3000
```

- `apps/api/.env` and `apps/web/.env.local` already exist locally (git-ignored).
- A local test account with sample data exists. Its credentials are in the session scratchpad file `local-demo-account.txt`; if that file is gone, register a new user through the API.
- Tests:
  - API: `pnpm --filter @clickup/api test`, which boots its own Postgres on :54330. **Run only one at a time.**
  - On Windows, if Postgres won't start (EPERM or "shared memory"), run `taskkill //F //IM postgres.exe` and delete `apps/api/.tmp/pg-test*`. Never delete `.tmp/pg-dev`.
  - Everything: `pnpm lint && pnpm typecheck && pnpm test && API_URL=http://localhost:5000/api JWT_SECRET=x pnpm build`
- The browser pane in Claude Desktop may not repaint when hidden, which gives stale screenshots and stalled CSS animations. For manual UI checks, inject `*{animation:none!important;transition:none!important}`, click via element refs, and read state from the DOM.

## Owner's to-do

- [ ] Add `CRON_SECRET` (any long random string) to the **API** Vercel project's environment variables, then redeploy. Until then, the daily cleanup of old guest accounts is off.
- [ ] Optional: archive the old `Click-up-clone-back-end` GitHub repo.

## Next: Spec B, Collaboration core (visible features)

This was agreed in brainstorming on 2026-09-28. Brainstorm the details, then write the spec and plans.

1. **Demo workspace seeding (highest recruiter impact).**
   - "Continue as Guest" lands in a realistic team workspace instead of an empty screen and a wizard.
   - The workspace has 5–6 fake teammates with avatars and about 100 realistic tasks spread across statuses, priorities, dates, assignees and comments.
2. **Workspace membership and Teams page.**
   - Members and roles (Owner, Admin, Member, Guest).
   - Invite by link, including an **"Open as teammate"** incognito demo link.
   - User groups.
   - `assertCanAccess()` in the API switches from ownership checks to membership plus role (see ADR 0003).
3. **Richer tasks:** multiple assignees (avatars on cards), description (rich text), subtasks, checklists, tags, and an activity log.
4. **ClickUp-style task page:** a split panel opened on card click, with comments, @mentions, reactions, attachments and activity.
5. **Home / My Work:** Today, Overdue and Next, for tasks assigned to me.
6. **Inbox:** notifications for assigned, mentioned and updated. Polling or refetch-on-focus only, no real-time.

Sidebar target (ClickUp 4.0 style): Home/My Work · Inbox · Teams · Dashboards · Docs · Whiteboards · Goals · Automations · AI. See `docs/roadmap.md` for the later phases: Ctrl+K search, Gantt/Timeline, automations, Claude-powered AI, Docs, Dashboards 2.0.
