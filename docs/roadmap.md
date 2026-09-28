# ClickUp Clone — Flagship Roadmap

**Constraints:**
- Free hosting, with no credit card (Vercel + Neon).
- No real-time features for now.
- The design follows real ClickUp and the current theme.

**Audience:** recruiters exploring the guest demo on their own.

## Cycle 1 (current)

| Spec | Scope | Status |
|---|---|---|
| A: Foundation | Monorepo, shadcn/ui (legacy library archived as a showcase), API layering + validation + authorization, bug fixes, tests + CI, honest README, ADRs | Spec written 2026-09-28 |
| B: Collaboration core | Workspace members and roles, invites (link + "open as teammate" demo), user groups, multiple assignees, Space→Folder→List hierarchy, rich task model (description, subtasks, checklists, tags, custom fields, fractional ordering), activity log, seeded demo workspace with fake teammates, Home/My Work, full task page with comments and @mentions, Inbox (polling) | Next |

## Sidebar target (ClickUp 4.0 style)

- Home / My Work
- Inbox
- Teams
- Dashboards
- Docs
- Whiteboards
- Goals / Sprints
- Automations
- AI

## Later phases (backlog, not yet designed)

- **Power views:** Ctrl+K command palette with full-text search, keyboard shortcuts, filters / group-by / saved views, Gantt / Timeline with dependencies, Workload view, virtualized 10k-task list.
- **Automations + AI:**
  - A trigger → condition → action rule builder.
  - Claude features: summarize, generate subtasks, "ask your workspace" (search-backed answers), and an AI teammate.
- **Docs + Whiteboards:** Docs, and whiteboards saved per workspace.
- **Dashboards 2.0:** a grid of cards, sprint burndown, Goals / OKRs, time tracking.
- **SaaS polish:** email invites, Stripe test-mode billing, landing page refresh.
- **Real-time (deferred):**
  - Presence, live updates, multiplayer Docs and Whiteboard.
  - Requires a free option such as Cloudflare Durable Objects, or a managed service's free tier.
  - The hosting decision is deferred.
