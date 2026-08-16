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
  - `POST /api/share`
  - `GET /api/s/:shareId`
  - `POST /api/challenge/open`
  - `POST /api/challenge/start`
  - `POST /api/challenge/complete`
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
  - `git diff --check`
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
- Plan 014 RED checks:
  - `pnpm --filter @chateau/api test -- plan014-api-share-challenge.test.ts` failed with 7/8 failures because share/challenge routes were not implemented.
  - `pnpm --filter @chateau/web test -- api.test.ts` failed because share/challenge API client exports were missing.
- Plan 014 checks passed:
  - `pnpm --filter @chateau/api test -- plan014-api-share-challenge.test.ts`
  - `pnpm --filter @chateau/web test -- api.test.ts`
  - `pnpm --filter @chateau/api test`
  - `pnpm --filter @chateau/web test`
  - `pnpm --filter @chateau/api typecheck`
  - `pnpm --filter @chateau/web typecheck`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
  - `pnpm --filter @chateau/web typecheck` passed again after removing the generated `.next/types` import from `apps/web/next-env.d.ts`.
- Plan 014 review-fix RED check:
  - `pnpm --filter @chateau/api test -- plan014-api-share-challenge.test.ts` failed on the new regression cases for share analytics failure, duplicate challenge open conflict recovery, invited user takeover, start-after-completion regression, and complete-after-completion overwrite.
- Plan 014 review-fix checks passed:
  - `pnpm --filter @chateau/api test -- plan014-api-share-challenge.test.ts`
  - `pnpm --filter @chateau/db prisma:generate`
  - `pnpm --filter @chateau/api typecheck`
  - `pnpm --filter @chateau/api test`
  - `pnpm --filter @chateau/web test`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
- Plan 014 final repair RED check:
  - `pnpm --filter @chateau/api test -- plan014-api-share-challenge.test.ts` failed on stale-read race tests where unconditional challenge updates could regress terminal status or overwrite `invitedUserId`.
- Plan 014 final repair checks passed:
  - `pnpm --filter @chateau/api test -- plan014-api-share-challenge.test.ts`
  - `pnpm --filter @chateau/db prisma:generate`
  - `pnpm --filter @chateau/api test`
  - `pnpm --filter @chateau/web test`
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
- Plan 014 implementation:
  - Added backend `POST /api/share` with `share_create` idempotency and one persistent `ShareObject` per share action.
  - Wine-backed share creation loads the stored `WineBatch` and ignores client-provided score, quality, sale price, and batch summary fields.
  - Added backend `GET /api/s/:shareId` for stable public share object retrieval.
  - Added backend `POST /api/challenge/open`, `POST /api/challenge/start`, and `POST /api/challenge/complete` for attribution only.
  - Challenge open creates or updates attribution for the source share, start attaches `invitedUserId`, and complete compares backend batch scores to set `beat_score` or `failed`.
  - Challenge attribution preserves inviter, invited user, source share, source batch, inviter score, and invited score without altering economy.
  - Web API client now exposes typed share and challenge helpers.
  - Added dynamic public `/s/[shareId]` route that fetches the backend share object, attempts challenge-open attribution, and displays a backend-provided share card.
  - Wine result share buttons now create backend share links for the current batch with a fresh idempotency key per click.
  - No wallet UX, preserve-on-Base transaction UI, contract call, contract logic change, NFT minting, ERC-20, marketplace, staking, betting, withdrawal, or challenge economy reward logic was added.
- Plan 014 review-fix implementation:
  - `ReferralChallenge.sourceShareId` is now unique in Prisma so each share has one canonical attribution record.
  - `challenge/open` now returns the existing attribution record or recovers from a unique-create race instead of creating duplicates.
  - `challenge/start` no longer overwrites an existing different `invitedUserId` and does not regress terminal `beat_score` or `failed` challenges.
  - `challenge/complete` now uses backend batch scores, sets `invitedUserId` once when safe, rejects takeover before completion, and returns terminal results without mutating them.
  - `POST /api/share` now creates `ShareObject` and `result_shared` analytics inside one transaction, so analytics failure rolls back share creation and the idempotency retry cannot duplicate the share.
  - The in-memory API test helper now models source-share uniqueness and targeted failure hooks for these Plan 014 regression tests, while retaining its documented limitations around real database isolation.
  - No frontend, wallet UX, preserve-on-Base transaction UI, contract call, NFT, ERC-20, marketplace, staking, betting, withdrawal, or challenge economy reward logic was added.
- Plan 014 final repair implementation:
  - `challenge/start` now uses guarded `updateMany` with `status NOT IN (BEAT_SCORE, FAILED)` and `invitedUserId IS NULL`, then refetches on guard miss to return terminal/idempotent rows or reject conflicts.
  - `challenge/complete` now uses guarded `updateMany` with `status NOT IN (BEAT_SCORE, FAILED)` and `invitedUserId IS NULL OR invitedUserId = requester`, then refetches on guard miss to avoid overwriting terminal scores/status/completion time.
  - Plan 014 API tests now simulate challenge rows changing between service read and write, covering start-after-concurrent-complete, invited-user takeover during start, stale complete after terminal result, complete takeover, and repeated complete stability.
  - Added first Prisma migration at `packages/db/prisma/migrations/20260605174600_plan014_source_share_unique/migration.sql` to apply the `ReferralChallenge.sourceShareId` unique constraint in PostgreSQL.
  - No wallet UX, preserve-on-Base transaction UI, ChateauCellar contract call, NFT, ERC-20, marketplace, staking, betting, withdrawal, or unrelated module refactor was added.
