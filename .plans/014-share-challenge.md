# Plan 014 — Share and Challenge

## Goal
Implement ShareObject and challenge attribution.

## Files to touch
- `apps/api/src/modules/share/*`
- `apps/api/src/modules/challenge/*`
- `apps/web/src/app/s/[shareId]/*`
- `apps/web/src/features/share/*`
- `SESSION_NOTES.md`

## Out of scope
- image generation service unless already available
- wallet
- NFT/token logic

## Tasks
1. Implement `POST /api/share`.
2. Implement `GET /api/s/:shareId`.
3. Implement challenge open/start/complete routes.
4. Store inviter/invited attribution.
5. Add classy/degen share modes.
6. Add share page.
7. Add challenge result copy.
8. Add tests.
9. Update `SESSION_NOTES.md`.

## Verification
- API tests
- `pnpm typecheck`
- manual share link smoke test
