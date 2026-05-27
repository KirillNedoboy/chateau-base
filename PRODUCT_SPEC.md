# PRODUCT_SPEC.md

# Chateau Base — Product Specification

## 1. What we are building

Chateau Base is a mobile-first Web / Telegram Mini App / PWA game about running a tiny winery.

The player opens a link and immediately enters a small chateau. They control a character, walk around the map, buy vines, plant them, harvest grapes, craft wine, reveal the result, sell the bottle, or share it with friends.

Main loop:

```txt
Open link
→ walk
→ buy vine
→ plant
→ harvest
→ craft wine
→ reveal result
→ get judged
→ share / sell / run it back
```

This is not tap-to-earn, not a DeFi farm, and not just another farm game.

It is:

```txt
cozy winery game
+ degen social flex
+ toxic sommelier
+ Base identity
+ future NFT collectibles
```

Main slogan:

```txt
Make wine. Get judged. Flex the bottle. Stay based.
```

## 2. Simple game essence

The player makes wine.

But they do not just press a button.

They personally go through the path:

```txt
buy vine
→ plant
→ wait for harvest
→ collect grapes
→ choose production method
→ receive bottle
→ game judges result
→ player shares or sells
```

Core feeling:

> The player made a bottle, and the game says either “you cooked” or “you ruined everything.”

## 3. Platforms

The game is mobile-first web.

Target platforms:
- Web
- Mobile Web
- PWA
- Telegram Mini App / Telegram Web App
- Base-compatible web app

The game must open instantly through a link.

Important:
- player must not connect wallet before first fun gameplay moment

Correct flow:

```txt
Player opens Telegram Mini App
→ plays immediately through Telegram userId / session
→ makes first bottle
→ sees result
→ game offers to save vintage in Base profile
→ player connects EVM wallet
→ progress links to walletAddress
```

## 4. How Base is added in MVP

Base is required in MVP.

But:

```txt
Base-native app does not mean fully onchain game.
```

In the first build, Base is used as:
- identity layer
- profile layer
- wallet link
- Base-native status
- preserve layer for meaningful vintages and selected challenge moments
- future NFT-ready metadata
- public cellar foundation

In the first build, Base is not used for:
- ERC-20 token
- NFT mint
- marketplace
- staking
- betting
- withdrawals
- onchain buy/plant/harvest/craft/sell gameplay mutations
- paid transactions

The game lives inside the Base ecosystem, but the economy remains off-chain.

Preserve model in MVP:
- Backend decides what is preserve-worthy.
- Base stores selected social artifacts.
- Base does not execute core game economy.

## 5. User model

```ts
type User = {
  id: string;

  telegramUserId: string | null;
  walletAddress: string | null;
  chainId: number | null;

  baseProfileLinked: boolean;

  grapeBalance: number;
  chateauLevel: 1 | 2 | 3;

  tutorialState: TutorialState;

  sommelierViolenceEnabled: boolean;
  cowardMeter: number;

  createdAt: string;
  updatedAt: string;
};
```

## 6. Main fantasy

The player should feel:

> “I own a small chateau. I grow grapes, choose production methods, and make my own wine.”

Second layer:

> “The game roasts my decisions and gives me something worth flexing.”

Tone:

```txt
cozy outside
toxic inside
```

The player comes for a cute chateau.
They stay for rarity.
They share because of ego.
They return because the game insulted them well.

## 7. Audience

### Normies

They care about:
- understandable gameplay
- beautiful atmosphere
- fast first result
- simple economy
- beautiful achievement card

For them:
- Classy Mode
- soft tone
- beautiful wine labels
- cozy UI
- less toxicity

### Degens / crypto users

They care about:
- rarity
- flex
- roast
- Base identity
- leaderboard
- meme achievements
- wallet
- future NFT
- social dominance

For them:
- Sommelier Violence Mode
- harsh roast text
- Degen Flex Cards
- Coward Meter
- Almost Legendary
- RNG Rugged
- Corkfather
- Base Easter Eggs

## 8. Map

Small top-down 2D map.

