# Plan 003 — GameConfig

## Goal
Implement default MVP GameConfig so economy and formulas are not scattered across the codebase.

## Files to touch
- `packages/game-engine/src/config/*`
- `packages/game-engine/tests/*`
- `SESSION_NOTES.md`

## Out of scope
- API
- Prisma
- frontend
- wallet

## Tasks
1. Implement `DEFAULT_GAME_CONFIG`.
2. Include starting balance: 500 GRAPE.
3. Include shop prices.
4. Include growth and production timers.
5. Include base grape yield.
6. Include quality thresholds.
7. Include sale config.
8. Include quality caps.
9. Add tests for critical constants.
10. Update `SESSION_NOTES.md`.

## Verification
- `pnpm --filter @chateau/game-engine test`
- `pnpm typecheck`
