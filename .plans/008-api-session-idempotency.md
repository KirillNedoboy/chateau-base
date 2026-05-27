# Plan 008 — API Session and Idempotency

## Goal
Create Fastify API foundation with session start, game state, analytics, and idempotency helper.

## Files to touch
- `apps/api/src/server.ts`
- `apps/api/src/plugins/*`
- `apps/api/src/modules/session/*`
- `apps/api/src/modules/game-state/*`
- `apps/api/src/modules/analytics/*`
- `apps/api/src/modules/idempotency/*`
- `SESSION_NOTES.md`

## Out of scope
- shop
- vines
- winery
- wallet
- frontend

## Tasks
1. Set up Fastify server.
2. Add Prisma plugin.
3. Add zod validation helper.
4. Implement `POST /api/session/start`.
5. Implement `GET /api/game/state`.
6. Implement `POST /api/analytics/event`.
7. Implement `withIdempotency`.
8. Add tests for idempotency.
9. Update `SESSION_NOTES.md`.

## Verification
- `pnpm --filter @chateau/api test`
- `pnpm typecheck`