Includes:
- vineyard plots
- shop
- winery
- cellar
- market
- chateau building
- production zone
- Ghost Sommelier

```txt
┌────────────────────────────────────────┐
│              CHATEAU BASE              │
│          [chateau / winery building]    │
│                                        │
│      [Cellar]       [Production]        │
│                                        │
│ [Plot 1] [Plot 2] [Plot 3]              │
│                                        │
│        [Shop]        [Market]           │
└────────────────────────────────────────┘
```

## 9. Controls

Desktop:
- WASD / arrows — movement
- E — interact

Mobile:
- virtual joystick — movement
- Interact button — interaction

Prompt examples:
- Press E to open Shop
- Press E to plant Vine
- Press E to harvest Grapes
- Press E to craft Wine
- Press E to sell Wine

## 10. First game cycle

The player should create their first bottle in 3 minutes.

```txt
0:00 — opens link
0:05 — sees chateau
0:10 — receives 500 GRAPE
0:15 — buys vine
0:45 — plants vine
1:30 — vine is ready
1:50 — harvests grapes
2:00 — walks to winery
2:15 — chooses production
2:45 — receives bottle
3:00 — sees result screen
3:10 — shares / sells / saves
```

First wine cannot be Common.

Tutorial result:
- Common: 0%
- Good: 70%
- Premium: 30%
- Grand Cru: 0%
- Legendary: 0%

## 11. Tutorial

Tutorial is not an academy.

No long explanations.

Tutorial is a quick meme pit crew.

Ghost Sommelier lines:
- Plant the vine, genius.
- Congrats, you discovered agriculture.
- Now make wine before your alpha leaks.
- Walk to the winery. Use your legs. Revolutionary tech.
- Pick a vessel. Steel is safe. Oak is where the ego starts.
- Cork it if you have a spine.
- Bottle it. Let’s see if you’re built different.

## 12. GRAPE currency

GRAPE is internal off-chain game currency.

In MVP:
- not ERC-20
- not token
- not withdrawable
- not tradable
- stored in backend

Used for:
- buying vines
- buying closures
- unlocking equipment
- wine production
- upgrades

Starting balance:

```txt
500 GRAPE
```

## 13. Shop

Items:
- Vine
- Screw Cap
- Cork
- Steel Tank Unlock
- Old Oak Barrel Unlock
- New Oak Barrel Unlock
- New Plot

Starting prices:
- Vine: 80 GRAPE
- Steel Tank Unlock: 120 GRAPE
- Old Oak Barrel Unlock: 220 GRAPE
- New Oak Barrel Unlock: 350 GRAPE
- Screw Cap: 5 GRAPE
- Cork: 25 GRAPE
- New Plot: 300 GRAPE

## 14. Vine

The player buys a normal vine.

They do not buy “young” or “old” vines.

The vine matures through harvest count:

```ts
harvestCount += 1;
```

The vine does not disappear after harvest.

## 15. Vine states

### Low Yield Vine

```txt
harvest_count: 1–2
yield_multiplier: 0.7
grape_quality_bonus: +20
```

Low grape amount, higher quality.

### Balanced Vine

```txt
harvest_count: 3–4
yield_multiplier: 1.0
grape_quality_bonus: +10
```

Balanced quantity and quality.

### Overcropped Vine

```txt
harvest_count: 5+
yield_multiplier: 1.4
grape_quality_bonus: -10
```

More grapes, lower quality.

## 16. Yield

Base:

```ts
baseGrapeYield = 10;
```

Formula:

```ts
grapeYield = baseGrapeYield * yieldMultiplier;
```

Examples:
- Low Yield: 7 grapes
- Balanced: 10 grapes
- Overcropped: 14 grapes

## 17. Wine production

The player chooses 3 things:
- Production Vessel
- Aging Plan
- Closure Type

## 18. Production Vessel

### Steel Tank

- fast
- cheap
- clean style
- quality_bonus: +0
- cap: Premium

Roast:
> Steel Tank again? Your ancestors planted vines for this?

### Old Oak Barrel

- medium price
- stable quality
- quality_bonus: +8
- cap: Grand Cru