- Plan 015 implementation:
  - Added backend Base chain config for Base and Base Sepolia plus required public ChateauCellar address environment lookups for preserve preparation.
  - Added `POST /api/wallet/link` with `wallet_link` idempotency, EVM address normalization, Base/Base Sepolia validation, `walletAddress`/`chainId`/`baseProfileLinked` persistence, and conflict handling that prevents another user from taking an already linked wallet.
  - Added `POST /api/preserve/prepare` to return backend-approved ChateauCellar `preserveVintage` payload only for the requesting user's onchain-eligible WineBatch.
  - Added `POST /api/preserve/confirm` with `preserve_confirm` idempotency; it re-checks eligibility, records submitted `txHash`/chain as a pending submission, keeps `WineBatch.preservedOnchain = false`, leaves `preservedAt = null`, and creates one `OnchainEvent` with status `PENDING` for duplicate-safe vintage preserve tracking.
  - Added `GET /api/chateau/:walletAddress` public profile API with shortened wallet, Based Winemaker status, Genesis Harvest stats, best wine, worst shame, confirmed preserved count, pending preserve count, and public cellar list from backend WineBatch rows.
  - Added Plan 015 API regression tests for wallet chain rejection, wallet storage, wallet conflict, preserve prepare eligibility, missing/zero ChateauCellar address rejection, preserve payload, pending preserve confirm event tracking, duplicate confirm idempotency, and public profile stats.
  - Web API client now exposes wallet link, preserve prepare/confirm, and public chateau profile helpers.
  - Web app now includes a minimal injected-wallet Base preserve panel shown only for backend `onchainEligible` WineResultScreen results; it requests accounts on click, links the wallet, prepares backend payload, sends `preserveVintage` calldata through the existing ChateauCellar ABI using `viem`, and confirms the submitted tx hash with the backend.
  - Added `/chateau/[wallet]` public profile page that renders backend profile data.
  - Added `@chateau/contracts` and `viem` to the web package, plus a contracts package ABI subpath export so Next can import the existing ABI directly.
  - Added web tests for preserve action visibility, wallet/preserve/profile API request shapes, ChateauCellar calldata encoding, zero-address transaction rejection before wallet RPC, and forbidden transaction-helper scope.
  - Extended the in-memory API Prisma helper for wallet lookup/update, preserve WineBatch updates, `OnchainEvent` uniqueness, and profile batch reads.
  - No ChateauCellar contract logic was modified.
  - No NFT minting, ERC-20 GRAPE, marketplace, staking, betting, withdrawal, or onchain buy/plant/harvest/craft/sell gameplay mutation logic was added.
- Plan 015 review-fix implementation:
  - Removed the zero-address fallback from backend ChateauCellar config. Missing, invalid, or zero contract address env now causes `/api/preserve/prepare` to fail with a clear config error before returning a transaction payload.
  - Frontend `sendPreserveVintageTransaction` now validates the backend-provided contract address and rejects missing, invalid, or zero addresses before calling `eth_sendTransaction`.
  - Preserve confirm now treats tx-hash submission as pending only: it records `preserveTxHash`/`preserveChainId`, creates or reuses a `PENDING` `OnchainEvent`, and does not set `preservedOnchain` or `preservedAt`.
  - Public profile responses now expose `preservedVintagesCount` for confirmed vintages and `pendingPreserveCount` for pending tx submissions; public cellar entries expose `preserveStatus` as `none`, `pending`, or `confirmed`.
  - Preserve UI copy now says `Preserve submitted. Pending confirmation.` after tx submission, and the web shell no longer mutates local result state to `preservedOnchain: true` for pending submissions.
  - Added `apps/web/scripts/restore-next-env.mjs` and wired web build to restore standard `next-env.d.ts` references after Next 16 regenerates `.next/types/routes.d.ts` imports.
  - No ChateauCellar contract logic, NFT minting, ERC-20 GRAPE, marketplace, staking, betting, withdrawal, or onchain buy/plant/harvest/craft/sell gameplay mutation logic was added.
- Plan 015 checkpoint:
  - Added `.checkpoints/after-plan-015-preserve-flow.md` documenting completed plans, preserve architecture, contract boundaries, preserve status model, technical debt, and Plan 016 as the next safe step.
- Plan 016 implementation:
  - Added one idempotent starter Screw Cap on session start so the required first-wine smoke path can buy only one Vine, remain at 420 GRAPE after purchase, harvest 7 grapes, preview, and craft without an extra shop step.
  - Added backend `POST /api/wine/:batchId/sell` with `wine_sell` idempotency, stored sale-price crediting, guarded `SOLD` status update, `soldAt`, and `wine_sold` analytics.
  - Wired the web API client and Wine Result Sell button to the backend sell endpoint.
  - Added Plan 016 API smoke coverage across anonymous session, game state, buy, plant, harvest, preview, craft, result payload, share/public share, challenge open, missing preserve env failure, pending preserve confirm, public profile pending/confirmed counts, and sell.
  - No ChateauCellar contract logic, NFT minting, ERC-20 GRAPE, marketplace, staking, betting, withdrawal, or onchain buy/plant/harvest/craft/sell gameplay mutation logic was added.
  - Added `.checkpoints/after-plan-016-mvp-polish.md`.
- Plan 016 review-fix implementation:
  - Result-screen sell UI now has explicit busy, error, success, and sold state owned by `WebShell` and rendered by `WineResultScreen`.
  - Rapid duplicate Sell clicks are guarded by a single in-flight sell intent tracker, so repeated clicks while the request is active do not generate additional idempotency keys or sell requests.
  - Successful sell keeps the result dialog open, shows the credited GRAPE message, and disables the Sell button as sold.
  - Sell failures are displayed inside the result screen and leave the button available for a later retry.
  - Backend wine sell now requires `WineBatch.status = REVEALED` in both the pre-check and guarded update, so `STORED` and `SOLD` batches cannot be sold.
  - Added Plan 016 regression coverage for stored wine rejection, directly sold wine rejection, same-key idempotent replay, different-key resale rejection, busy/error/sold sell UI state, and duplicate in-flight sell intent guarding.
  - No marketplace, cellar listing, wallet/preserve changes, NFT minting, ERC-20 GRAPE, staking, betting, withdrawal, or onchain sell logic was added.
