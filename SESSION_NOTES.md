# SESSION_NOTES.md

## Initial state

Project started from documentation only.

### Product

Chateau Base is a mobile-first cozy degen winery game for Web, PWA, Telegram Mini App, and Base-compatible identity/profile layer.

### Current status

- Plan 001 repo bootstrap implemented.
- Plan 002 shared domain types implemented.
- Plan 003 default game config implemented.
- Plan 004 core wine engine implemented.
- Plan 005 moment engine implemented.
- Plan 006 onchain cellar contract implemented.
- Plan 007 Prisma schema implemented.
- Plan 008 API session/idempotency foundation implemented.
- Plan 009 shop/vine/harvest API loop implemented.
- Base Preserve pivot documentation applied.
- pnpm workspace created with `apps/web`, `apps/api`, `packages/shared`, `packages/game-engine`, and `packages/db`.
- Web app is a minimal Next.js TypeScript shell.
- API app is a minimal Fastify TypeScript shell with `/health`.
- API app now includes Fastify foundation with Prisma wiring, zod request validation helper, idempotency helper, and initial endpoints:
  - `POST /api/session/start`
  - `GET /api/game/state`
  - `POST /api/analytics/event`
- API app now also includes backend-authoritative mutation endpoints:
  - `POST /api/shop/buy`
  - `POST /api/vines/plant`
  - `POST /api/vines/harvest`
- Shared package now exports MVP domain type contracts from `packages/shared/src/domain`.
- Game-engine exports `DEFAULT_GAME_CONFIG` from `packages/game-engine/src/config`.
- Game-engine exports pure vine and wine calculation functions from `packages/game-engine/src/vine` and `packages/game-engine/src/wine`.
- Game-engine exports pure moment detection, moment priority selection, and moment copy metadata from `packages/game-engine/src/moments`.
- Contracts package now contains `ChateauCellar` preserve-only contract, ABI export, Base Sepolia deployment placeholders, and contract tests.
- DB package is a minimal TypeScript package.
- DB package now includes Prisma schema, Prisma client export, and Genesis Harvest seed.
- Game-engine has one bootstrap Vitest test and no gameplay rules.
- Product specification exists in `PRODUCT_SPEC.md`.
- MVP boundaries exist in `MVP_SCOPE.md`.
- Architecture rules exist in `ARCHITECTURE.md`.
- Root agent rules exist in `AGENTS.md`.
- Implementation plans exist in `.plans/`.

### Current decision

Build a backend-authoritative vertical MVP:
open link -> walk -> buy vine -> plant -> harvest -> craft wine -> reveal result -> share/sell -> optional Base wallet link.

Pivot overlay:
game-first + preserve-on-Base.
Backend decides. Base preserves selected meaningful vintages and challenge moments.

### Validation

- `pnpm install` passed using Corepack pnpm 11.3.0.
- `pnpm --filter @chateau/game-engine test` first failed because `packages/game-engine/src/index` did not exist, then passed after adding the minimal bootstrap export.
- Plan 002 RED check: `pnpm --filter @chateau/shared typecheck` failed on missing `packages/shared/src/domain/*` modules after adding planned exports.
- `pnpm --filter @chateau/shared typecheck` passed after adding domain type files.
- `pnpm typecheck` passed.
- `pnpm test` passed.
- `pnpm build` passed.
- Plan 003 RED check: `pnpm --filter @chateau/game-engine test` failed on undefined `DEFAULT_GAME_CONFIG` before the config export was implemented.
- `pnpm --filter @chateau/game-engine test` passed after adding `DEFAULT_GAME_CONFIG`.
- Plan 004 RED check: `pnpm --filter @chateau/game-engine test` failed on missing core wine/vine function exports before implementation.
- `pnpm --filter @chateau/game-engine test` passed with 3 test files and 11 tests after implementing core calculations.
- Plan 004 review fix RED check: `pnpm --filter @chateau/game-engine test` failed while `calculateWineBatch` still returned fake future-system placeholder fields.
- Plan 004 review fix changed `calculateWineBatch` to return `CoreWineBatchCalculationResult` only.
- `pnpm --filter @chateau/game-engine test` passed after removing fake placeholder fields from `calculateWineBatch`.
- Plan 004 source scan found no `Date.now` or `Math.random` usage in game-engine source/tests for core wine engine.
- Plan 005 RED check: `pnpm --filter @chateau/game-engine test` failed on missing moment engine exports before implementation.
- `pnpm --filter @chateau/game-engine test` passed with 4 test files and 19 tests after implementing the moment engine.
- `pnpm lint` passed during Plan 001 and remains available.
- Plan 006 checks passed:
  - `pnpm --filter @chateau/contracts typecheck`
  - `pnpm --filter @chateau/contracts test`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
