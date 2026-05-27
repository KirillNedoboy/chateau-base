# Plan 011 — Web Shell

## Goal
Create the mobile-first web shell and connect it to API session/game state.

## Files to touch
- `apps/web/src/app/*`
- `apps/web/src/components/*`
- `apps/web/src/lib/api.ts`
- `apps/web/src/stores/*`
- `SESSION_NOTES.md`

## Out of scope
- Phaser map
- wallet
- full result screen
- share/challenge

## Tasks
1. Add mobile-first layout.
2. Start session on app load.
3. Fetch game state.
4. Show GRAPE balance.
5. Show basic tutorial prompt.
6. Add loading and error states.
7. Update `SESSION_NOTES.md`.

## Verification
- `pnpm --filter @chateau/web typecheck`
- `pnpm typecheck`