- Plan 016 sell UI race fix:
  - Result-screen sell operation state is keyed by WineBatch id and selected for display only from the currently visible `wineResult.id`.
  - Async sell success and error completions update the initiating batch state instead of global result state, so a stale response from batch A cannot mark batch B sold or show batch A's sale/error message on batch B.
  - Close and Run It Back are disabled while the currently visible batch sell is in-flight; a different batch's in-flight sell does not block the current batch.
  - Added regression coverage for stale success and stale error from batch A while batch B is visible, current-batch busy scoping, sold-state scoping, error-state scoping, and independent in-flight intents.
  - No backend, marketplace, cellar listing, wallet/preserve, NFT, ERC-20 GRAPE, staking, betting, withdrawal, or onchain sell behavior was changed for this race fix.
- Release setup hardening:
  - Replaced the pre-release partial Prisma migration with a clean baseline migration at `packages/db/prisma/migrations/20260609000000_initial_schema/migration.sql`.
  - The baseline migration was generated from the current Prisma schema and includes current enums, tables, indexes, foreign keys, and `ReferralChallenge.sourceShareId` uniqueness.
  - `README.md` now documents real local setup, env, Prisma generate/migrate/seed, API/web run commands, contract tests, all checks, MVP smoke checklist, preserve-on-Base behavior, and known technical debt.
  - README env setup now calls out that filtered workspace scripts do not all auto-load the root `.env`; local developers must export env vars or create package-local env files for Prisma/Next/API as appropriate.
  - `.env.example` now documents `NEXT_PUBLIC_CHATEAU_API_BASE_URL`, `CHATEAU_CELLAR_BASE_ADDRESS`, `CHATEAU_CELLAR_BASE_SEPOLIA_ADDRESS`, and `NEXT_PUBLIC_REOWN_PROJECT_ID` with safe non-secret placeholders.
  - Fresh setup docs explicitly require `pnpm --filter @chateau/db prisma:seed` because the craft flow requires an active Genesis Harvest season.
  - No app logic, gameplay features, contract behavior, NFT minting, ERC-20 GRAPE, marketplace, staking, betting, withdrawal, or onchain gameplay mutation behavior was changed.

### Plan 015 validation

- `pnpm --filter @chateau/api test -- plan015-api-wallet-preserve-profile.test.ts` passed.
- `pnpm --filter @chateau/web test -- api.test.ts WineResultScreen.test.ts chateauCellar.test.ts` passed.
- `pnpm --filter @chateau/api test` passed.
- `pnpm --filter @chateau/web test` passed.
- `pnpm --filter @chateau/api typecheck` passed.
- `pnpm --filter @chateau/web typecheck` passed.
- `pnpm typecheck` passed.
- `pnpm test` passed.
- `pnpm build` initially failed because Next/Turbopack could not resolve the contracts package root `.js` re-exports from TypeScript source; after adding the ABI subpath export and importing the ABI directly, `pnpm build` passed.
- Plan 015 review-fix RED checks:
  - `pnpm --filter @chateau/api test -- plan015-api-wallet-preserve-profile.test.ts` failed before the fix on missing/zero contract config, pending confirm semantics, and pending profile count assertions.
  - `pnpm --filter @chateau/web test -- chateauCellar.test.ts` failed before the fix because the zero-address payload still reached the wallet request.
- Plan 015 review-fix checks passed:
  - `pnpm --filter @chateau/api test -- plan015-api-wallet-preserve-profile.test.ts`
  - `pnpm --filter @chateau/web test -- api.test.ts WineResultScreen.test.ts chateauCellar.test.ts`
  - `pnpm --filter @chateau/api test`
  - `pnpm --filter @chateau/web test`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
  - `Select-String -Path apps/web/next-env.d.ts -Pattern '\.next'` returned no matches after build.

### Plan 016 validation

- Plan 016 RED checks:
  - `pnpm --filter @chateau/api test -- plan016-api-mvp-smoke.test.ts` failed before the fix because new sessions had no starter Screw Cap and `/api/wine/:batchId/sell` was not registered.
  - `pnpm --filter @chateau/web test -- api.test.ts` failed before the fix because `sellWine` was not exported by the web API client.
- Plan 016 checks passed:
  - `pnpm --filter @chateau/api test -- plan016-api-mvp-smoke.test.ts`
  - `pnpm --filter @chateau/web test -- api.test.ts`
  - `pnpm --filter @chateau/api test`
  - `pnpm --filter @chateau/web test`
  - `pnpm --filter @chateau/game-engine test`
  - `pnpm --filter @chateau/contracts test`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
  - `git diff -- apps/web/next-env.d.ts` produced no diff after build.
  - `Select-String -Path apps/web/next-env.d.ts -Pattern '\.next'` returned no matches after build.
  - `git diff --check` passed.
- Plan 016 review-fix RED checks:
  - `pnpm --filter @chateau/api test -- plan016-api-mvp-smoke.test.ts` failed because a `STORED` WineBatch sold successfully with HTTP 200 instead of being rejected.
  - `pnpm --filter @chateau/web test -- WineResultScreen.test.ts` failed because sell UI state and in-flight sell intent helpers did not exist.
- Plan 016 review-fix checks passed:
  - `pnpm --filter @chateau/api test -- plan016-api-mvp-smoke.test.ts`
  - `pnpm --filter @chateau/web test -- WineResultScreen.test.ts`
  - `pnpm --filter @chateau/api typecheck`
  - `pnpm --filter @chateau/web typecheck`
  - `pnpm --filter @chateau/api test`
  - `pnpm --filter @chateau/web test`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