- Plan 007 checks passed:
  - `pnpm --filter @chateau/db prisma:generate`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
- Plan 008 checks passed:
  - `pnpm --filter @chateau/api test`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
- Plan 008 review-fix checks passed:
  - `pnpm --filter @chateau/api test`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
- Plan 008 medium-fix checks passed:
  - `pnpm --filter @chateau/api test`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
- Plan 009 RED check: `pnpm --filter @chateau/api test -- plan009-api-shop-vines-harvest.test.ts` failed with 13/13 failures because the shop and vine mutation routes were not implemented yet.
- Plan 009 checks passed:
  - `pnpm --filter @chateau/api test -- plan009-api-shop-vines-harvest.test.ts`
  - `pnpm --filter @chateau/api test`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
- Plan 009 blocker-fix checks passed:
  - `pnpm --filter @chateau/db prisma:generate`
  - `pnpm --filter @chateau/api test -- plan009-api-shop-vines-harvest.test.ts`
  - `pnpm --filter @chateau/api test`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
- Plan 009 shared-inventory medium-fix RED check: `pnpm --filter @chateau/shared test -- vine.test.ts` failed because `HARVESTED_GRAPE_ITEM_KEY` was not exported.
- Plan 009 shared-inventory medium-fix checks passed:
  - `pnpm --filter @chateau/shared test -- vine.test.ts`
  - `pnpm --filter @chateau/api test -- plan009-api-shop-vines-harvest.test.ts`
  - `pnpm typecheck`

### Scope notes

- Gameplay was not implemented.
- Wallet code was not implemented.
- Prisma schema was not implemented.
- NFT, token, and marketplace code were not implemented.
- API routes were not implemented.
- Frontend UI was not changed.
- No source code was changed for Base Preserve pivot; documentation and plans only.
- Core deterministic game-engine formulas for vine state, grape yield, bottle count, raw quality score, quality thresholds, quality caps, and wine batch orchestration were implemented.
- Shared domain files contain type contracts plus canonical domain constants only; no runtime mutation logic was added.
- `DEFAULT_GAME_CONFIG` centralizes MVP economy/config constants; no calculation formulas were added.
- Randomness is caller-supplied through `randomFactor`; calculations do not generate random values.
- `calculateWineBatch` returns only core calculation fields and does not return fake Wine DNA, label, verdict, sale price, moments, or NFT metadata placeholders.
- Moment detection accepts explicit context input only; it does not read persistence or generate data.
- Moment copy metadata is limited to moment titles/summaries and does not implement share cards, verdicts, labels, or UI.
- Wine DNA, labels, verdicts, sale price, API routes, Prisma schema, frontend UI, wallet/Base integration, and persistence were not implemented.
- Base Preserve pivot forbids onchain buy/plant/harvest/craft/sell in MVP and keeps wallet optional until first gameplay payoff.
- Plan 006 implemented only `ChateauCellar` preserve layer; no Prisma schema, no API routes, no frontend wallet UX.
- Plan 006 contract has no ERC-20, NFT mint, marketplace, staking, betting, withdrawals, or GRAPE balance logic.
- Duplicate preserve protection is enforced by `player + batchHash`.
- Plan 007 implemented persistence models only (including `OnchainEvent` and preserve-on-Base fields on `WineBatch`); no API routes, no frontend, no wallet UX, and no contract logic changes.
- Plan 007 includes composite idempotency unique constraint on `GameActionLog(userId, actionType, idempotencyKey)`.
- Plan 007 adds indexes for `walletAddress`, `batchHash`, `preserveTxHash`, share deeplinks, and challenge attribution.
- Plan 008 implemented API foundation only (session start, game state read, analytics event write, idempotency utility) and did not add shop/vine/winery/wallet/preserve API behavior.
- Plan 008 routes are backend-authoritative and keep preserve-on-Base as state exposure only (no preserve transactions or onchain mutation APIs).
- Plan 008 review fixes:
  - `POST /api/session/start` now uses deterministic identity key (`telegramUserId` or `anon:${anonymousSessionId}`), `upsert`, and unique-conflict recovery.
  - Plot initialization now uses `createMany(..., skipDuplicates: true)` to avoid race-related duplicate errors.
  - Cellar initialization remains `upsert`-based and race-safe for repeated starts.
  - `withIdempotency` now stores an explicit pending marker and deletes pending `GameActionLog` row on handler failure to allow retry.
  - API tests now cover invalid zod request bodies, no duplicate plots/cellar on repeated start, retry after failed idempotent handler, and explicit note about stub Prisma limitations.
