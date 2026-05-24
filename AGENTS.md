# AGENTS.md

## Project overview

Chateau Base is a mobile-first cozy degen winery game for Web, PWA, Telegram Mini App, and Base-compatible web app.

The MVP is not an onchain economy. Base is used only as an identity/profile/wallet-link layer:
- Base network config
- Base Sepolia for tests
- wallet linking after first wine result
- public Base profile placeholder
- NFT-ready metadata foundation

No ERC-20, no NFT minting, no marketplace, no staking, no betting, and no withdrawals in MVP.

## Product formula

Open link → walk → buy vine → plant → harvest → craft wine → reveal result → get judged → share/sell/run it back.

The player crafts a social artifact, not just wine.

## Stack

Frontend:
- Next.js
- React
- Phaser 3
- TailwindCSS
- Zustand
- wagmi
- viem
- Reown AppKit / WalletConnect
- Coinbase Wallet support
- OnchainKit optional

Backend:
- Node.js
- Fastify
- PostgreSQL
- Prisma
- Redis optional

Monorepo:
- pnpm workspaces
- packages/shared
- packages/game-engine
- packages/db
- apps/web
- apps/api

Testing:
- Vitest for game-engine and backend logic

## Common commands

- Install: `pnpm install`
- Dev all: `pnpm dev`
- Dev web: `pnpm --filter @chateau/web dev`
- Dev api: `pnpm --filter @chateau/api dev`
- Test: `pnpm test`
- Test engine: `pnpm --filter @chateau/game-engine test`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`
- Prisma generate: `pnpm --filter @chateau/db prisma:generate`
- Prisma migrate dev: `pnpm --filter @chateau/db prisma:migrate`

## Architecture rules

1. Backend is authoritative for all game mutations.
2. Phaser handles movement, collision, interaction zones, and visual game feel only.
3. Game economy must live in backend services plus `packages/game-engine`.
4. Shared domain types live in `packages/shared`.
5. Pure calculations live in `packages/game-engine`.
6. Prisma schema lives only in `packages/db`.
7. Web app calls API; it must not mutate authoritative game state locally.
8. Zustand may cache UI/session state, but server responses always win.
9. Economy values must come from GameConfig, not scattered hardcoded constants.
10. Every important mutation must use `idempotencyKey`.

## MVP boundaries

Allowed in MVP:
- user/session creation
- Telegram userId start
- grape balance
- shop
- vine purchase
- plant/harvest
- craft wine
- quality score
- caps
- Wine DNA
- style tags
- WineLabel
- Moment Engine
- Sommelier verdict
- ShareObject
- Challenge attribution
- sell wine
- wallet connect after first result
- walletAddress linking
- baseProfileLinked flag
- `/chateau/:wallet`
- NFT-ready metadata

Not allowed in MVP:
- ERC-20 GRAPE
- NFT minting
- marketplace
- staking
- withdrawals
- PvP
- multiplayer
- complex seasons
- weather
- diseases
- full Farcaster integration
- liveops admin panel

## Editing boundaries

| Area | Allowed | Ask first | Never |
|---|---|---|---|
| `apps/web/src` | yes |  |  |
| `apps/api/src` | yes |  |  |
| `packages/game-engine/src` | yes |  |  |
| `packages/shared/src` | yes |  |  |
| `packages/db/prisma/schema.prisma` | yes | destructive migrations |  |
| `.env*` |  |  | never commit secrets |
| package manager |  | changing from pnpm |  |
| MVP scope |  | expanding scope |  |

## Testing rules

For `packages/game-engine`, every important rule needs tests:
- quality thresholds
- quality caps
- tutorial first result distribution
- bottle count
- sale price
- moment detection
- almost legendary
- rng rugged
- based vintage eligibility

Do not mark a task done until:
- relevant tests pass
- typecheck passes when available
- changed files are summarized
- `SESSION_NOTES.md` is updated

## Coding style

- TypeScript strict mode.
- No `any` unless isolated and justified.
- Domain enums/constants must be centralized.
- Backend route handlers should be thin.
- Game logic should be pure functions where possible.
- Use zod schemas for API input validation.
- Use `idempotencyKey` for all mutation routes.

## Session workflow

At the start of each coding session:
1. Read `AGENTS.md`.
2. Read `PRODUCT_SPEC.md`.
3. Read `MVP_SCOPE.md`.
4. Read `ARCHITECTURE.md`.
5. Read `SESSION_NOTES.md`.
6. Read the current plan from `.plans/`.

At the end of each coding session:
1. Run relevant tests.
2. Update `SESSION_NOTES.md`.
3. Write the next safe step.
4. Do not claim completion without verification.
