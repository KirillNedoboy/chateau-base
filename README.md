# Chateau Base

Chateau Base is a mobile-first cozy winery game for web, PWA, Telegram Mini App, and Base-compatible wallet profiles.

The MVP loop is:

```txt
open app -> buy vine -> plant -> harvest -> craft wine -> reveal result -> share or sell -> optionally preserve on Base
```

## Architecture Summary

Backend decides. Base preserves.

Gameplay state and economy mutations are backend-authoritative through Fastify, Prisma, PostgreSQL, and pure logic from `packages/game-engine`. The web app renders the shell, Phaser map, UI panels, wallet prompt, and Base preserve transaction helper. Base is a sparse preserve layer for selected vintages and challenge moments, not the source of gameplay truth.

MVP boundaries:

- No ERC-20 GRAPE.
- No NFT minting.
- No marketplace.
- No staking.
- No betting.
- No withdrawals.
- No onchain buy, plant, harvest, craft, or sell mutations.

## Prerequisites

- Node.js 20.9+ or a current Node LTS release compatible with Next.js 16.
- Corepack-enabled pnpm. This repo pins `pnpm@11.3.0`.
- PostgreSQL 14+.

Enable pnpm through Corepack if needed:

```sh
corepack enable
corepack prepare pnpm@11.3.0 --activate
```

## Install

```sh
pnpm install
```

## Environment Setup

Use `.env.example` as the source list for local development values. Do not commit real secrets or deployed private credentials.

Required for normal local API/database setup:

- `DATABASE_URL`
- `API_HOST`
- `API_PORT`
- `WEB_ORIGIN`
- `NEXT_PUBLIC_CHATEAU_API_BASE_URL`

Workspace scripts do not all load the root `.env` file automatically. Use one of these local approaches:

- Export the variables in the shell before running `pnpm` commands.
- Put Prisma values such as `DATABASE_URL` in `packages/db/.env`.
- Put Next public values such as `NEXT_PUBLIC_CHATEAU_API_BASE_URL` in `apps/web/.env.local`.
- Keep API values such as `API_HOST`, `API_PORT`, and `DATABASE_URL` exported in the shell or provided by the process manager before running `pnpm --filter @chateau/api dev`.

PowerShell example for the current terminal:

```powershell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chateau_base"
$env:API_HOST="127.0.0.1"
$env:API_PORT="4000"
$env:WEB_ORIGIN="http://localhost:3000"
$env:NEXT_PUBLIC_CHATEAU_API_BASE_URL="http://127.0.0.1:4000"
```

For local split-port development, keep:

```txt
NEXT_PUBLIC_CHATEAU_API_BASE_URL=http://127.0.0.1:4000
```

`WEB_ORIGIN` is the API CORS allowlist. Set it to the exact browser origin of
the web app, for example `http://localhost:3000` or
`http://127.0.0.1:3000`. Production API startup requires `WEB_ORIGIN`; it never
uses a wildcard origin.

Preserve-on-Base addresses are required only when enabling the preserve flow:

- `CHATEAU_CELLAR_BASE_ADDRESS`
- `CHATEAU_CELLAR_BASE_SEPOLIA_ADDRESS`

Leave those contract address values blank for local development if no deployed `ChateauCellar` exists. Missing, invalid, or zero addresses make preserve preparation fail safely before any wallet transaction payload is returned.

`NEXT_PUBLIC_REOWN_PROJECT_ID` is reserved for future Reown AppKit wiring; the current web flow uses an injected wallet provider directly.

## Database Setup

Create a local PostgreSQL database matching `DATABASE_URL`, then run:

```sh
pnpm --filter @chateau/db prisma:generate
pnpm --filter @chateau/db prisma:migrate
pnpm --filter @chateau/db prisma:seed
```

The seed step creates the active `Genesis Harvest` season. It is required for the craft flow because `/api/winery/craft` rejects requests when no active season exists.

Use `prisma:migrate` only for local development. CI and staging must use
`prisma migrate deploy` against the checked-in migrations:

```sh
pnpm --filter @chateau/db exec prisma migrate deploy --schema prisma/schema.prisma
pnpm --filter @chateau/db prisma:seed
```

This repo is still pre-release. Migration history is a clean baseline for the current schema. If you created a disposable local database with an older partial migration, recreate that local database or run a local-only reset after confirming there is no data to keep. Do not reset any shared or production database.

## Run API

```sh
pnpm --filter @chateau/api dev
```

Default local API URL:

```txt
http://127.0.0.1:4000
```

Health check:

```txt
GET http://127.0.0.1:4000/health
```

## Run Web

```sh
pnpm --filter @chateau/web dev
```

Default local web URL:

```txt
http://localhost:3000
```