- Plan 008 medium-fix follow-up:
  - `telegramUserId` values with reserved `anon:` prefix are now rejected to prevent namespace collisions with anonymous identities.
  - `anonymousSessionId` is validated to reject control characters before building `anon:${anonymousSessionId}` identity keys.
  - `withIdempotency` now stores successful responses in a wrapped shape (`__chateauIdempotencyResult + data`) and unwraps on read; pending state no longer collides with real payload content.
  - Added tests for reserved-prefix rejection, anonymous start success, telegram/anonymous key separation for same numeric values, and payload collision safety for `{ "__idempotencyStatus": "pending" }`.
- Plan 009 implementation:
  - Shop buy is backend-authoritative and uses `DEFAULT_GAME_CONFIG.shopPrices` for all prices.
  - Plant and harvest mutations require `idempotencyKey` and run through `withIdempotency`.
  - Plant uses logical `plotId` format (`plot_<index>`) to validate locked vs unlocked plots without exposing database IDs.
  - Plant uses tutorial growth time while tutorial is active and early growth time after tutorial completion.
  - Harvest uses `calculateVineState` and `calculateGrapeYield` from `@chateau/game-engine`.
  - Inventory now supports canonical harvested grape storage via `itemKey = grape` / Prisma enum `GRAPE`.
  - Harvest increments harvested grape inventory, leaves `user.grapeBalance` unchanged as spendable GRAPE currency, increments `harvestCount`, keeps the vine on the plot, and schedules the next `readyAt`.
  - Mutation handlers emit analytics events for `vine_bought`, `vine_planted`, and `vine_harvested`.
  - Prisma schema changed minimally to allow harvested grapes in `Inventory`; no new tables or destructive migrations were introduced.
  - Test helper now explicitly warns that it does not emulate rollback or real DB transaction isolation/concurrency.
- Plan 009 shared-inventory medium fix:
  - `packages/shared/src/domain/vine.ts` now exposes item-keyed `InventoryItemKey`, `InventoryItem`, and `InventorySnapshot` contracts.
  - `Inventory` is now an alias of `InventorySnapshot`, not the old denormalized `grapes/vines/screwCaps/corks` shape.
  - `HARVESTED_GRAPE_ITEM_KEY = "grape"` is exported from `@chateau/shared`.
  - Harvest API responses use the shared app-level `"grape"` key while keeping the Prisma enum boundary explicit as `GRAPE @map("grape")`.
  - No winery, wallet, preserve API, frontend, contract, or runtime gameplay behavior changes were made.

### Technical debt

- Add DB-backed Prisma integration tests before production for transaction rollback/concurrency.

### Next safe step

Implement Plan 010 winery preview/craft without changing preserve-on-Base boundaries, frontend scope, or wallet timing.
