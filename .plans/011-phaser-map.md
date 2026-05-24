# Plan 011 — Phaser Tiny Map

## Goal
Add basic playable top-down map with interaction zones.

## Files to touch
- `apps/web/src/game/*`
- `apps/web/src/components/game/*`
- `apps/web/src/features/interactions/*`
- `SESSION_NOTES.md`

## Out of scope
- economy logic
- backend formulas
- wallet
- share/challenge

## Tasks
1. Add Phaser scene.
2. Add player movement.
3. Add desktop controls.
4. Add mobile virtual joystick and interact button.
5. Add zones: Chateau, Cellar, Production, Plot 1-3, Shop, Market, Ghost Sommelier.
6. Emit interaction events from Phaser to React.
7. React opens placeholder modals.
8. Update `SESSION_NOTES.md`.

## Verification
- `pnpm --filter @chateau/web typecheck`
- manual smoke test