### New Oak Barrel

- expensive
- premium
- quality_bonus: +12
- cap: Legendary

## 19. Aging Plan

### No Aging

- fast
- cheap
- quality_bonus: +0
- cap: Good

Roast:
> The grapes had dreams. You had a timer.

### Short Old Oak Aging

- quality_bonus: +10
- cap: Premium / Grand Cru

### New Oak Aging

- quality_bonus: +15
- cap: Grand Cru

### New → Old Oak Aging

- quality_bonus: +25
- cap: Legendary

## 20. Closure Type

### Screw Cap

- cheap
- fast
- quality_bonus: +0
- cap: Premium

Roast:
> You dressed a king in Crocs.

### Cork

- more expensive
- quality_bonus: +3
- prestige_bonus: +5%
- cap: Legendary

Meaning:

> Cork does not magically improve wine, but it opens the path to status bottles.

## 21. Wine quality levels

- Common — simple wine
- Good — good wine
- Premium — premium wine
- Grand Cru Tier — very strong result
- Legendary Vintage — legendary result

Note:
- Grand Cru Tier is an in-game tier, not a legal wine classification.

## 22. Quality formula

```ts
quality_score =
  base_grape_quality
  + vine_quality_bonus
  + production_vessel_bonus
  + aging_bonus
  + closure_bonus
  + random_factor
```

Base:
- base_grape_quality = 40
- random_factor = -10 to +10

Thresholds:
- 0–25 = Common
- 26–45 = Good
- 46–65 = Premium
- 66–85 = Grand Cru
- 86–100+ = Legendary

## 23. Quality Caps

Even if score is high, weak choices can cap the result.

Example:
- raw score: 91
- Screw Cap cap = Premium
- final result: Premium

Caps:
- Steel Tank: max Premium
- Old Oak: max Grand Cru
- New Oak: max Legendary
- No Aging: max Good
- New → Old Oak: max Legendary
- Screw Cap: max Premium
- Cork: max Legendary
- Chateau Level 1: max Premium
- Chateau Level 2: max Grand Cru
- Chateau Level 3: max Legendary

## 24. Bottle Count

Bottle count depends on grape amount.

```ts
bottleCount = Math.max(1, Math.floor(grapeAmount / 2));
```

Examples:
- 7 grapes → 3 bottles
- 10 grapes → 5 bottles
- 14 grapes → 7 bottles

Fewer bottles: higher quality chance.
More bottles: lower quality, more volume.

## 25. Wine DNA

Each batch receives a profile.

```ts
type WineProfile = {
  acidity: number;
  body: number;
  tannin: number;
  aroma: number;
  complexity: number;
  balance: number;
};
```

Example:
- Body: 82
- Tannin: 76
- Complexity: 91
- Balance: 88

Also styleTags:
- low_yield
- new_oak
- corked
- small_batch
- high_complexity
- gas_station_vintage

Wine DNA is used for:
- result screen
- uniqueness
- future NFT metadata
- daily orders
- more precise roast text

## 26. Wine Label Generator

```ts
type WineLabel = {
  name: string;
  subtitle: string;
  frame: "basic" | "silver" | "gold" | "legendary" | "based";
  icon: string;
};
```

Examples:
- Chateau Base — Liquid Alpha
- Genesis Harvest / 3 Bottles
- Gas Station Vintage
- Overcropped / No Aging / Screw Cap
- The Corkfather Reserve
- Grand Cru / Cork / Gold Seal

## 27. Moment Engine

The system detects meaningful events.

Examples:
- first_wine
- first_premium
- first_grand_cru
- first_legendary
- almost_legendary
- rng_rugged
- corkfather
- screw_cap_criminal
- paper_hands
- gas_station_vintage
- based_vintage
- risk_free_peasant

In WineBatch:

```ts
moments: GameMoment[];
primaryMoment: GameMoment | null;
```

If a batch has several moments, one primary moment is selected.

Example:
- moments:
  - almost_legendary
  - screw_cap_criminal
- primaryMoment:
  - almost_legendary

