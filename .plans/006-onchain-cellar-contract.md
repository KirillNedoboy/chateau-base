# Plan 006 — Onchain Cellar Contract

## Goal
Define the Base Preserve contract boundary for MVP: preserve meaningful vintages and selected challenge moments on Base without moving gameplay economy onchain.

## Files to touch
- `packages/shared/src/domain/*` (contract-facing preserve DTO types only if missing)
- `packages/db/prisma/schema.prisma` (preserve queue/event models only if needed for API handoff)
- `apps/api/src/modules/preserve/*`
- `apps/api/src/modules/wine/*` (preserve trigger integration points only)
- `SESSION_NOTES.md`

## Out of scope
- ERC-20 GRAPE
- NFT minting
- marketplace
- staking
- betting
- withdrawals
- onchain buy/plant/harvest/craft

## Tasks
1. Specify preserve payload shape for a vintage/challenge moment.
2. Define deterministic eligibility rules for what can be preserved.
3. Add backend preserve-intent route/service boundary.
4. Add idempotency for preserve writes.
5. Add contract adapter interface (no gameplay logic in contract layer).
6. Record preserve status back to backend state.
7. Add tests for eligibility and idempotency behavior.
8. Update `SESSION_NOTES.md`.

## Verification
- `pnpm --filter @chateau/api test`
- `pnpm typecheck`
