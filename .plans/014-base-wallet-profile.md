# Plan 014 — Base Wallet and Public Profile

## Goal
Add Base identity/profile layer after first wine result.

## Files to touch
- `apps/web/src/lib/web3/*`
- `apps/web/src/components/wallet/*`
- `apps/web/src/app/chateau/[wallet]/*`
- `apps/api/src/modules/wallet/*`
- `apps/api/src/modules/profile/*`
- `SESSION_NOTES.md`

## Out of scope
- ERC-20
- NFT mint
- marketplace
- paid transactions

## Tasks
1. Configure wagmi/viem for Base and Base Sepolia.
2. Add Reown AppKit / WalletConnect placeholder config.
3. Add Coinbase Wallet support.
4. Show wallet prompt only after first wine result.
5. Implement `POST /api/wallet/link`.
6. Store walletAddress, chainId, baseProfileLinked.
7. Implement `/chateau/:wallet`.
8. Display profile stats.
9. Add Based Winemaker status placeholder.
10. Update `SESSION_NOTES.md`.

## Verification
- `pnpm typecheck`
- manual wallet prompt visibility check
