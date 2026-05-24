# Plan 015 — MVP Polish and Smoke Test

## Goal
Stabilize the vertical MVP and verify the complete 3-minute loop.

## Files to touch
- targeted files only
- `SESSION_NOTES.md`
- `.checkpoints/*`

## Out of scope
- new major systems
- NFT/token logic
- marketplace
- multiplayer

## Tasks
1. Run full typecheck.
2. Run all tests.
3. Test new user flow.
4. Test first wine cannot be Common.
5. Test result screen.
6. Test sell.
7. Test share object creation.
8. Test challenge open.
9. Test wallet prompt after result.
10. Test Base profile placeholder.
11. Fix blockers only.
12. Write checkpoint.
13. Update `SESSION_NOTES.md`.

## MVP smoke test
1. New user opens app.
2. User starts with 500 GRAPE.
3. User buys Vine for 80 GRAPE.
4. Balance becomes 420.
5. User plants Vine on Plot 1.
6. Tutorial timer starts.
7. User harvests 7 grapes.
8. User crafts first wine.
9. First wine is Good or Premium, never Common.
10. WineBatch has result payload.
11. Result screen appears.
12. Wallet prompt appears only after result.
13. User can sell wine for GRAPE.
14. User can create Degen share card.
15. Friend opens share link.
16. Challenge attribution is created.