Screen headline:
> YOU BOTTLED THE ALPHA WRONG

## 28. Wine Result Screen

Main screen of the game.

Shows:
- quality level
- score
- bottle count
- Wine DNA
- style tags
- label
- production choices
- verdict
- sale value
- share buttons
- run it back

Example:

```txt
CHATEAU BASE

GRAND CRU
Quality Score: 88/100
Bottles: 6

Label:
The Corkfather Reserve

Profile:
Body 82 / Tannin 76 / Complexity 91 / Balance 88

Tags:
Small Batch / New Oak / Cork Discipline

Quality Verdict:
“You are legally allowed to be annoying now.”

Style Verdict:
“Dense, oaky, dramatic. Basically your ego in liquid form.”

Estimated Value:
620 GRAPE

[Classy Flex]
[Degen Flex]
[Run It Back]
[Store in Cellar]
[Sell Wine]
```

## 29. Sommelier Verdict

Common:
- This is not wine. This is fermented regret.
- You made liquidity pool water. NGMI.

Good:
- Acceptable. Still smells like you followed a tutorial.
- Not terrible. Not alpha either.

Premium:
- Okay, Chad. You cooked.
- This bottle has more structure than your portfolio.

Grand Cru:
- You are legally allowed to be annoying now.
- Post it before someone better appears.

Legendary:
- This is not a bottle. This is social violence.
- Base witnessed. Normies will not understand.

## 30. Sommelier Violence Mode

After first bottle, game asks:

```txt
Enable Sommelier Violence?

[Keep it classy]
[Roast me, sommelier]
```

Classy Mode:
- soft tone
- beautiful cards
- cozy style

Violence Mode:
- toxic roast text
- Degen Flex Cards
- Coward Meter
- fail achievements
- shame moments

## 31. Mistakes are not blocked

No boring confirmation:

```txt
Are you sure?
```

Instead:

```txt
Screw Cap on premium grapes? Bold move, NPC.

[Bottle it anyway, coward]
```

Mistakes become content.

## 32. Almost Legendary

If the player could make Legendary but capped it with a bad choice:

```txt
YOU BOTTLED THE ALPHA WRONG

Raw Score: 91
Final Result: Premium
Cause: Screw Cap Cap

“You found the gem and wrapped it in plastic.”

[Run It Back]
[Share My Fumble]
```

Core viral mechanic.

## 33. RNG Rugged

If the player made good choices but random went badly:

```txt
RNG RUGGED YOU

Setup: Legendary Eligible
Random Factor: -9
Result: Grand Cru

“The chain was clean. The gods were not.”

[Run It Back]
[Share The Pain]
```

## 34. Run It Back

Repeat attempt button.

Appears after:
- Almost Legendary
- RNG Rugged
- Premium 80+
- Grand Cru
- Legendary
- challenge failure

Backend preview:

```ts
type RunItBackPreview = {
  canRun: boolean;

  missingResources: {
    grapes?: number;
    screwCaps?: number;
    corks?: number;
    requiredUnlocks?: string[];
    requiredChateauLevel?: number;
  };

  recipe: {
    productionVessel: string;
    agingPlan: string;
    closureType: string;
    vineState: string;
    grapeAmount: number;
  };
};
```

## 35. Recipe Memory

```ts
type RecipeHistory = {
  id: string;
  userId: string;

  productionVessel: string;
  agingPlan: string;
  closureType: string;
  vineState: string;

  timesUsed: number;
  bestScore: number;
  bestQualityLevel: WineQualityLevel;
  lastUsedAt: string;
};
```

Used for:
- Coward Meter
- favorite recipe
- Run It Back
- challenge
- personalized roasts
- analytics

## 36. ShareObject

Each share is a separate object.

```ts
type ShareObject = {
  id: string;
  userId: string;
  batchId: string | null;

  type:
    | "wine_result"
    | "fumble"
    | "achievement"
    | "challenge"
    | "coward_meter"
    | "corkfather"
    | "legendary";

  mode: "classy" | "degen";

  title: string;
  subtitle: string;
  body: string;

  imageUrl: string | null;
  deeplinkUrl: string;

  payload: Record<string, unknown>;

  createdAt: string;
};
```