The web app must have `NEXT_PUBLIC_CHATEAU_API_BASE_URL=http://127.0.0.1:4000` in local env so browser-side API calls reach Fastify instead of the Next.js dev server.

## Staging Environment

Minimum API staging env:

```txt
NODE_ENV=production
DATABASE_URL=postgresql://...
API_HOST=0.0.0.0
API_PORT=<platform port>
WEB_ORIGIN=https://<staging-web-origin>
```

Minimum web staging env:

```txt
NEXT_PUBLIC_APP_NAME=Chateau Base
NEXT_PUBLIC_CHATEAU_API_BASE_URL=https://<staging-api-origin>
```

Set `CHATEAU_CELLAR_BASE_SEPOLIA_ADDRESS` only after a real, non-zero
`ChateauCellar` deployment exists on Base Sepolia. Keep
`CHATEAU_CELLAR_BASE_ADDRESS` unset for staging unless mainnet preserve is
intentionally enabled.

## Run Contracts Tests

```sh
pnpm --filter @chateau/contracts test
```

`packages/contracts` contains the preserve-only `ChateauCellar` contract and Base Sepolia deployment placeholders. The placeholders are not valid runtime contract addresses.

## Run All Checks

```sh
pnpm typecheck
pnpm test
pnpm build
```

Useful targeted checks:

```sh
pnpm --filter @chateau/db exec prisma validate --schema prisma/schema.prisma
pnpm --filter @chateau/db prisma:generate
pnpm --filter @chateau/api test -- plan016-api-mvp-smoke.test.ts
```

## CI

GitHub Actions runs `.github/workflows/ci.yml` on pull requests, pushes, and
manual dispatch. CI uses Node 20, Corepack pnpm `11.3.0`, PostgreSQL 16, and
the same safe test env documented in `.env.example`.

CI database order:

```sh
pnpm --filter @chateau/db exec prisma validate --schema prisma/schema.prisma
pnpm --filter @chateau/db prisma:generate
pnpm --filter @chateau/db exec prisma migrate deploy --schema prisma/schema.prisma
pnpm --filter @chateau/db prisma:seed
pnpm --filter @chateau/api smoke:db
```

`pnpm --filter @chateau/api smoke:db` is a DB-backed MVP smoke script using the
real Prisma client against `DATABASE_URL`. It verifies seed state, session,
state read, buy, plant, harvest with test-time readiness, preview, craft, share,
wallet link, and safe preserve failure when no ChateauCellar address is
configured. It does not bind a port; it uses Fastify injection.

## MVP Smoke Checklist

After API, web, database migration, and seed are ready:

- Start a new anonymous or Telegram-backed session.
- Confirm the user starts with 500 GRAPE and one starter Screw Cap.
- Buy one Vine for 80 GRAPE.
- Plant on Plot 1.
- Harvest 7 grapes after the tutorial timer.
- Preview and craft the first wine.
- Confirm first wine is Good or Premium, never Common.
- Confirm result payload includes label, DNA, verdicts, sale price, moments, and preserve eligibility.
- Create a Degen or Classy share link.
- Open the share link and confirm challenge attribution is created.
- Sell the revealed wine and confirm GRAPE is credited.
- Link a Base or Base Sepolia wallet only after the first result.
- With no `ChateauCellar` address configured, confirm preserve prepare fails safely.
- With a real deployed `ChateauCellar` address configured, confirm submit records a PENDING preserve event, not a confirmed preserve.

## Preserve-on-Base Notes

`CHATEAU_CELLAR_BASE_ADDRESS` and `CHATEAU_CELLAR_BASE_SEPOLIA_ADDRESS` must be deployed, non-zero EVM addresses before preserve transactions are enabled.

Preserve flow semantics:

- Backend checks whether a `WineBatch` is eligible.
- Backend returns a `preserveVintage` payload only when wallet, chain, batch ownership, eligibility, metadata, and contract config are valid.
- Frontend sends the transaction through the player's wallet.
- `/api/preserve/confirm` records the submitted tx hash as `OnchainEvent.status = PENDING`.
- `WineBatch.preservedOnchain` remains `false` and `preservedAt` remains `null` until a future receipt/indexer process confirms the transaction.

## Known Technical Debt

- Add DB-backed Prisma integration tests for transaction rollback/concurrency.
- Introduce GrapeLot/provenance before multiple vine states materially affect quality.
- Add receipt verification/indexer before setting `preservedOnchain = true`.
- Configure real deployed `ChateauCellar` addresses before enabling preserve outside local development.
- Improve `/api/game/state` with per-plot occupancy/readiness before further plot UI polish.
- Add a real market/cellar wine listing before treating Market as a complete sell workflow.
- Move Prisma seed configuration from deprecated `package.json#prisma` to `prisma.config.ts` before Prisma 7.
