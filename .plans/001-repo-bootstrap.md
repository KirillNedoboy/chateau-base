# Plan 001 — Repo Bootstrap

## Goal
Create the initial pnpm monorepo structure.

## Files to touch
- `package.json`
- `pnpm-workspace.yaml`
- `turbo.json`
- `apps/web`
- `apps/api`
- `packages/shared`
- `packages/game-engine`
- `packages/db`
- `.env.example`
- `SESSION_NOTES.md`

## Out of scope
- gameplay
- wallet
- Prisma schema
- NFT/token logic

## Tasks
1. Create pnpm workspace.
2. Add Next.js TypeScript app in `apps/web`.
3. Add Fastify TypeScript API in `apps/api`.
4. Add shared TypeScript package.
5. Add pure game-engine package with Vitest.
6. Add db package placeholder.
7. Add root scripts: dev, build, test, typecheck, lint.
8. Add `.env.example`.
9. Run available checks.
10. Update `SESSION_NOTES.md`.

## Verification
- `pnpm install`
- `pnpm typecheck`
- `pnpm test`
