# BASE_PRESERVE_PIVOT.md

## Pivot statement

New strategy: `Game-first + Preserve-on-Base`.

Core rule: `Backend decides. Base preserves.`

## What changes

- Gameplay economy remains backend-authoritative and off-chain.
- Wallet is still optional until the first gameplay payoff (first wine result).
- Base integration in MVP preserves meaningful vintages and selected challenge moments only.
- Preserve writes are intentional and sparse, not per-action game settlement.

## What does not change

- No ERC-20 `GRAPE` in MVP.
- No NFT mint in MVP.
- No marketplace.
- No staking.
- No betting.
- No withdrawals.

## Explicit MVP boundaries for onchain behavior

Forbidden onchain gameplay mutations:
- buy vine
- plant
- harvest
- craft wine
- sell wine

Allowed onchain scope:
- preserve selected vintage metadata
- preserve selected challenge moment metadata
- preserve proof/status references for Base profile

## Product implication

- Game loop remains instant and session-first.
- Base layer records social/high-signal outcomes, not every interaction.
- Preserve records are additive social memory, not economic settlement.
