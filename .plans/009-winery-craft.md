# Plan 009 — Winery Preview and Craft

## Goal
Implement wine production backend.

## Files to touch
- `apps/api/src/modules/winery/*`
- `apps/api/src/modules/wine/*`
- `apps/api/src/routes/*`
- `SESSION_NOTES.md`

## Out of scope
- frontend result screen
- wallet
- share/challenge

## Tasks
1. Implement `POST /api/winery/preview`.
2. Validate production choices.
3. Check unlocks/resources.
4. Return caps and missing requirements.
5. Implement `POST /api/winery/craft`.
6. Deduct grapes and closure.
7. Use game-engine to create WineBatch.
8. Apply tutorial first result rule.
9. Store WineBatch.
10. Update RecipeHistory.
11. Emit analytics events.
12. Add tests.
13. Update `SESSION_NOTES.md`.

## Verification
- API tests
- game-engine tests
- `pnpm typecheck`