- Plan 016 sell UI race fix RED check:
  - `pnpm --filter @chateau/web test -- WineResultScreen.test.ts` failed before implementation because `setWineSellUiStateForIntent` did not exist for batch-scoped async completion state.
- Plan 016 sell UI race fix checks passed:
  - `pnpm --filter @chateau/web test -- WineResultScreen.test.ts`
  - `pnpm --filter @chateau/web test`
  - `pnpm --filter @chateau/web typecheck`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
  - `git diff --check`

### Release setup hardening validation

- `pnpm --filter @chateau/db exec prisma validate --schema prisma/schema.prisma` passed with the documented sample `DATABASE_URL` injected for the command.
- `pnpm --filter @chateau/db prisma:generate` passed with the documented sample `DATABASE_URL` injected for the command.
- `pnpm typecheck` passed.
- `pnpm test` passed.
- `pnpm build` passed.
- Migration SQL exists at `packages/db/prisma/migrations/20260609000000_initial_schema/migration.sql`, is non-empty, and contains current core tables plus `ReferralChallenge_sourceShareId_key`.
- `Select-String -Path apps/web/next-env.d.ts -Pattern '\.next'` returned no matches after build.
- `git diff --check` passed.
- Known warning remains: Prisma 6.19 emits the `package.json#prisma` deprecation warning; this is tracked as low-risk technical debt.

### Release runtime smoke fix

- Fresh DB runtime smoke initially exposed that `pnpm --filter @chateau/api dev` did not open `127.0.0.1:4000` on Windows/tsx because `apps/api/src/server.ts` compared `import.meta.url` to a manually built `file://${process.argv[1]}` string.
- API entrypoint detection now compares `import.meta.url` to `pathToFileURL(resolve(process.argv[1])).href`, so the documented dev command calls `server.listen()` correctly.
- Added `apps/api/tests/server-entrypoint.test.ts` covering Windows argv path detection and non-entrypoint rejection.
- Fresh DB runtime smoke was rerun against an empty Docker PostgreSQL database on `127.0.0.1:55432`:
  - `pnpm install --frozen-lockfile`
  - local ignored `.env` copied from `.env.example` with disposable `DATABASE_URL`
  - `pnpm --filter @chateau/db prisma:generate`
  - `pnpm --filter @chateau/db prisma:migrate`
  - `pnpm --filter @chateau/db prisma:seed`
  - `pnpm --filter @chateau/api dev`
  - `pnpm --filter @chateau/web dev` with `NEXT_PUBLIC_CHATEAU_API_BASE_URL=http://127.0.0.1:4000`
- Runtime MVP smoke passed through HTTP: session without wallet, buy Vine, plant, harvest after tutorial readiness, preview, craft, result payload, ShareObject creation, public share load, wallet link for profile/preserve precondition, preserve prepare safe failure with missing ChateauCellar address, API profile route, and web profile route.

### Technical debt

- Add DB-backed Prisma integration tests before production for transaction rollback/concurrency.
- Introduce GrapeLot/provenance before multiple vine states materially affect quality.
- Configure deployed ChateauCellar addresses in `CHATEAU_CELLAR_BASE_ADDRESS` and `CHATEAU_CELLAR_BASE_SEPOLIA_ADDRESS` before using preserve in production.
- Add receipt verification/indexer follow-up if pending tx status needs to become confirmed automatically.
- Improve `/api/game/state` with per-plot occupancy/readiness before further plot UI polish.
- Add a real market/cellar wine listing before treating Market as a complete sell workflow.
- Move Prisma seed configuration from deprecated `package.json#prisma` to `prisma.config.ts` before Prisma 7.

### CI/staging readiness foundations

- Added GitHub Actions workflow at `.github/workflows/ci.yml`.
- CI runs on `pull_request`, `push`, and `workflow_dispatch`.
- CI uses Node 20, Corepack pnpm 11.3.0, PostgreSQL 16 service, `pnpm install --frozen-lockfile`, Prisma validate/generate, `prisma migrate deploy`, required Genesis Harvest seed, DB-backed API smoke, typecheck, tests, build, `git diff --check`, and a guard that fails if `apps/web/next-env.d.ts` contains `.next`.
- Added explicit API CORS support in `apps/api/src/plugins/cors.ts`, registered before routes in `apps/api/src/server.ts`.
- CORS allows only the configured `WEB_ORIGIN`, rejects unconfigured browser origins with HTTP 403, handles allowed preflight with HTTP 204, defaults to `http://localhost:3000` outside production when `WEB_ORIGIN` is missing, and fails clearly in production if `WEB_ORIGIN` is missing.
- Added CORS regression coverage in `apps/api/tests/cors.test.ts`.
- Added DB-backed smoke script at `apps/api/src/smoke/dbSmoke.ts` and `pnpm --filter @chateau/api smoke:db`.
- DB smoke uses the real Prisma client against `DATABASE_URL` and Fastify injection, verifies active Genesis Harvest seed, walletless session start, game state, buy vine, plant, test-time harvest readiness by updating `readyAt` in the smoke database, harvest, preview, craft/result, share creation, wallet link, and safe preserve prepare failure when `CHATEAU_CELLAR_BASE_SEPOLIA_ADDRESS` is not configured.
- README now documents CI, staging env, `WEB_ORIGIN` CORS requirements, `prisma migrate deploy` for CI/staging, mandatory seed, and the DB-backed smoke command.
- No gameplay logic, DB schema, migration SQL, contract logic, NFT minting, ERC-20 GRAPE, marketplace, staking, betting, withdrawal, or onchain buy/plant/harvest/craft/sell mutation logic was added.

### CI/staging readiness validation

- CORS RED check passed as expected before implementation:
  - `pnpm --filter @chateau/api test -- cors.test.ts` failed on missing allow-origin header, rejected-origin behavior, preflight handling, and production missing `WEB_ORIGIN` guard.
