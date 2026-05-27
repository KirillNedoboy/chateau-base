# ARCHITECTURE.md

## Core principle

Frontend shows. Backend decides. Phaser moves. API mutates. Database remembers. Base preserves.

## System flow

Player Intent
→ API mutation
→ idempotency check
→ service
→ game-engine calculation
→ database transaction
→ GameActionLog
→ GameEvent analytics
→ API response
→ React UI / Phaser update

Preserve flow (selected outcomes only)
→ preserve eligibility check
→ preserve payload build
→ onchain write request
→ preserve receipt/status saved in backend

## Client responsibilities

- Telegram init data/session boot
- mobile-first UI
- Phaser map
- interaction prompts
- result screen
- share cards rendering
- wallet connection after first result
- public profile display

## Backend responsibilities

- user creation
- wallet linking
- inventory
- balances
- shop
- plot/vine state
- timers
- harvest
- craft
- quality calculation
- caps
- Wine DNA
- labels
- moments
- verdicts
- sale price
- cellar
- share objects
- challenge attribution
- analytics events
- idempotency/action logs
- preserve eligibility decisions
- preserve payload and onchain receipt tracking

## Game engine responsibilities

Pure functions:
- calculateVineState
- calculateGrapeYield
- calculateBottleCount
- calculateQualityScore
- applyQualityCaps
- generateWineProfile
- generateStyleTags
- generateWineLabel
- detectMoments
- selectPrimaryMoment
- generateVerdict
- calculateSalePrice
- getRunItBackPreview
- checkBasedVintageEligibility

## Base MVP

Base is not used for game settlement.

MVP Base features:
- walletAddress linked to user
- chainId stored
- Base/Base Sepolia recognized
- Base profile placeholder
- meaningful vintages preserved on Base
- selected challenge moments preserved on Base
- Based Vintage cosmetic status
- NFT-ready WineBatch metadata

No token or minting logic in MVP.
No onchain buy/plant/harvest/craft/sell gameplay mutations in MVP.

## Monorepo target structure

```txt
chateau-base/
  AGENTS.md
  PRODUCT_SPEC.md
  MVP_SCOPE.md
  ARCHITECTURE.md
  SESSION_NOTES.md
  .plans/
  .checkpoints/

  apps/
    web/
      src/
        app/
        components/
        game/
        features/
        lib/
        stores/
      AGENTS.md

    api/
      src/
        modules/
        routes/
        plugins/
        server.ts
      AGENTS.md

  packages/
    game-engine/
      src/
        config/
        quality/
        wine-dna/
        moments/
        labels/
        verdicts/
        sale/
        tutorial/
        index.ts
      tests/
      AGENTS.md

    db/
      prisma/
        schema.prisma
        migrations/
      src/
        client.ts
      AGENTS.md

    shared/
      src/
        types/
        constants/
        schemas/
      AGENTS.md
```

## API target

```txt
POST /api/session/start
GET  /api/me
GET  /api/game/state

POST /api/shop/buy
POST /api/vines/plant
POST /api/vines/harvest

POST /api/winery/preview
POST /api/winery/craft

GET  /api/wine/:batchId
POST /api/wine/:batchId/sell
POST /api/wine/:batchId/store

POST /api/share
GET  /api/s/:shareId

POST /api/challenge/open
POST /api/challenge/start
POST /api/challenge/complete

POST /api/wallet/link
GET  /api/chateau/:walletAddress

POST /api/analytics/event
```

## Mutation rule

Every important mutation body must include:

```ts
{
  idempotencyKey: string;
}
```

## Idempotency flow

1. Check `GameActionLog` by `userId + actionType + idempotencyKey`.
2. If exists, return stored `responsePayload`.
3. If not, execute transaction.
4. Store `requestPayload` and `responsePayload`.
5. Return response.
