# Plan 006 — Prisma Schema

## Goal
Define authoritative backend persistence schema.

## Files to touch
- `packages/db/prisma/schema.prisma`
- `packages/db/prisma/seed.ts`
- `packages/db/src/client.ts`
- `SESSION_NOTES.md`

## Out of scope
- API routes
- frontend
- game-engine changes unless types block implementation

## Tasks
1. Add User model.
2. Add Season model.
3. Add Plot, Vine, Inventory.
4. Add WineBatch.
5. Add ShareObject.
6. Add ReferralChallenge.
7. Add RecipeHistory.
8. Add Cellar.
9. Add GameActionLog with idempotency unique key.
10. Add GameEvent.
11. Add seed for Genesis Harvest.
12. Generate Prisma client.
13. Update `SESSION_NOTES.md`.

## Verification
- `pnpm --filter @chateau/db prisma:generate`
- `pnpm typecheck`