- CORS GREEN check passed:
  - `pnpm --filter @chateau/api test -- cors.test.ts`
- `pnpm --filter @chateau/api test` passed with 8 test files and 78 tests.
- `pnpm --filter @chateau/api typecheck` passed.
- `pnpm --filter @chateau/db exec prisma validate --schema prisma/schema.prisma` passed with a local sample `DATABASE_URL` injected for the command.
- `pnpm --filter @chateau/db prisma:generate` passed with a local sample `DATABASE_URL` injected for the command.
- `pnpm typecheck` passed.
- `pnpm test` passed.
- `pnpm build` passed.
- `git diff --check` passed, with only existing Git line-ending warnings on Windows.
- `Select-String -Path apps/web/next-env.d.ts -Pattern '\.next'` returned no matches.
- Local DB smoke could not be executed because Docker Desktop daemon was unavailable: Docker CLI exists, but the `dockerDesktopLinuxEngine` named pipe was missing. The CI workflow runs the same smoke script against its PostgreSQL 16 service.
- DB smoke robustness fix:
  - `apps/api/src/smoke/dbSmoke.ts` now wraps the full smoke path in a top-level `try/finally`.
  - Fastify is closed if the smoke server was created.
  - Prisma is explicitly disconnected in the top-level cleanup path even when the active Genesis Harvest seed check fails before server creation.
  - The missing Genesis Harvest path still fails clearly with `Genesis Harvest seed is missing or inactive`.
- DB smoke robustness validation:
  - `pnpm --filter @chateau/api smoke:db` was attempted with a local sample `DATABASE_URL`, but local PostgreSQL was not reachable at `127.0.0.1:5432`; the command exited with Prisma `Can't reach database server`, confirming the local environment blocker remains.
  - `pnpm --filter @chateau/api typecheck` passed.
  - `pnpm --filter @chateau/api test` passed with 8 test files and 78 tests.
  - `pnpm typecheck` passed.
  - `pnpm test` passed.

### Next safe step

Run the GitHub Actions CI workflow after pushing the branch, then address any CI-environment-only failures before staging deploy. After CI is green, choose same-origin proxy vs split-domain API CORS deployment and configure a real Base Sepolia `ChateauCellar` address only after deployment is verified.

### CI node runtime fix

- First GitHub Actions run `27447175270` failed at the `Install` step.
- Root cause: workflow used Node 20.20.2, while pinned `pnpm@11.3.0` requires Node 22.13+ and attempted to import the newer `node:sqlite` built-in.
- Minimal fix: CI workflow now uses Node 24, matching the local runtime used for successful validation.
- README CI notes were updated from Node 20 to Node 24.
- Second GitHub Actions run `27447255677` passed install, Prisma validate/generate, migrate deploy, seed, DB smoke, and typecheck, then failed during `pnpm test` in `@chateau/web` API client unit tests.
- Root cause: job-level `NEXT_PUBLIC_CHATEAU_API_BASE_URL` made web unit-test fetch URLs absolute (`http://127.0.0.1:4000/...`) while the existing local tests expect relative API paths.
- Minimal fix: the CI `Test` step now clears `NEXT_PUBLIC_CHATEAU_API_BASE_URL` so unit tests match local hermetic behavior; build keeps the staging-style API base URL from job env.

### Plan 017 visual MVP polish pass 1

- Lazyweb research was used for pattern inspiration only: mobile dashboard/status hierarchy, reward/result reveals, share/referral CTAs, profile/stat layouts, wallet/pending transaction clarity, and friendly empty/loading/error states.
- Relevant takeaways applied:
  - Put progress/status in the first viewport without replacing the playable map.
  - Use friction only to clarify commitment, especially preview/craft and Base preserve pending states.
  - Avoid competing CTAs by grouping result actions into flex, economy, preserve, and secondary actions.
  - Keep the MVP task-first and asset-light; no copied Lazyweb screenshots/assets or new dependencies were added.
- Web visual system now uses shared CSS tokens for parchment, wine, grape, vine, gold, state banners, stat cards, chips, buttons, map shell, result cards, and mobile wrapping rules.
- `WebShell` now presents a game-like hero/status area with GRAPE, Chateau Level, Season, Tutorial, and wallet-unlock messaging before the playable map.
- Phaser map polish keeps existing zone IDs and interaction behavior while adding vineyard ground texture, path strips, landmark-specific zone drawings, improved labels, active-zone highlight, and a stronger prompt bar.
- Shop, plot, winery, cellar, market, share, preserve, and public profile screens received panel/state polish only; no backend/API/gameplay behavior changed.
- Wine result screen now reads as a reward/reveal card with tier styling, metrics, cap indicator, label frame, Wine DNA meters, tag chips, production receipt, verdict block, sale/onchain signal, grouped actions, and pending-preserve copy that remains distinct from confirmed preservation.
- Tests were updated for presentational map metadata, shop visual metadata, quality presentation tokens, and Wine DNA row ordering.
- Remaining visual gaps for Visual Pass 2:
  - Browser-based visual QA across real mobile/desktop viewports.
  - Real cellar/market wine listings once backend endpoints exist.
  - More nuanced plot readiness once `/api/game/state` exposes per-plot occupancy/readiness.
  - Optional lightweight icon system if a dependency is already adopted later.

### Plan 017 validation

- RED checks:
  - `pnpm --filter @chateau/web test -- mapConfig.test.ts viewModels.test.ts WineResultScreen.test.ts` failed before implementation on missing map presentation metadata, shop visual metadata, and wine-result presentation helpers.
- Checks passed:
  - `pnpm --filter @chateau/web test`
  - `pnpm --filter @chateau/web typecheck`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
  - `git diff --check`
  - `Select-String -Path apps/web/next-env.d.ts -Pattern '\.next'` returned no matches.
