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
- Plan 010 winery preview/craft API implemented.
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
  - `POST /api/winery/preview`
  - `POST /api/winery/craft`
- Shared package now exports MVP domain type contracts from `packages/shared/src/domain`.
- Game-engine exports `DEFAULT_GAME_CONFIG` from `packages/game-engine/src/config`.
- Game-engine exports pure vine and wine calculation functions from `packages/game-engine/src/vine` and `packages/game-engine/src/wine`.
- Game-engine exports pure moment detection, moment priority selection, and moment copy metadata from `packages/game-engine/src/moments`.
- Game-engine now exports deterministic WineBatch output helpers for Wine DNA, style tags, labels, verdicts, sale price, tutorial first-wine adjustment, batch hash, metadata, and onchain eligibility.
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
- Plan 010 RED checks:
  - `pnpm --filter @chateau/game-engine test -- full-wine-output.test.ts` failed on missing full WineBatch output helper exports.
  - `pnpm --filter @chateau/api test -- plan010-api-winery-craft.test.ts` failed with 8/8 failures because winery routes were not implemented.
- Plan 010 checks passed:
  - `pnpm --filter @chateau/game-engine test`
  - `pnpm --filter @chateau/api test`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
- Plan 010 review-fix RED checks:
  - `pnpm --filter @chateau/game-engine test -- full-wine-output.test.ts` failed because tutorial first-wine still used `idempotencyKey` and `batchHash` changed when only `idempotencyKey` changed.
  - `pnpm --filter @chateau/api test -- plan010-api-winery-craft.test.ts` failed because stale inventory still crafted, tutorial quality changed with `idempotencyKey`, and `RecipeHistory.bestQualityLevel` regressed.
- Plan 010 review-fix checks passed:
  - `pnpm --filter @chateau/game-engine test -- full-wine-output.test.ts`
  - `pnpm --filter @chateau/api test -- plan010-api-winery-craft.test.ts`
  - `pnpm --filter @chateau/game-engine test`
  - `pnpm --filter @chateau/api test`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
- Plan 010 batch-hash uniqueness fix RED checks:
  - `pnpm --filter @chateau/game-engine test -- full-wine-output.test.ts` failed because `batchId` did not affect `batchHash`.
  - `pnpm --filter @chateau/api test -- plan010-api-winery-craft.test.ts` failed because a second identical legitimate craft hit duplicate `batchHash`.
- Plan 010 batch-hash uniqueness fix checks passed:
  - `pnpm --filter @chateau/game-engine test -- full-wine-output.test.ts`
  - `pnpm --filter @chateau/api test -- plan010-api-winery-craft.test.ts`
- Plan 011 checks passed:
  - `pnpm --filter @chateau/web test`
  - `pnpm --filter @chateau/web typecheck`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
- Plan 012 checks passed:
  - `pnpm --filter @chateau/web test`
  - `pnpm --filter @chateau/web typecheck`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
- Plan 013 RED checks:
  - `pnpm --filter @chateau/web test -- api.test.ts viewModels.test.ts WineResultScreen.test.ts` failed because mutation API exports and Plan 013 UI helper modules did not exist yet.
- Plan 013 checks passed:
  - `pnpm --filter @chateau/web test -- api.test.ts viewModels.test.ts WineResultScreen.test.ts`
  - `pnpm --filter @chateau/web typecheck`
  - `pnpm --filter @chateau/web test`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
- Plan 013 medium-fix RED checks:
  - `pnpm --filter @chateau/web test -- viewModels.test.ts viewModel.test.ts` failed because plot status still inferred readiness from aggregate vine count and winery preview draft-key helpers did not exist.
