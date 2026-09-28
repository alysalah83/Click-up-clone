# @clickup/api

Express 5 + Prisma 7 API for the ClickUp clone.

## Layout

- `routes/`: HTTP paths plus `validate()` with zod schemas from `@clickup/shared`
- `controllers/`: HTTP only (read the validated request, call a service, send JSON)
- `services/`: business logic; the only layer that talks to Prisma
- `services/access.service.ts`: `assertCanAccess()`, the single ownership check

## Local development

```bash
pnpm install
pnpm --filter @clickup/api db:local        # embedded Postgres on :54329 (no Docker needed)
cp apps/api/.env.example apps/api/.env     # defaults point at the local database
pnpm --filter @clickup/api exec prisma migrate deploy
pnpm --filter @clickup/shared build
pnpm --filter @clickup/api dev             # http://localhost:5000
```

## Tests

`pnpm --filter @clickup/api test` boots a throwaway embedded Postgres on :54330, applies all migrations and runs the suite. In CI, `TEST_DATABASE_URL` points at a Postgres service container instead.