- Browser fallback QA:
  - In-app Browser plugin control was not exposed in this turn after tool discovery, so terminal Playwright CLI was used as a fallback.
  - `pnpm --filter @chateau/web dev` was started locally on `http://localhost:3000`.
  - Playwright snapshot confirmed the hydrated page rendered the polished hero/status cards, map region, mobile controls, and expected API error state with no API server running.
  - Screenshot was inspected locally during QA and removed afterward to avoid leaving generated artifacts.
- Known validation note: `pnpm test` still prints the existing Ganache/uws Node fallback warning in contract tests, but the test command exits successfully.

### Plan 017 visual review fix

- Fixed the remaining map prompt overlap risk by adding `MAP_PROMPT_Y = MAP_HEIGHT - 220` in `apps/web/src/game/mapConfig.ts` and using it in `apps/web/src/components/game/PhaserMap.tsx`.
- Added regression coverage in `apps/web/src/game/mapConfig.test.ts` to keep the prompt at least 200 map units above the canvas bottom control band.
- Confirmed the existing Plan 017 working tree already contained the requested share URL wrapping rules in `apps/web/src/app/globals.css`, the backend-owned season fallback in `apps/web/src/components/WebShell.tsx`, and the future receipt-check pending copy in `apps/web/src/components/wallet/PreserveOnBasePanel.tsx`.
- No backend, API, DB, contract, gameplay, NFT, ERC-20, marketplace, staking, betting, withdrawal, or onchain buy/plant/harvest/craft/sell logic was changed.

### Plan 017 visual review validation

- RED check:
  - `pnpm --filter @chateau/web test -- mapConfig.test.ts` failed before implementation because `MAP_PROMPT_Y` was undefined.
- Checks passed:
  - `pnpm --filter @chateau/web test -- mapConfig.test.ts`
  - `pnpm --filter @chateau/web test`
  - `pnpm --filter @chateau/web typecheck`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
  - `git diff --check` passed with Windows line-ending warnings only.
  - `Select-String -Path apps/web/next-env.d.ts -Pattern '\.next'` returned no matches after removing the dev-server-generated `.next/dev/types/routes.d.ts` import.
- Browser fallback QA:
  - In-app Browser plugin control was still not exposed after tool discovery, so terminal Playwright CLI was used.
  - `pnpm --filter @chateau/web dev` was started on `http://localhost:3000`, then stopped after QA.
  - Map prompt/control measurements passed at requested viewports:
    - `360x740`: prompt clearance above controls `10.77px`, horizontal overflow `false`.
    - `390x844`: prompt clearance above controls `10.77px`, horizontal overflow `false`.
    - `1280x800`: prompt clearance above controls `97.02px`, horizontal overflow `false`.
  - Long share URL fixture using loaded app CSS had no horizontal overflow:
    - `360x740`: link width `306px`, right edge `333px`, viewport width `360px`.
    - `390x844`: link width `336px`, right edge `363px`, viewport width `390px`.
    - `1280x800`: link width `718px`, right edge `999px`, viewport width `1280px`.
  - Mocked browser game state with `activeSeason: null` showed `No active season` after load, with no `Genesis Harvest` and no Season-card `Loading` text.
  - Temporary Playwright files and screenshots were removed.
- Remaining visual QA gap:
  - API-backed visual QA through a real craft/share/preserve result flow still remains for a DB-seeded local stack or staging environment.

### Plan 017 API-backed visual QA overflow fix

- Fixed the remaining `/chateau/:wallet` mobile horizontal overflow in the profile hero/status area only; no backend, API, DB, contract, preserve, sell, share, or gameplay logic changed.
- Root cause confirmed in browser QA: the profile hero wallet heading expanded wider than the padded hero content track, and adjacent grid/flex children still needed explicit `min-width: 0` shrink behavior.
- `apps/web/src/app/chateau/[wallet]/page.tsx` now adds a dedicated `wallet-heading` class hook to the profile title.
- `apps/web/src/app/globals.css` now:
  - lets the profile hero/grid/card children shrink with `min-width: 0`,
  - wraps long wallet/title text safely with `overflow-wrap: anywhere` / `word-break: break-word`,
  - and allows public-cellar row text/status content to wrap instead of forcing horizontal scroll.
- Added a narrow regression check in `apps/web/src/app/chateau/[wallet]/page.test.tsx` that fails if the wallet-heading markup hook is removed.
- `apps/web/next-env.d.ts` remains standard Next references only and still contains no generated `.next` import.

### Plan 017 API-backed visual QA overflow validation

- RED checks:
  - Browser QA before the fix reproduced the overflow on the real profile route against a controlled local profile response:
    - `360x740`: `scrollWidth 387`, `clientWidth 360`, hero `scrollWidth 376`, title width `358`
    - `390x844`: `scrollWidth 417`, `clientWidth 390`, hero `scrollWidth 406`, title width `388`
  - `pnpm --filter @chateau/web test -- 'src/app/chateau/[wallet]/page.test.tsx'` failed before implementation because `className="wallet-heading"` was missing from the page source.
- Checks passed:
  - `pnpm --filter @chateau/web test -- 'src/app/chateau/[wallet]/page.test.tsx'`
  - `pnpm --filter @chateau/web test`
  - `pnpm --filter @chateau/web typecheck`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
  - `git diff --check` passed with existing Windows line-ending warnings only.
  - `Select-String -Path apps/web/next-env.d.ts -Pattern '\.next'` returned no matches.
- Browser QA after the fix:
  - `360x740`: `scrollWidth 360`, `clientWidth 360`, hero `scrollWidth 338`, title width `302`
  - `390x844`: `scrollWidth 390`, `clientWidth 390`, hero `scrollWidth 368`, title width `332`
  - `1280x800`: `scrollWidth 1280`, `clientWidth 1280`, hero `scrollWidth 750`, title width `313`

### Plan 018 reference visual pass

