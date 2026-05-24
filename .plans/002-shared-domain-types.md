# Plan 002 — Shared Domain Types

## Goal
Centralize all domain types used by API, frontend, DB mapping, and game-engine.

## Files to touch
- `packages/shared/src/domain/*`
- `packages/shared/src/index.ts`
- `SESSION_NOTES.md`

## Out of scope
- runtime game logic
- Prisma schema
- API routes
- React components

## Tasks
1. Create User and TutorialState types.
2. Create GameConfig types.
3. Create Vine/Plot/Inventory types.
4. Create WineQualityLevel, WineProfile, WineLabel, WineBatch.
5. Create GameMoment.
6. Create RecipeHistory.
7. Create ShareObject.
8. Create ReferralChallenge.
9. Create Cellar.
10. Create Season.
11. Create GameActionLog and GameEvent.
12. Export all types.
13. Run typecheck.
14. Update `SESSION_NOTES.md`.

## Verification
- `pnpm typecheck`
