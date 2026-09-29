# Step 1: Demo workspace seeding

Date: 2026-09-30. Status: implemented on branch `step1-demo-seed`.

## Goal

"Continue as Guest" lands on a full, realistic Sprint Board instead of an empty screen and the onboarding wizard. Real sign-ups keep the wizard.

## Decisions

- **Template as data.** `apps/api/src/seed/demoWorkspace.ts` holds the template: 2 spaces (`Workspace` rows, "Product" and "Marketing", each with its own `Avatar`), 4 lists (Sprint Board, Bug Tracker, Content Calendar, Q4 Launch Campaign), 4 custom statuses per list and 80 tasks. Every space, list, status and task has a stable `key`, so Step 2 (assignees) and Step 3 (subtasks, tags) can attach data by key.
- **Status shape follows the app's rules.** Per list: exactly one `open` status (order 100, `isDefault`), one default `active` status (order 200, `isDefault`, which the Calendar's quick-add relies on), one extra custom `active` status (order 300, deletable), and one `done` status (`HIGHEST_ORDER`, `isDefault`). Icons are `circleDotted` / `inProgress` / `complete` or `react-icons/ti` names; colors are existing color tokens.
- **Dates relative to seed time.** Offsets are whole days from today, stored at 12:00 UTC (the same calendar day in almost every timezone). Every dated task has both `startDate` and `endDate` (single-day tasks have them equal), because the List view and Calendar need them. The mix covers overdue, today, this week, next weeks, multi-day ranges and undated tasks; most done tasks are in the past. All five priorities are used. `createdAt` is set explicitly so spaces and lists keep template order in the sidebar and tasks have a believable history.
- **Pure builder + one transaction.** `buildDemoWorkspace(userId, now, template)` turns the template into rows with UUIDs generated in JS. `registerGuest` writes the user (`hasOnBoarded: true`) and all rows in one batched `$transaction`: user create + 5 `createMany` calls, i.e. 8 round trips including BEGIN/COMMIT. Any failure rolls back everything, so no guest exists without its seed.
- **Landing.** `POST /api/users/register/guest` also returns `landingListId` (the Sprint Board). The web action redirects to `/home/lists/<id>/board`, falling back to `/home/lists`.
- **Cleanup.** `deleteStaleGuests` already deletes by owner (tasks, statuses, lists, workspaces, their avatars, user). A test proves a seeded stale guest leaves zero rows.

## Out of scope

Fake teammates and assignees (Step 2), subtasks, tags and comments (Steps 3–4).

## Tests

Kept minimal at the owner's request: one API test registers a guest and checks the seed (counts, statuses of the task's own list, all priorities, landing list, template order through `GET /api/workspaces`, invisible to another guest); one cron test proves a stale seeded guest leaves zero rows in every table. The Playwright demo path now starts from the seeded Sprint Board instead of the wizard.