- Added `.plans/018-reference-visual-pass.md` for the reference-style visual pass.
- Web shell now opens as a game frame instead of a marketing-style hero:
  - compact top HUD with menu, GRAPE balance, Chateau level/cap status, and Base wallet status,
  - quest overlay above the map,
  - disabled MVP quick-action buttons for Quests/Friends/Leaderboard,
  - fixed bottom navigation,
  - current-batch dock driven only by real `wineResult` data.
- Phaser map now uses a taller mobile-first scene (`720x1040`) with the reference landmark ordering:
  - chateau/winery at top,
  - cellar and production in the upper map,
  - three vineyards in the middle,
  - shop and market lower on the map,
  - Ghost Sommelier near the player path.
- Phaser drawing was upgraded from schematic rectangles to a richer cozy winery scene with forest edges, stone paths, chateau facade, building/vineyard decoration, Base banner treatment, ghost glow, and stronger zone labels.
- Mobile joystick/interact controls were restyled as dark circular controls and fixed above the bottom nav on narrow screens to avoid overlap.
- The HUD `+` button now opens the existing Shop interaction; no new backend, API, DB, contract, wallet, preserve, economy, NFT, ERC-20, marketplace, staking, betting, withdrawal, or onchain gameplay mutation logic was added.
- Browser QA used the existing local Next dev server on `127.0.0.1:3000`; Playwright Chromium was installed into the user Playwright cache because the CLI browser binary was missing.
- Temporary Playwright screenshots were removed after inspection.

### Plan 018 validation

- RED check:
  - `pnpm --filter @chateau/web test -- mapConfig.test.ts` failed before implementation because `MAP_HEIGHT` was still `480`, below the new tall-scene contract.
  - `pnpm --filter @chateau/web test -- WineResultScreen.test.ts` failed before the dock presentation helper because `getCurrentBatchDockView` did not exist.
- Checks passed:
  - `pnpm --filter @chateau/web test -- mapConfig.test.ts`
  - `pnpm --filter @chateau/web test -- mapConfig.test.ts WineResultScreen.test.ts`
  - `pnpm --filter @chateau/web test -- WineResultScreen.test.ts`
  - `pnpm --filter @chateau/web typecheck`
  - `pnpm --filter @chateau/web test`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
  - `git diff --check` passed with Windows line-ending warnings only.
  - `Select-String -Path apps/web/next-env.d.ts -Pattern '\.next'` returned no matches.
- Browser visual QA:
  - Playwright screenshots were captured at `390x844` and `1280x800` after waiting for `.map-canvas-shell canvas`.
  - First mobile screenshot caught the joystick/interact controls partly under the fixed bottom nav; CSS was corrected by making narrow-screen mobile controls fixed above the nav.
  - Follow-up mobile screenshot showed the controls above the bottom nav and the map rendering nonblank with HUD/quest/quick-action overlays visible.
- Remaining visual risks:
  - This is still CSS/Phaser-drawn art, not final premium bitmap/isometric game art.
  - Full API-backed visual QA through an actual crafted `wineResult` current-batch dock remains a next pass, but the dock now has a pure `getCurrentBatchDockView` presentation contract covered by tests.
  - Top HUD XP/progress remains a non-authoritative visual status row until a backend XP/reputation field exists.

### Next safe step

Run an API-backed local or staging flow through buy/plant/harvest/craft and capture the actual `wineResult` dock/result screen, then decide whether to commission/generate real map/building/character/bottle bitmap assets for the next fidelity jump.

### Plan 018 reference feedback follow-up

- User feedback confirmed the previous SVG/Phaser concept art was still far from the provided reference.
- Switched the map rendering approach from vector-concept art toward reference-derived bitmap rendering:
  - `MAP_ART_ASSET_PATH` now points to `/game/art/reference-pass/map-ground.png`.
  - Added `MAP_REFERENCE_SPRITES` metadata and regression coverage for the prepared temporary raster asset pack.
  - Generated temporary project-local PNG assets under `apps/web/public/game/art/reference-pass/` from the provided reference image.
  - Phaser now loads the bitmap ground with `this.load.image` and keeps interaction rectangles as low-alpha overlays only.
- Reduced inactive interaction-zone outlines so the map reads as artwork instead of debug boxes.
- Adjusted the mobile Sommelier bubble so it no longer drops into the fixed joystick/interact control band at narrow viewports.
- This pass did not change backend, API, DB, contracts, wallet, preserve, economy, NFT, ERC-20, marketplace, staking, betting, withdrawal, or onchain gameplay mutation logic.

### Plan 018 reference feedback validation

- RED check:
  - `pnpm --filter @chateau/web test -- mapConfig.test.ts` failed after switching config to the new bitmap asset paths and before generating the PNG files.
- Checks passed:
  - `pnpm --filter @chateau/web test -- mapConfig.test.ts`
  - `pnpm --filter @chateau/web test -- mapConfig.test.ts viewModels.test.ts WineResultScreen.test.ts`
  - `pnpm --filter @chateau/web test`
  - `pnpm --filter @chateau/web typecheck`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
  - `git diff --check` passed with Windows line-ending warnings only.
  - `Select-String -Path apps/web/next-env.d.ts -Pattern '\.next'` returned no matches after restoring the dev-server-generated import.
- Browser visual QA:
  - Playwright screenshots were captured at `360x740`, `390x844`, and `1280x800` against `http://localhost:3000`.
  - The map now uses a crisp reference-derived raster background and no longer shows the earlier vector/SVG placeholder style.
  - Remaining known visual risk: the current bitmap ground is derived from the full reference mockup, so some baked reference UI/artifacts remain in the background. Final production quality still needs clean source art layers or generated/commissioned map, character, UI, and bottle assets.

### Next safe step

Create clean source art layers for the playable map instead of relying on the composite reference PNG: background-only map, character sprite, Ghost Sommelier sprite, landmark labels, controls, and current-batch/bottle assets.

