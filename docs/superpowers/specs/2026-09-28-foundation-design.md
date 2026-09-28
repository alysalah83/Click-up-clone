# Spec A — Foundation (Phase 0)

- **Date:** 2026-09-28
- **Status:** Approved in brainstorming, pending written-spec review
- **Roadmap:** see `docs/roadmap.md`. This is the first of two specs in cycle 1. Spec B, "Collaboration core" (Teams, My Work, Task page, Inbox), follows.

## 0. Amendments (2026-09-28, made while writing the plans after reading the code)

These override the sections below where they conflict.

1. **Login token stays in the API response body.** Login and register responses keep returning the token in the JSON body. The browser never calls the API: the Next.js server reads the token from the body and sets its own httpOnly cookie. No API `logout` endpoint is added; the front end already signs out by deleting its own cookie.
2. **No `{ data }` envelope.** Success response shapes stay as they are. The two apps deploy separately, so wrapping every response would break production in the window between the API and web deploys.
3. **Rate limiting is keyed by email for login, plus a global cap on guest sign-ups.** Every API request comes from the Next.js server, so every request carries the same IP and limiting by IP would limit all users at once. Details:
   - Login: `express-rate-limit`, keyed by lowercase email.
   - Register: the same, keyed by email.
   - Guest sign-up: a global cap per minute.
4. **Status model: add `type` + `isDefault`; drop reordering.**
   - `type` is `open | active | done`. `isDefault` is backfilled for the three built-in statuses; default statuses cannot be deleted.
   - A rename/recolor endpoint is added. Reordering is dropped from Foundation, and the README won't claim it.
   - Default order values (100 / 200 / 100000) stay unchanged, so the current web app keeps working. The web app switches to `type` in Plan A4.
5. **`@prisma/adapter-pg` is kept.** A plain-Postgres adapter is needed for local and test databases. `lib/prisma.ts` uses the Neon adapter for `*.neon.tech` URLs and `pg` otherwise. Tests and local development use `embedded-postgres`, because Docker is not installed. CI uses a Postgres service container.
6. **Server-side limits match the current web forms**, so no valid form input starts failing. Names:
   - list and workspace: max 320
   - task: max 128
   - user: 2–120

   Password is 6–320 characters; email is max 100.
7. **The spec is delivered as four plans:**
   - A1: monorepo + CI skeleton
   - A2: API hardening
   - A3: shadcn/ui migration
   - A4: web fixes + E2E + README

   A3 and A4 are written after A1 lands, because they depend on its paths.
8. **Monorepo home.** The front-end GitHub repo is renamed to `click-up-clone` and becomes the monorepo, so existing links redirect. The back-end repo is archived with a pointer to it. The local working copy is a fresh clone at `D:\projects\click-up\click-up-clone`, and the two old folders are kept untouched as a backup.

## 1. Goal

Turn the two-repo ClickUp clone into a clean, secure, tested monorepo that a reviewer can trust. Spec B then builds multi-user features on top of it.

The **visual identity does not change**. The design stays deeply based on the real ClickUp and on the current app theme. This spec improves behavior, accessibility, security and code quality, not looks.

## 2. Constraints

- **Free hosting only, no credit card.** Both apps stay on Vercel (serverless); the database stays on Neon.
- **No real-time features** (WebSockets, SSE, presence) anywhere in this cycle.
- **Portfolio context.** Recruiters use the guest demo alone. First-load speed and a working demo path matter more than rarely used edge features.
- The original custom UI library must stay in the repo as a documented showcase (interview talking point), even though the app stops using it.

## 3. Current state (summary of the 2026-09-28 audit)

- `Click-up-clone-front-end`: Next 16, React 19 with the React Compiler, Tailwind v4, React Query 5, Zustand, RHF + zod 4, dnd-kit, recharts, and Excalidraw. The app calls the API through a backend-for-frontend layer (Server Actions plus 2 route handlers, with axios forwarding the cookie). The UI library is about 20 hand-built components (~3.4k lines). There are 12 tests.
- `Click-up-clone-back-end/Back-end`: Express 5, TypeScript, Prisma 7 with the Neon adapter, and JWT-cookie auth with guest mode. Controllers call Prisma directly. There is no validation library, no tests, no CI and no seed data. The repo also contains a stale, empty `Front-end/` git-submodule pointer.
- The README claims features that do not exist: real-time whiteboard, assignees, keyboard navigation, status rename/reorder, searchable icon picker, and mutation tests.

## 4. Design

### 4.1 Repo and tooling

```
click-up/
├─ apps/web                  Next 16 front end → Vercel project (root dir = apps/web)
├─ apps/api                  Express 5 API     → Vercel project (root dir = apps/api)
├─ packages/shared           zod schemas + inferred TS types used by web AND api
├─ packages/legacy-ui        original component library (archived showcase)
├─ docs/adr/                 architecture decision records
├─ docs/superpowers/specs/   design specs
└─ .github/workflows/ci.yml
```

