# Checkpoint: After Plan 015 Preserve Flow

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

## Current Architecture

Backend decides. Base preserves.

## Contract

ChateauCellar is preserve-only.

- No ERC-20.
- No NFT mint.
- No marketplace.
- No staking.
- No betting.
- No withdrawals.
- No onchain buy/plant/harvest/craft.

## Preserve Status Model

- Preserve prepare returns payload only for eligible WineBatch.
- Frontend submits tx through wallet.
- Confirm records txHash as OnchainEvent PENDING.
- WineBatch.preservedOnchain remains false until receipt/indexer confirmation.
- preservedAt remains null until confirmed.
- Profile separates pending submitted preserves from confirmed preserved count.

## Known Technical Debt

- Add DB-backed Prisma integration tests for transaction rollback/concurrency.
- Introduce GrapeLot/provenance before multiple vine states materially affect wine quality.
- Add receipt verification/indexer before setting preservedOnchain true.
- Require real deployed ChateauCellar address in env; no zero address fallback.
- Improve /api/game/state with per-plot occupancy/readiness before polishing plot UI.

## Current Next Safe Step

Plan 016 MVP polish.
