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
- pnpm workspace created with `apps/web`, `apps/api`, `packages/shared`, `packages/game-engine`, and `packages/db`.
- Web app is a minimal Next.js TypeScript shell.
- API app is a minimal Fastify TypeScript shell with `/health`.
- Shared package now exports MVP domain type contracts from `packages/shared/src/domain`.
- Game-engine exports `DEFAULT_GAME_CONFIG` from `packages/game-engine/src/config`.
- Game-engine exports pure vine and wine calculation functions from `packages/game-engine/src/vine` and `packages/game-engine/src/wine`.
- DB package is a minimal TypeScript package.
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
- Plan 004 source scan found no `Date.now` or `Math.random` usage in game-engine source/tests for core wine engine.
- `pnpm lint` passed during Plan 001 and remains available.

### Scope notes

- Gameplay was not implemented.
- Wallet code was not implemented.
- Prisma schema was not implemented.
- NFT, token, and marketplace code were not implemented.
- API routes were not implemented.
- Frontend UI was not changed.
- Core deterministic game-engine formulas for vine state, grape yield, bottle count, raw quality score, quality thresholds, quality caps, and wine batch orchestration were implemented.
- Shared domain files contain type contracts only; no runtime functions/constants were added.
- `DEFAULT_GAME_CONFIG` centralizes MVP economy/config constants; no calculation formulas were added.
- Randomness is caller-supplied through `randomFactor`; calculations do not generate random values.
- Wine DNA, labels, verdicts, sale price, moments, API routes, Prisma schema, frontend UI, wallet/Base code, and persistence were not implemented.

### Next safe step

Implement Plan 005 only after reading its scope and confirming it does not cross MVP boundaries.