URLs:
- `/s/:shareId`
- `/challenge/:shareId`
- `/wine/:batchId`

Used for:
- permanent links
- OpenGraph cards
- analytics
- challenge attribution
- fail sharing
- achievement sharing

## 37. Share Cards

Each result has 2 modes.

Classy Flex:

```txt
CHATEAU BASE
Genesis Harvest

Kirill produced
GRAND CRU

Quality: 88/100
Bottles: 6
Aging: New → Old Oak
Closure: Cork

Craft your first vintage
```

Degen Flex:

```txt
KIRILL BOTTLED GRAND CRU

88/100
6 bottles
New → Old Oak
Cork

“Your vineyard is exit liquidity.”

Beat this vintage.
```

## 38. Challenge Friend

Not just “invite friend”.

Core challenge:

```txt
Beat my vintage or stay Common.
```

Examples:
- Your château could never.
- I bottled alpha. You bottled excuses.
- Try not to make fermented tap water.
- Grand Cru posted. Cope responsibly.
- 3 bottles exist. 0 belong to you.

## 39. Challenge Attribution

```ts
type ReferralChallenge = {
  id: string;

  inviterUserId: string;
  invitedUserId: string | null;

  sourceShareId: string;
  sourceBatchId: string | null;

  status:
    | "opened"
    | "started"
    | "completed_first_wine"
    | "beat_score"
    | "failed";

  inviterScore: number | null;
  invitedScore: number | null;

  createdAt: string;
  completedAt: string | null;
};
```

If friend loses:

```txt
You scored 72.
Kirill scored 88.

Result:
Still Common energy.
```

If friend wins:

```txt
You beat Kirill’s vintage.

Send emotional damage?
[Share Revenge]
```

## 40. The Corkfather Moment

If player first makes Grand Cru+ with Cork:

```txt
THE CORKFATHER

“You stopped acting poor. The cellar approves.”
```

Reward:
- Title: The Corkfather
- Label Frame: Gold Cork Seal

Share card:

```txt
KIRILL BECAME
THE CORKFATHER

First Grand Cru with Cork.
The Steel Tank era is over.
```

## 41. Coward Meter

Post-MVP, but architecture is prepared.

Grows if player:
- often chooses No Aging
- often uses Steel Tank
- avoids Cork
- avoids New Oak
- sells Premium+
- does not share rare results
- plays too safely

At 100%:

```txt
RISK-FREE PEASANT

12 safe batches.
0 aura.
100% spreadsheet behavior.
```

## 42. Cellar

In MVP cellar is a list of wine batches.

Functions:
- view batches
- reopen result screen
- sell
- save
- see rare wines

Post-MVP:
- public cellar
- NFT display
- seasonal collection
- cellar slots

## 43. Cellar Slots

Softly addable.

```ts
type Cellar = {
  userId: string;
  usedSlots: number;
  maxSlots: number;
};
```

Start:

```txt
maxSlots = 10
```

Meaning:
> Not everything can be stored. Choose what to sell and what to flex.

## 44. Wine sale

Simple sale:

```txt
walk to market
→ choose batch
→ sell
→ receive GRAPE
```

Ranges:
- Common: 30–70 GRAPE
- Good: 80–140 GRAPE
- Premium: 160–300 GRAPE
- Grand Cru: 350–700 GRAPE
- Legendary: 900–1500 GRAPE

Formula:

```ts
salePrice =
  baseTierValue[qualityLevel]
  + qualityScore * scoreMultiplier
  + bottleCount * bottleMultiplier
  + rarityBonus
  + prestigeBonus;
```

## 45. Chateau Level

Level 1:
- 3 plots
- basic shop
- max quality = Premium

Level 2:
- more plots
- better cellar
- Grand Cru unlocked
- max quality = Grand Cru

Level 3:
- Legendary unlocked
- seasonal batches
- rare labels
- future NFT eligibility
- max quality = Legendary

## 46. Daily Retention