- Plan 013 medium-fix checks passed:
  - `pnpm --filter @chateau/web test -- viewModels.test.ts viewModel.test.ts`
  - `pnpm --filter @chateau/web test`
  - `pnpm --filter @chateau/web typecheck`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`

### Scope notes

- Frontend now has a primitive Phaser map with player movement and interaction zones.
- Wallet code was not implemented.
- Prisma schema is implemented for current backend persistence.
- NFT, token, and marketplace code were not implemented.
- API routes are implemented through winery preview/craft; wine sell/store/share/challenge/wallet routes are still not implemented.
- Frontend now has a basic mobile-first web shell connected to session start and game state.
- No source code was changed for Base Preserve pivot; documentation and plans only.
- Core deterministic game-engine formulas for vine state, grape yield, bottle count, raw quality score, quality thresholds, quality caps, and wine batch orchestration were implemented.
- Shared domain files contain type contracts plus canonical domain constants only; no runtime mutation logic was added.
- `DEFAULT_GAME_CONFIG` centralizes MVP economy/config constants; no calculation formulas were added.
- Randomness is caller-supplied through `randomFactor`; calculations do not generate random values.
- `calculateWineBatch` returns only core calculation fields and does not return fake Wine DNA, label, verdict, sale price, moments, or NFT metadata placeholders.
- Moment detection accepts explicit context input only; it does not read persistence or generate data.
- Moment copy metadata is limited to moment titles/summaries and does not implement share cards, verdicts, labels, or UI.
- Wine DNA, labels, verdicts, sale price, winery API routes, Prisma schema, core backend persistence, the basic web shell, and primitive Phaser movement/zones are now implemented through Plan 012; wallet/Base integration, preserve transactions, share/challenge, and sell/store APIs are still not implemented.
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
- Plan 010 implementation:
  - Winery preview validates recipe input, checks harvested grape inventory, closure inventory, and oak unlocks, returns missing resources, required unlocks, estimated bottle count, applicable caps, and max possible quality.
  - Winery craft requires `idempotencyKey`, uses `withIdempotency`, consumes harvested `Inventory.GRAPE` and one closure item, and does not spend `user.grapeBalance`.
  - Craft creates full `WineBatch` records with season, config version, recipe, quality score/levels, cap metadata, DNA profile, style tags, label, moments, primary moment, verdicts, sale price, batch hash, metadata URI, onchain eligibility, `preservedOnchain = false`, and NFT-ready metadata JSON.
  - Craft updates `RecipeHistory` and emits `production_started` and `wine_revealed` events.
  - Tutorial first wine is deterministically adjusted to avoid Common without calling `Math.random` in game-engine.
  - Onchain eligibility is metadata-only and true for Premium+ or configured meaningful moments; no preserve transaction, contract call, NFT mint, ERC-20, marketplace, wallet UX, frontend, or contract code was added.
  - MVP craft currently treats harvested grape inventory as a single lot with `low_yield` vine state until grape-lot provenance exists.
- Plan 010 review-fix implementation:
  - Craft inventory consumption now uses guarded `updateMany` decrements with `quantity >= required` inside the transaction and fails before `WineBatch` creation if the guarded write does not affect exactly one row.
  - Tutorial first-wine Good/Premium distribution now uses a backend-owned deterministic seed from `userId + active season key + tutorial-first-wine`, not the client-chosen `idempotencyKey`.
  - `RecipeHistory` now increments `timesUsed`, updates `lastUsedAt`, and preserves `bestScore` plus the matching `bestQualityLevel` unless the current craft improves the best score.
  - `batchHash` no longer includes `idempotencyKey`; it is built with stable key ordering from meaningful persisted/preserve payload fields including season/config, recipe choices, raw/final quality, caps, profile, style tags, label, moments, verdicts, sale price, and stable metadata URI input.
  - The API test helper now supports guarded `inventory.updateMany`, transaction rollback for route tests, and direct `RecipeHistory` read/update/create paths used by the service.
  - Grape provenance remains an explicit MVP fallback: harvested grapes are generic inventory, and persisted `LOW_YIELD` is a compatibility stand-in until a dedicated lot/provenance model exists.
- Plan 010 batch-hash uniqueness fix:
  - Craft now generates a backend-owned UUID `WineBatch.id` before `WineBatch.create`.
  - `createBatchHash` includes that persisted `batchId` plus the meaningful payload and still excludes client-controlled `idempotencyKey`.
  - Two identical legitimate crafts can now create separate `WineBatch` rows with distinct ids and distinct `batchHash` values.
  - Repeated same `idempotencyKey` still returns the stored idempotent response with the same `WineBatch.id` and `batchHash`.
- Plan 011 implementation:
  - Web app renders a mobile-first Chateau Base shell from `apps/web/src/app/page.tsx`.
  - `apps/web/src/lib/api.ts` provides a typed API client for session start and game state reads, configurable with `NEXT_PUBLIC_CHATEAU_API_BASE_URL`.
  - The web shell starts a session on app load, prefers Telegram user id when available, falls back to a persisted `chateau_anonymous_session_id`, and does not require wallet connection.
  - The shell fetches backend game state after session start and displays short user id, GRAPE balance, chateau level, tutorial status/prompt, active season, inventory summary, and a wallet-after-first-vintage placeholder.
  - Loading session, loading game state, API error, and retry states are visible.
  - Web API-client tests cover anonymous session reuse/creation, configured API base URL, non-2xx API errors, and network failures.
  - No backend API, contract, wallet UX, Phaser map, shop UI, plot UI, winery UI, result screen, preserve UI, share UI, challenge UI, NFT, ERC-20, marketplace, staking, betting, or withdrawal logic was added.
- Plan 012 implementation:
  - Web app now depends on Phaser 3.90.0 in `apps/web`.
  - Added a client-only Phaser map component mounted inside the Plan 011 shell.
  - Phaser owns primitive top-down movement, WASD/arrow controls, E interaction, map drawing, player position, active-zone detection, and canvas prompt text.
  - React owns mobile joystick/interact controls and placeholder interaction panel display.
  - Interaction zones are Chateau, Cellar, Production, Plot 1, Plot 2, Plot 3, Shop, Market, and Ghost Sommelier.
  - Phaser emits zone ids to React; React maps them to placeholder copy only.
  - Added lightweight web tests for required zone ids and interaction copy mapping outside Phaser runtime.
  - No gameplay mutation API calls, economy calculations, inventory calculations, quality/reward/price/timer/moment calculations, backend API changes, contract changes, wallet UX, preserve UI, share/challenge UI, NFT, ERC-20, marketplace, staking, betting, or withdrawal logic was added.
- Plan 013 implementation:
  - Web API client now exposes typed clients for `POST /api/shop/buy`, `POST /api/vines/plant`, `POST /api/vines/harvest`, `POST /api/winery/preview`, and `POST /api/winery/craft`.
  - Web shell now opens React panels from existing Phaser zone ids for Shop, Plot, Winery, Cellar, Market, Chateau, and Ghost Sommelier.
  - Shop UI lists MVP buyable items and calls `/api/shop/buy` with a freshly generated idempotency key per click.
  - Plot UI shows the selected plot, inventory summary, plant and harvest actions, and delegates locked/occupied/not-ready decisions to backend errors.
  - Winery UI lets the player choose grape amount, production vessel, aging plan, and closure type, calls `/api/winery/preview`, displays backend missing resources/unlocks, and calls `/api/winery/craft` with a fresh idempotency key.
  - Wine result UI displays the craft response fields: quality level, score, bottle count, Wine DNA, style tags, label, production choices, moments, primary moment, verdicts, sale price, and onchain eligibility indicator.
  - Classy Flex, Degen Flex, Run It Back, Store in Cellar, Sell Wine, and Preserve on Base are placeholders only; no share/challenge, wallet, sell/store, preserve transaction, NFT, ERC-20, marketplace, staking, betting, withdrawal, backend, or contract logic was added.
  - Successful shop, plant, harvest, and craft mutations refresh `/api/game/state` from the server before updating visible state.
- Plan 013 medium-fix implementation:
  - Plot UI no longer infers plot-specific plant/harvest/readiness labels from aggregate `vines.total`.
  - Plot UI now uses neutral copy for unlocked plots: `Backend will validate plot state.`
  - Winery previews are bound to a stable draft key made from grape amount, production vessel, aging plan, and closure type.
  - Winery UI hides stale preview details and disables Craft until the current draft has a current successful preview.
  - No backend, contract, wallet, preserve transaction, share/challenge, NFT, ERC-20, marketplace, staking, betting, or withdrawal logic was added.

### Technical debt

- Add DB-backed Prisma integration tests before production for transaction rollback/concurrency.
- Introduce GrapeLot/provenance before multiple vine states materially affect quality.

### Next safe step

Implement Plan 014 share/challenge only after backend endpoints and scope are explicitly ready; keep wallet/preserve transaction UX out until Plan 015.