### Plan 018 screenshot-background correction

- User feedback identified the previous reference feedback follow-up as incorrect because it used the provided screenshot as the map background.
- Removed the screenshot-derived runtime path and temporary `apps/web/public/game/art/reference-pass/` assets.
- `MAP_ART_ASSET_PATH` now points to `/game/art/chateau-map-painterly.png`.
- Added a regression assertion that the runtime map art path must not contain `reference-pass`.
- Generated `apps/web/public/game/art/chateau-map-painterly.png` from original procedural layers only: grass/forest texture, stone paths, chateau, cellar, production, vineyards, shop, market, Base banner, Ghost Sommelier, props, and vignette.
- Phaser still loads the map as a bitmap art layer, but no longer uses pixels from the supplied reference screenshot.
- No backend, API, DB, contracts, wallet, preserve, economy, NFT, ERC-20, marketplace, staking, betting, withdrawal, or onchain gameplay mutation logic was changed.

### Plan 018 screenshot-background correction validation

- RED check:
  - `pnpm --filter @chateau/web test -- mapConfig.test.ts` failed while `MAP_ART_ASSET_PATH` still pointed to `/game/art/reference-pass/map-ground.png`.
- Checks passed:
  - `pnpm --filter @chateau/web test -- mapConfig.test.ts`
  - `pnpm --filter @chateau/web test`
  - `pnpm --filter @chateau/web typecheck`
  - `pnpm --filter @chateau/web build`
  - `git diff --check` passed with Windows line-ending warnings only.
  - `Select-String -Path apps/web/next-env.d.ts -Pattern '\.next'` returned no matches after build restore.
- Browser QA:
  - `npx --yes playwright screenshot --viewport-size=360,740 --wait-for-selector='.map-canvas-shell canvas' --wait-for-timeout=1500 http://localhost:3000 output/playwright/no-screenshot-bg-360.png`
  - Screenshot confirmed the map is no longer the composite reference screenshot.
- Remaining visual risk:
  - The new asset is original and clean, but still procedural/temporary. Matching the provided reference quality still requires real generated or commissioned layered art assets.

### Plan 018 generated map art pass

- Used the user-provided `responses-image-generation` skill from `C:\Users\Администратор\Downloads\responses-image-generation.zip`.
- The skill script was inspected before use and run from a temporary extracted copy; no API keys or secret files were printed.
- Generated a clean 720x1040 PNG map via the Responses API image generation tool using the user's reference image only as style/composition input.
- Prompt constraints explicitly required:
  - standalone map art only,
  - no HUD/app chrome/buttons/joystick/cards/speech bubbles,
  - no copied screenshot pixels,
  - no player character,
  - chateau/winery, cellar, production, three vineyards, shop, market, fountain, Base banner, Ghost Sommelier, paths, forest edges, props, and warm painterly lighting.
- Replaced `apps/web/public/game/art/chateau-map-painterly.png` with the generated clean map art.
- Removed the old `apps/web/public/game/art/chateau-map-concept.svg` vector placeholder.
- Runtime remains unchanged structurally: Phaser loads `MAP_ART_ASSET_PATH` as a bitmap map layer and keeps interaction zones as low-alpha overlays.
- No backend, API, DB, contracts, wallet, preserve, economy, NFT, ERC-20, marketplace, staking, betting, withdrawal, or onchain gameplay mutation logic was changed.

### Plan 018 generated map art validation

- Visual QA:
  - Source generated image was inspected at `output/imagegen/chateau-map-clean.png` before integration.
  - Browser screenshot was captured at `390x844` after integration and confirmed the generated map renders under the game HUD/controls.
- Checks passed:
  - `pnpm --filter @chateau/web test -- mapConfig.test.ts`
  - `pnpm --filter @chateau/web test`
  - `pnpm --filter @chateau/web typecheck`
  - `pnpm --filter @chateau/web build`
  - `pnpm typecheck`
  - `pnpm test`
  - `git diff --check` passed with Windows line-ending warnings only.
  - `Select-String -Path apps/web/next-env.d.ts -Pattern '\.next'` returned no matches after build restore.
- Remaining visual risk:
  - This pass upgrades the main map art substantially, but character, Ghost Sommelier as a separate sprite, bottle/current-batch art, and UI icons are still not generated as separate production assets.

### Plan 018 player sprite pass

- Generated a separate player character asset with the user-provided `responses-image-generation` skill.
- Prompt required a single centered cozy winemaker character, back/3-4 view, black curly hair, dark navy BASE hoodie, no props, and flat `#00ff00` chroma-key background.
- Removed the chroma-key background locally and saved a transparent sprite at `apps/web/public/game/art/player-winemaker.png`.
- Added `PLAYER_SPRITE_ASSET_PATH = "/game/art/player-winemaker.png"` in `apps/web/src/game/mapConfig.ts`.
- Added regression coverage that the transparent player sprite exists in project-local public assets.
- Replaced the Phaser debug circle player with the generated bitmap sprite while keeping the small blue player marker.
- Browser QA at `390x844` showed the sprite rendered at a readable size over the generated map.
- No backend, API, DB, contracts, wallet, preserve, economy, NFT, ERC-20, marketplace, staking, betting, withdrawal, or onchain gameplay mutation logic was changed.

### Plan 018 player sprite validation

- RED check:
  - `pnpm --filter @chateau/web test -- mapConfig.test.ts` failed before implementation because `PLAYER_SPRITE_ASSET_PATH` was undefined.
- Checks passed:
  - `pnpm --filter @chateau/web test -- mapConfig.test.ts`
  - `pnpm --filter @chateau/web typecheck`
  - `pnpm --filter @chateau/web build`
- Remaining visual risk:
  - Player movement still uses one static facing direction. Directional walk frames are still needed for production animation quality.