- **Merging the repos.** Both repos are imported with `git subtree add`, which keeps each repo's history. The back end's `Back-end/` folder becomes `apps/api`. Its stale `Front-end/` submodule pointer is dropped.
- **Workspace tooling.** pnpm workspaces and Turborepo, with one `pnpm-lock.yaml`; `package-lock.json` files are deleted. Turborepo tasks are `lint`, `typecheck`, `test`, `build` and `dev`.
- **Shared package.** `packages/shared` exports zod schemas for every request body and query, plus DTO types. Both apps import it, so the web and API types cannot drift apart.
- **Lint.** ESLint 9 flat config per app; the web `lint` script changes from the removed `next lint` to `eslint .`. There is one root Prettier config.
- **Cleanup.**
  - Add a `.env.example` per app.
  - Remove unused dependencies: `mongoose`, `pg`, `@prisma/adapter-pg`, `@prisma/extension-accelerate`, `nodemon` and `ts-node-dev` from the API; `react-icons` star-imports are narrowed.
  - Fix the misspelled `types/exporess.d.ts` filename, the folder named `SideNav.tsx/`, and the tooltip filename that contains a space.
- **Vercel.** Each project gets its own root directory. The API replaces its legacy `builds` config with the current Express-on-Vercel setup. The environment variables stay the same.

### 4.2 UI system

- **Tokens.** shadcn/ui is set up on Tailwind v4 with semantic CSS variables: `--background`, `--surface`, `--surface-raised`, `--border`, `--foreground`, `--muted-foreground`, `--primary` (ClickUp purple), `--destructive`, plus the status and priority colors. Each is defined once for light and once for dark, with values taken from the current palette (`neutral-925`, `neutral-750`, and so on). The paired `dark:` classes are removed.
- **Component swaps (old → shadcn).**
  - `MenuCompound` → DropdownMenu for action menus (options, sort), and Popover for pickers (status, priority, date, icon)
  - `DropdownCompound` (hover-reveal rows) → plain CSS `group-hover` with `focus-within`, so it also opens on keyboard focus
  - `ModalCompound` → Dialog
  - `DeleteConfirm` → AlertDialog, with correct entity names in the copy
  - `ToolTipCompound` → Tooltip
  - `ToastsManger` / `window.toast` → Sonner
  - `CheckBox` → Checkbox
  - `DateRangePicker` and `task/DatePicker` → one Calendar + Popover component
  - `IconPicker` → Popover + Command with search + a virtualized grid
  - `ColorsPicker` → ToggleGroup
  - `SkeletonLoader` → Skeleton
  - SideBar / SideNav → the shadcn Sidebar layout, restyled to the current look
- **Dead code removed.** `GlobalModal` (never mounted) and the other dead code listed in the audit.
- **Accessibility target.**
  - Every interactive element is keyboard-reachable.
  - Menus and dialogs close on Escape, keep focus inside while open, and return focus to their trigger when closed.
  - Correct ARIA roles and no clickable `div`s.
  - No buttons nested inside links.
  - Tooltips open on keyboard focus too.
- **Visual parity.** Before/after screenshots of Board, List, Table, Calendar, Dashboard, the sidebar and onboarding must match apart from polish, such as focus rings and animation.
- **Legacy library.**
  - `packages/legacy-ui` holds the original components unchanged, with their existing tests and a README describing the design (compound components, portals, positioning).
  - A dev-only showcase route (`/legacy-ui`) renders them.
  - The decision is written up in `docs/adr/0002-adopt-shadcn-ui.md`: why the library was built, what it taught, its keyboard and focus gaps, and why a maintained headless library serves users better.

### 4.3 API structure and security

- **Layers.** routes → controllers (HTTP only) → services (business logic + Prisma). Only services import Prisma.
- **Validation.** A `validate({ body, query, params })` middleware uses the `packages/shared` schemas. Failures return 422 with a list of field errors. Every success response uses the same envelope, `{ data }`, and errors keep the existing `{ success: false, error }` shape.
- **Explicit field lists.** No `req.body` is ever spread into Prisma `data`. Every update schema lists its allowed fields. This fixes `updateList`, `updateWorkspace` and `createWorkspaceFlow`.
- **Authorization.**
  - An `authorize` service helper (`assertCanAccess(userId, { workspaceId | listId | statusId | taskId })`) checks every foreign key a request references, on both create and update.
  - It also rejects a task whose status belongs to a different list.
  - Spec B re-implements this helper around workspace membership and roles; its callers do not change.
- **Leaks closed.**
  - The arbitrary `?select=` is removed and replaced with fixed response shapes.
  - `GET /users/:id` is removed; Spec B adds a members endpoint scoped to shared workspaces.
  - Login returns one generic 401 for a wrong email or a wrong password.
  - The token is no longer returned in response bodies.
- **Auth hardening.**
  - `POST /users/logout` clears the cookie.
  - The JWT lifetime drops to 7 days.
  - Startup fails fast if `JWT_SECRET` is missing.
  - `helmet` is added.
  - `express-rate-limit` is applied to login, register and guest register. It uses the in-memory store, and the ADR notes that on serverless this limit applies per instance.
  - CORS allows `PATCH`.
