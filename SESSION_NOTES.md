# SESSION_NOTES.md

## Initial state

Project started from documentation only.

### Product

Chateau Base is a mobile-first cozy degen winery game for Web, PWA, Telegram Mini App, and Base-compatible identity/profile layer.

### Current status

- Plan 001 repo bootstrap implemented.
- pnpm workspace created with `apps/web`, `apps/api`, `packages/shared`, `packages/game-engine`, and `packages/db`.
- Web app is a minimal Next.js TypeScript shell.
- API app is a minimal Fastify TypeScript shell with `/health`.
- Shared, game-engine, and db packages are minimal TypeScript packages.
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
- `pnpm typecheck` passed.
- `pnpm test` passed.
- `pnpm lint` passed.
- `pnpm build` passed.

### Scope notes

- Gameplay was not implemented.
- Wallet code was not implemented.
- Prisma schema was not implemented.
- NFT, token, and marketplace code were not implemented.

### Next safe step

Implement Plan 002 only after reading its scope and confirming it does not cross MVP boundaries.
