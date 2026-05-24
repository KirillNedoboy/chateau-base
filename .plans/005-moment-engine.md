# Plan 005 — Moment Engine

## Goal
Implement detection and prioritization of viral gameplay moments.

## Files to touch
- `packages/game-engine/src/moments/*`
- `packages/game-engine/tests/*`
- `SESSION_NOTES.md`

## Out of scope
- UI animations
- API persistence
- share cards

## Tasks
1. Implement `detectMoments`.
2. Implement `selectPrimaryMoment`.
3. Implement moment priority.
4. Add copy metadata for key moments.
5. Test Almost Legendary.
6. Test RNG Rugged.
7. Test Corkfather.
8. Test Based Vintage.
9. Test first wine / first premium / first grand cru.
10. Update `SESSION_NOTES.md`.

## Verification
- `pnpm --filter @chateau/game-engine test`
- `pnpm typecheck`
