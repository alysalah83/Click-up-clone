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
- **Cost:** email-keyed limits mean 10 failed logins lock that email for 15 minutes (a targeted-lockout risk), and the in-memory store is per serverless instance; move to a shared store (e.g. Upstash free tier) if abuse appears.