MVP / early post-MVP:
- Daily Harvest
- Daily Wine Order
- Daily Login Bonus
- Daily Craft Quest

Better version:

```txt
Daily Sommelier Order:

A restaurant is looking for:
Good+ wine
Old Oak Aging
Cork closure

Reward:
+120 GRAPE
+5 Reputation
```

## 47. Base-native features in MVP

Required:
- Base network config
- Base Sepolia for tests
- wallet connect after first result
- telegramUserId + walletAddress linking
- Base profile placeholder
- preserve meaningful vintages on Base
- preserve selected challenge moments on Base
- Based Vintage status
- season context
- NFT-ready metadata

Stack:
- wagmi
- viem
- Reown AppKit / WalletConnect
- Coinbase Wallet support
- OnchainKit optional

## 48. Based Fermentation

Secret Base mechanic.

Condition:
- Low Yield Vine
- New Oak
- New → Old Oak
- Cork
- save in cellar
- connect Base wallet

Event:

```txt
The cellar recognizes your wallet.
```

Reward:

```txt
BASED VINTAGE

“Not minted. Not farmed. Actually earned.”
```

Status:
- Based Winemaker

In MVP this is off-chain cosmetic/status.

## 49. Base Profile

Even without NFT, create public profile:

```txt
/chateau/:wallet
```

Example:

```txt
Chateau of Kirill
Based Winemaker

Genesis Harvest:
3 Premium
1 Grand Cru
0 Legendary
1 Almost Legendary Fumble

Best Wine:
Grand Cru 88/100

Worst Shame:
Screw Cap Criminal
```

## 50. Future NFT Layer

Later:
- Founder Winemaker NFT
- ERC-1155 NFT bottles
- seasonal badges
- NFT labels
- NFT cellar skins
- marketplace

NFT bottles:
- 1 WineBatch = 1 tokenId
- bottleCount = supply

Example:
- Token ID: 10042
- Name: Chateau Base — Legendary Vintage
- Supply: 7 bottles
- Season: Genesis Harvest
- Quality Score: 92
- Producer: wallet address

## 51. Season Context

Prepare seasons immediately.

```ts
type Season = {
  id: string;
  key: string;
  name: string;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
};
```

First season:

```txt
Genesis Harvest
```

In WineBatch:

```ts
seasonId: string;
seasonKey: string;
```

## 52. Future seasons

- Season 0: Genesis Harvest
- Season 1: Tuscany
- Season 2: Bordeaux
- Season 3: Napa
- Season 4: Georgia / Qvevri
- Season 5: Champagne

Each season can add:
- new grape varieties
- new wine style
- new labels
- new roast packs
- leaderboard
- limited collectibles

## 53. GameConfig

Economy is not hardcoded.

```ts
type GameConfig = {
  version: string;

  startingGrapeBalance: number;

  shopPrices: Record<string, number>;

  growthTimers: {
    tutorialVineSeconds: number;
    earlyVineSeconds: number;
  };

  productionTimers: {
    tutorialWineSeconds: number;
    earlyWineSeconds: number;
  };

  baseGrapeYield: number;

  quality: {
    baseGrapeQuality: number;
    randomMin: number;
    randomMax: number;
    thresholds: Record<WineQualityLevel, [number, number]>;
  };

  sale: {
    baseTierValue: Record<WineQualityLevel, number>;
    scoreMultiplier: number;
    bottleMultiplier: number;
  };

  caps: {
    chateauLevel: Record<number, WineQualityLevel>;
    vessel: Record<string, WineQualityLevel>;
    aging: Record<string, WineQualityLevel>;
    closure: Record<string, WineQualityLevel>;
  };
};
```

In WineBatch:

```ts
gameConfigVersion: string;
```

## 54. Backend-authoritative logic

Backend calculates:
- purchases
- timers
- harvest
- inventory
- production preview
- quality score
- caps
- Wine DNA
- style tags
- wine label
- moments
- verdicts
- sale price
- achievements
- share objects
- challenge attribution
- wallet linking
- preserve eligibility and preserve payload

