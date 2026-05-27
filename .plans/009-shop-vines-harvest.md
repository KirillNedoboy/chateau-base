# Plan 009 — Shop, Plant, Harvest

## Goal
Implement the first resource loop: buy vine, plant vine, harvest grapes.

## Files to touch
- `apps/api/src/modules/shop/*`
- `apps/api/src/modules/vines/*`
- `apps/api/src/routes/*`
- `SESSION_NOTES.md`

## Out of scope
- winery crafting
- frontend UI
- wallet
- share/challenge

## Tasks
1. Implement `POST /api/shop/buy`.
2. Validate item key and quantity.
3. Deduct GRAPE.
4. Update inventory/unlocks/plots.
5. Implement `POST /api/vines/plant`.
6. Implement `POST /api/vines/harvest`.
7. Use game-engine for vine state and grape yield.
8. Add idempotency to all mutations.
9. Emit analytics events.
10. Add tests.
11. Update `SESSION_NOTES.md`.

## Verification
- API tests
- `pnpm typecheck`