- **Status model.**
  - Add `type` enum `open | active | done` in place of the magic order values 100 / 200 / 100000.
  - Deleting a status reassigns its tasks to the list's first `open` status inside a transaction; the cascade delete is removed.
  - New endpoints: `PATCH /statuses/:id` (rename, icon, color) and `PATCH /statuses/reorder`.
- **Database.**
  - Add indexes on `Task(listId)`, `Task(statusId)`, `Task(userId)`, `List(workspaceId)`, `List(userId)`, `Status(listId)` and `Workspace(userId)`.
  - Drop the redundant `@@unique([id, userId])` on List.
  - Add cursor pagination to the task and list collection endpoints (`?limit=` defaults to 500 and is capped at 1000, so current views still make a single request).
- **Bug fixes.**
  - `deleteManyTasks` now reads the correct route param.
  - `deleteWorkspace` runs inside a transaction, in order.
  - `getStatusTasksCount` counts tasks, not statuses.
  - `findFirst` handlers return 404 when nothing is found.
  - Status codes are corrected (400 vs 401 vs 409 vs 422).
  - The guest cookie is set only once.
- **Guest housekeeping.**
  - A Vercel Cron job (`GET /internal/cron/cleanup-guests`, protected by `CRON_SECRET`) deletes guest users older than 7 days, along with their data.
  - A `GET /health` endpoint lets the landing and login pages warm up the API on load.

### 4.4 Front-end fixes

- **Auth proxy.**
  - An invalid or expired token clears the cookie and redirects exactly once, so there is no redirect loop.
  - Cookie `maxAge` is set in seconds (7 days) with `sameSite: "lax"`.
  - A guest with an invalid token gets a new guest session.
- **Workspace avatar.** The PATCH no longer fires on mount, and a changed icon or color is saved.
- **Sidebar "+ task".** It resolves the clicked list's own open status on the server.
- **Board.** Dropping a card on its own column is a no-op (compare IDs, not objects). Clicking a card opens the task detail.
- **Calendar.**
  - Use a DragOverlay instead of the invalid `transform3d`.
  - Correct the grab offset when dragging a multi-day segment.
  - Remove the `setValue` call during render and the stray `console.log`.
  - Show the Sort control on the calendar where it applies.
- **Dashboard.** Status colors come from each status's stored color, not random colors.
- **React Query.**
  - Toasts move out of render and into query `onError` or effects.
  - The mutation hooks share one query-key factory.
  - `useAddTask` writes to the correct key.
  - `cancelQueries` is awaited.
  - Devtools render only in development.
- **Performance.** The sidebar and lists-summary N+1 fetches become single aggregated endpoints.
- **Header.**
  - Show the user or guest badge instead of "Sign In".
  - The title shows the current list or page name instead of the hard-coded "Workload".
  - The view tabs no longer wrap at narrow widths.
- **Copy fixes.** The "Space settings" tooltip, the signup password hint (6 vs 8 characters), and the not-found page.

### 4.5 Tests, CI, docs

- **API tests.**
  - Vitest + supertest against a real Postgres (the GitHub Actions `services: postgres` container; locally, Docker or a Neon branch).
  - Covered: auth flows, rate-limit wiring, authorization (user A cannot read or modify user B's workspace, list, status or task), validation errors, and each endpoint's happy path.
- **Web unit tests.** Vitest + RTL for hooks (optimistic mutations), utils and the new shared components' key behavior.
- **E2E tests.** Playwright against the local web + API: guest login → onboarding wizard → create task → drag across board columns → table bulk status change → calendar reschedule → logout.
- **CI.** `.github/workflows/ci.yml` runs install, lint, typecheck, test (with the Postgres service) and build on every PR and every push to `main`. Playwright runs in the same workflow.
- **README.**
  - An honest feature matrix (built vs roadmap).
  - An architecture diagram, a demo GIF and a "Try the guest demo" link.
  - Setup steps, and links to the ADRs.
  - A **Project evolution** section (v1: custom UI library, two repos → v2: monorepo, shadcn, hardened API, tests).
- **ADRs.**
  - `0001-monorepo.md`
  - `0002-adopt-shadcn-ui.md`
  - `0003-api-layering-and-validation.md`

## 5. Out of scope (for this spec)

- Membership, roles, invites, assignees, comments, the task page redesign, My Work and the Inbox. These are all Spec B.
- Real-time, automations, AI, Gantt, Docs and Dashboards 2.0 (later roadmap phases).
- Any visual redesign.

## 6. Success criteria

1. One repo. `pnpm install && pnpm turbo build` succeeds, and both Vercel projects deploy from it.
2. CI is green, with API authorization tests proving cross-user access is rejected.
3. The Playwright demo path passes.
4. No custom UI component from the old library is imported by `apps/web`, and `packages/legacy-ui` renders on its showcase route.
5. Every audited bug in §4.3 and §4.4 is fixed, and each has a test where practical.
6. Keyboard-only walkthrough: you can open and close every menu and dialog, change a task's status, and create a task without a mouse.
7. Guest login takes under 3 seconds on a warm API. The landing page's warm-up call makes this the normal case.
8. The README claims nothing that is not built.
