# Plan 013 — Result Screen and Core UI Modals

## Goal
Build the main UI flow around shop, plot, winery, result screen, cellar, market, and share modal.

## Files to touch
- `apps/web/src/features/shop/*`
- `apps/web/src/features/plots/*`
- `apps/web/src/features/winery/*`
- `apps/web/src/features/wine-result/*`
- `apps/web/src/features/cellar/*`
- `apps/web/src/features/market/*`
- `apps/web/src/features/share/*`
- `SESSION_NOTES.md`

## Out of scope
- wallet connect
- backend formula changes
- NFT/token logic

## Tasks
1. Implement ShopModal.
2. Implement PlotModal.
3. Implement WineryModal.
4. Implement WineResultScreen.
5. Implement CellarModal.
6. Implement MarketModal.
7. Implement ShareModal placeholder.
8. Connect API mutations.
9. Refresh game state after mutations.
10. Add tutorial lines.
11. Update `SESSION_NOTES.md`.

## Verification
- `pnpm --filter @chateau/web typecheck`
- playable manual loop
