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
- Base Preserve pivot documentation applied.
- pnpm workspace created with `apps/web`, `apps/api`, `packages/shared`, `packages/game-engine`, and `packages/db`.
- Web app is a minimal Next.js TypeScript shell.
- API app is a minimal Fastify TypeScript shell with `/health`.
- Shared package now exports MVP domain type contracts from `packages/shared/src/domain`.
- Game-engine exports `DEFAULT_GAME_CONFIG` from `packages/game-engine/src/config`.
- Game-engine exports pure vine and wine calculation functions from `packages/game-engine/src/vine` and `packages/game-engine/src/wine`.
- Game-engine exports pure moment detection, moment priority selection, and moment copy metadata from `packages/game-engine/src/moments`.
- Contracts package now contains `ChateauCellar` preserve-only contract, ABI export, Base Sepolia deployment placeholders, and contract tests.
- DB package is a minimal TypeScript package.
- DB package now includes Prisma schema, Prisma client export, and Genesis Harvest seed.
- Game-engine has one bootstrap Vitest test and no gameplay rules.
- DB package is a placeholder only; no Prisma schema has been added.
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

### Scope notes

- Gameplay was not implemented.
- Wallet code was not implemented.
- Prisma schema was not implemented.
- NFT, token, and marketplace code were not implemented.
- API routes were not implemented.
- Frontend UI was not changed.
- No source code was changed for Base Preserve pivot; documentation and plans only.
- Core deterministic game-engine formulas for vine state, grape yield, bottle count, raw quality score, quality thresholds, quality caps, and wine batch orchestration were implemented.
- Shared domain files contain type contracts only; no runtime functions/constants were added.
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

### Next safe step

Implement Plan 008 only after reading its scope and keeping preserve-on-Base boundaries unchanged.
