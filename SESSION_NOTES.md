# SESSION_NOTES.md

## Initial state

Project started from documentation only.

### Product

Chateau Base is a mobile-first cozy degen winery game for Web, PWA, Telegram Mini App, and Base-compatible identity/profile layer.

### Current status

- Plan 001 repo bootstrap implemented.
- Plan 002 shared domain types implemented.
- pnpm workspace created with `apps/web`, `apps/api`, `packages/shared`, `packages/game-engine`, and `packages/db`.
- Web app is a minimal Next.js TypeScript shell.
- API app is a minimal Fastify TypeScript shell with `/health`.
- Shared package now exports MVP domain type contracts from `packages/shared/src/domain`.
- Game-engine and db packages are minimal TypeScript packages.
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
- `pnpm lint` passed during Plan 001 and remains available.

### Scope notes

- Gameplay was not implemented.
- Wallet code was not implemented.
- Prisma schema was not implemented.
- NFT, token, and marketplace code were not implemented.
- API routes were not implemented.
- Frontend UI was not changed.
- Game-engine formulas were not implemented.
- Shared domain files contain type contracts only; no runtime functions/constants were added.

### Next safe step

Implement Plan 003 only after reading its scope and confirming it does not cross MVP boundaries.
