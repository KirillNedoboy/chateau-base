# Checkpoint: After Plan 016 MVP Polish

## Completed Plans

- 001 repo bootstrap
- 002 shared domain types
- 003 game config
- 004 core wine engine
- 005 moment engine
- 006 onchain cellar contract
- 007 preserve-ready Prisma schema
- 008 API session/idempotency
- 009 shop/vines/harvest
- 010 winery/craft
- 011 web shell
- 012 Phaser map
- 013 core game UI panels
- 014 share/challenge flow
- 015 Base wallet/preserve/profile flow
- 016 MVP polish and smoke test

## Current Architecture

Backend decides. Base preserves.

## Plan 016 Changes

- New sessions now get one starter Screw Cap inventory row so the required first-wine smoke path can craft after buying only one Vine.
- Starter Screw Cap initialization is idempotent and does not refill an existing zero-quantity row.
- Added `POST /api/wine/:batchId/sell` for backend-authoritative, idempotent revealed-wine sales.
- Sell credits internal off-chain GRAPE from the stored `WineBatch.salePrice`, marks the batch `SOLD`, records `soldAt`, and emits `wine_sold`.
- Web API client exposes `sellWine`.
- Wine result screen Sell button now calls the backend sell endpoint through the web shell.
- Added Plan 016 API smoke coverage for anonymous session, buy, plant, harvest, preview, craft, result payload, share, public share, challenge open, missing preserve env failure, pending preserve confirm, profile pending/confirmed separation, and sell.

## Contract Boundary

ChateauCellar remains preserve-only.

- No ERC-20.
- No NFT mint.
- No marketplace.
- No staking.
- No betting.
- No withdrawals.
- No onchain buy/plant/harvest/craft/sell.

## Preserve Status Model

- Preserve prepare returns payload only for eligible WineBatch.
- Frontend submits tx through wallet.
- Confirm records txHash as OnchainEvent PENDING.
- WineBatch.preservedOnchain remains false until receipt/indexer confirmation.
- preservedAt remains null until confirmed.
- Profile separates pending submitted preserves from confirmed preserved count.

## Validation

- `pnpm --filter @chateau/api test`
- `pnpm --filter @chateau/web test`
- `pnpm --filter @chateau/game-engine test`
- `pnpm --filter @chateau/contracts test`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `git diff --check`
- `git diff -- apps/web/next-env.d.ts` produced no diff after build.
- `Select-String -Path apps/web/next-env.d.ts -Pattern '\.next'` returned no matches after build.

## Known Technical Debt

- Add DB-backed Prisma integration tests for transaction rollback/concurrency.
- Introduce GrapeLot/provenance before multiple vine states materially affect wine quality.
- Add receipt verification/indexer before setting preservedOnchain true.
- Require real deployed ChateauCellar address in env; no zero address fallback.
- Improve /api/game/state with per-plot occupancy/readiness before polishing plot UI further.
- Add a real market/cellar wine listing before treating Market as a complete sell workflow.

## Current Next Safe Step

Plan 017 MVP hardening: DB-backed smoke/integration coverage, per-plot readiness state, and preserve receipt/indexer verification design.
