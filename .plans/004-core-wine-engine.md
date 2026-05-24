# Plan 004 — Core Wine Engine

## Goal
Implement pure wine calculation engine.

## Files to touch
- `packages/game-engine/src/vine/*`
- `packages/game-engine/src/wine/*`
- `packages/game-engine/tests/*`
- `SESSION_NOTES.md`

## Out of scope
- API
- Prisma
- React
- Phaser
- wallet

## Tasks
1. Add tests for vine state.
2. Implement `calculateVineState`.
3. Add tests for grape yield.
4. Implement `calculateGrapeYield`.
5. Add tests for bottle count.
6. Implement `calculateBottleCount`.
7. Add tests for quality score and thresholds.
8. Implement quality score.
9. Add tests for caps.
10. Implement caps.
11. Add `calculateWineBatch` orchestration.
12. Export from index.
13. Run tests.
14. Update `SESSION_NOTES.md`.

## Verification
- `pnpm --filter @chateau/game-engine test`
- `pnpm typecheck`