Client handles:
- movement
- map
- UI
- animations
- state display

Phaser does not own economy.

## 55. Idempotency / Anti-cheat

Every mutation intent has:

```ts
idempotencyKey: string;
```

Example:

```json
{
  "plotId": "plot_1",
  "idempotencyKey": "uuid"
}
```

Log:

```ts
type GameActionLog = {
  id: string;
  userId: string;
  actionType: string;
  idempotencyKey: string;
  requestPayload: unknown;
  responsePayload: unknown;
  createdAt: string;
};
```

Important for:
- buy
- plant
- harvest
- craft
- sell
- wallet linking
- share object creation

## 56. Analytics

Events:
- session_started
- tutorial_started
- shop_opened
- vine_bought
- vine_planted
- vine_harvested
- winery_opened
- production_preview_seen
- production_started
- wine_revealed
- moment_triggered
- result_shared
- run_it_back_clicked
- wine_sold
- wallet_prompt_seen
- wallet_connected
- challenge_opened
- challenge_started
- challenge_completed
- violence_mode_enabled

Used to understand:
- first bottle completion rate
- drop-off points
- share rate
- Run It Back rate
- wallet connection rate
- share-card conversion

## 57. MVP must-have

Core:
- walk
- buy vine
- plant
- harvest
- craft
- reveal
- sell/share

Wine:
- quality score
- caps
- Wine DNA
- styleTags
- WineLabel
- bottleCount
- salePrice

Viral:
- Sommelier Verdict
- Style Verdict
- Moment Engine
- Almost Legendary
- Run It Back
- ShareObject
- Classy/Degen cards
- Challenge Attribution
- Corkfather

Base:
- Telegram userId start
- wallet connect after first result
- Base network config
- walletAddress linking
- Base profile placeholder
- preserve meaningful vintages/challenge moments on Base
- Based Vintage status
- NFT-ready metadata

System:
- GameConfig
- idempotency
- GameActionLog
- GameEvent analytics
- Tutorial State Machine
- backend-authoritative logic

## 58. MVP optional

- Coward Meter basic
- RNG Rugged
- Fail animations
- Based Fermentation
- Wallet Terroir
- Basic achievements
- Cellar Slots
- Copy Flex Link

## 59. Not in MVP

- ERC-20 GRAPE
- NFT mint
- marketplace
- staking
- betting
- withdrawals
- onchain buy/plant/harvest/craft/sell gameplay mutations
- PvP
- multiplayer
- complex seasons
- diseases
- weather
- many grape varieties
- public humiliation leaderboards
- Bottle instances
- full Farcaster integration
- LiveOps admin panel

## 60. Stack

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

Deploy:
- Frontend: Vercel / Cloudflare Pages
- Backend: Railway / Render / Fly.io / VPS
- Database: Neon / Supabase PostgreSQL

## 61. Final pitch

Chateau Base is a mobile-first cozy degen winery simulator for Telegram and Web, Base-compatible from MVP. The player runs a small chateau, plants vines, harvests grapes, chooses production, makes wine, receives unique Wine DNA, gets judged by a toxic sommelier, and turns the result into a share card, challenge, or future onchain collectible.

Base is added from MVP as profile, wallet identity, future NFT, and public cellar layer, but without token, marketplace, or mandatory transactions.

## 62. Simplest explanation

We are making a game where a person can say in 3 minutes:

> “I made my first bottle of wine.”

And the game replies:

> “Not bad. But don’t get arrogant.”

Then the player can send a card to a friend:

> “I made Grand Cru 88/100. Try to beat it.”

The friend opens the link, makes their own bottle, gets judged, and shares back.

Main loop:

```txt
make wine
→ get rated
→ get praised or roasted
→ share
→ friend comes to check if they can do better
```

Main architecture formula:

```txt
Player Intent
→ Backend Game Logic
→ WineBatch
→ Wine DNA
→ Moment Engine
→ Result Screen
→ ShareObject
→ Challenge / Base Profile / Future NFT
```

Main product formula:

> The player does not only craft wine. The player crafts a social artifact.
