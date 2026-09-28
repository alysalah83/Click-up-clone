# ADR 0001: One monorepo for web and API

- Status: Accepted
- Date: 2026-09-28

## Context
The project started as two repositories, a Next.js front end and an Express + Prisma API. They drifted apart:
- The API had no shared request types, so the front end re-declared every shape by hand.
- The back-end repo carried a stale, empty git link to the front end.
- Cross-cutting changes (such as a new field) needed two PRs and two reviews with no single CI run.

## Decision
- Use one pnpm + Turborepo monorepo:
  - `apps/web` is the Next 16 app.
  - `apps/api` is the Express 5 API.
  - `packages/*` holds shared code; `@clickup/shared` (zod schemas) arrives in plan A2.
- Git history of both repos is kept (`git mv` for web, `git subtree` for the API).
- Each app keeps its own Vercel project, with its root directory set to the app folder.

## Consequences
- **Gain:** one CI pipeline (lint, typecheck, test, build) and atomic cross-app changes. Request schemas can be shared, so client and server validation cannot disagree.
- **Cost:** the two apps still deploy separately. API changes must stay backwards-compatible for one deploy, because a web deploy may lag the API deploy.
- pnpm's strict dependency layout surfaced phantom dependencies, which are now declared explicitly.
