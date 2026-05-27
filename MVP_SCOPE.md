# MVP_SCOPE.md

## MVP objective

Deliver a playable vertical slice where a player can open the app, create the first wine within 3 minutes, receive a result, share/sell it, optionally link a Base wallet after the first result, and preserve selected high-signal outcomes on Base.

## Must-have

### Core loop

- open app
- create user/session
- move on tiny map
- buy vine
- plant vine
- wait growth timer
- harvest grapes
- craft wine
- reveal result
- sell wine
- share result

### Wine system

- quality score
- caps
- bottle count
- Wine DNA
- style tags
- WineLabel
- Sommelier verdict
- Style verdict
- sale price

### Viral

- Moment Engine
- Almost Legendary
- Run It Back preview
- ShareObject
- Classy/Degen share modes
- Challenge attribution
- Corkfather

### Base

- Base network config
- Base Sepolia test config
- wallet connect after first result
- walletAddress linking
- baseProfileLinked flag
- preserve meaningful vintages on Base
- preserve selected challenge moments on Base
- `/chateau/:wallet`
- NFT-ready metadata fields

### System

- GameConfig
- idempotency
- GameActionLog
- analytics events
- Tutorial State Machine
- backend-authoritative mutations

## Optional if ahead

- Coward Meter basic
- RNG Rugged
- Based Fermentation
- Cellar Slots
- Basic achievements
- Copy Flex Link

## Not MVP

- ERC-20 GRAPE
- NFT mint
- marketplace
- staking
- betting
- withdrawals
- onchain buy/plant/harvest/craft/sell mutations
- PvP
- multiplayer
- weather
- diseases
- many grape varieties
- public humiliation leaderboards
- bottle instances
- full Farcaster integration
- LiveOps admin panel
