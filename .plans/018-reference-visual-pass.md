# Reference Visual Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the playable web MVP toward the provided Chateau Base reference: denser mobile game HUD, richer top-down winery map, stronger bottom controls/navigation, and a current-batch card without changing gameplay authority or MVP economy scope.

**Architecture:** Keep Phaser responsible for the interactive map canvas and movement only. Keep React/CSS responsible for HUD, navigation, result/current-batch surfaces, and modal overlays. No backend, DB, contract, wallet, preserve, ERC-20, NFT mint, marketplace, staking, betting, withdrawals, or onchain gameplay mutation changes.

**Tech Stack:** Next.js, React, Phaser 3, TailwindCSS/global CSS, Vitest, existing `@chateau/shared` and API client types.

---

## File Structure

- Modify `apps/web/src/game/mapConfig.ts`: enlarge the map coordinate space and add presentation metadata needed for a richer reference-style scene.
- Modify `apps/web/src/game/mapConfig.test.ts`: add focused invariants for the reference layout, safe prompt position, and required zones.
- Modify `apps/web/src/components/game/PhaserMap.tsx`: redraw the map with darker vignette, stone paths, chateau, buildings, vineyards, banners, ghost treatment, and icon-like mobile controls.
- Modify `apps/web/src/components/WebShell.tsx`: replace the current hero-first web layout with an app-frame layout closer to the reference: compact top HUD, quest card, right quick actions, map, bottom navigation, and current-batch placeholder when a wine result exists.
- Modify `apps/web/src/features/wine-result/WineResultScreen.tsx`: preserve the full modal result screen, but make the result actions/card visually consistent with the new dark game HUD.
- Modify `apps/web/src/app/globals.css`: add the app-frame visual system, dark translucent HUD surfaces, safe mobile layout, bottom navigation, joystick/interact button styling, and responsive constraints.
- Modify `SESSION_NOTES.md`: record implementation and validation results.

## Constraints

- Use existing data. Do not introduce fake server state as authoritative gameplay.
- The visual current-batch surface may only show a real crafted `wineResult`; before that it should remain absent or generic loading/status UI.
- Maintain accessible labels and keyboard interaction for existing controls.
- Do not add dependencies unless the repo already has them and they are necessary.
- Validate with focused web tests, typecheck, build, and browser visual QA where possible.

---

### Task 1: Map Layout Contract

**Files:**
- Modify: `apps/web/src/game/mapConfig.ts`
- Modify: `apps/web/src/game/mapConfig.test.ts`

- [ ] **Step 1: Write failing layout tests**

Add assertions that prove the reference-style map has a taller mobile-friendly coordinate space, puts the chateau above vineyards, keeps shop/market below vineyards, keeps prompt above controls, and keeps all required zone IDs.

Run:

```powershell
pnpm --filter @chateau/web test -- mapConfig.test.ts
```

Expected before implementation: FAIL because the map is still `720x480` and zone ordering/positions are not reference-style.

- [ ] **Step 2: Implement minimal map config**

Set `MAP_HEIGHT` to a taller value, update zone coordinates to the reference composition, and keep IDs unchanged:

```ts
export const MAP_WIDTH = 720;
export const MAP_HEIGHT = 1040;
export const MAP_PROMPT_Y = 420;

export const PLAYER_START = {
  x: 360,
  y: 372
} as const;
```

Move zones into this vertical order: chateau/winery top, cellar/production upper-middle, plots middle, shop/market lower-middle, ghost near player.

- [ ] **Step 3: Run focused tests**

Run:

```powershell
pnpm --filter @chateau/web test -- mapConfig.test.ts
```

Expected: PASS.

---

### Task 2: Phaser Reference Scene

**Files:**
- Modify: `apps/web/src/components/game/PhaserMap.tsx`
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Add focused renderer-safe tests only if pure helpers are extracted**

If drawing helpers remain Phaser-scene private, do not add brittle canvas tests. Keep coverage in `mapConfig.test.ts` and validate rendering through browser QA.

- [ ] **Step 2: Redraw map scene**

Update `drawGround()` and `drawZoneDecoration()` to produce the reference composition:

- dark forest/vignette edges
- warm stone paths connecting buildings and plots
- large chateau facade at top
- labeled cellar, production/winery, three vineyards, shop, market
- blue Base banner detail
- glowing Ghost Sommelier
- stronger active-zone highlight

- [ ] **Step 3: Upgrade mobile controls**

Style the joystick and interact button as dark circular controls with stable dimensions and visible labels/icons through CSS only.

- [ ] **Step 4: Run focused tests**

Run:

```powershell
pnpm --filter @chateau/web test -- mapConfig.test.ts
```

Expected: PASS.

---

### Task 3: App Frame HUD

**Files:**
- Modify: `apps/web/src/components/WebShell.tsx`
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Add or update component tests only for stable markup hooks**

If existing tests cover text/state only, avoid screenshot-like unit tests. Add stable class or aria hooks only where needed for regression checks.

- [ ] **Step 2: Replace hero-first layout with game frame**

Render these regions around the map:

- top app HUD with menu button, GRAPE balance, Chateau XP/level progress placeholder, Base system card
- left quest card using tutorial state
- right quick actions for Quests, Friends, Leaderboard as disabled/static MVP UI
- map panel as the central playable surface
- bottom nav with Base, Inventory, Craft, Collection, Profile

Use real `gameState` values for balance, level, season/tutorial where available. Static quick actions must not claim implemented backend features.

- [ ] **Step 3: Add current-batch dock**

When `wineResult` exists, show a compact current-batch dock over/below the map with label name, quality, score, bottles, status, share, sell, and run-it-back controls. Keep the full `WineResultScreen` modal available for the detailed reveal.

- [ ] **Step 4: Run web tests**

Run:

```powershell
pnpm --filter @chateau/web test
```

Expected: PASS.

---

### Task 4: Result Surface Alignment

**Files:**
- Modify: `apps/web/src/features/wine-result/WineResultScreen.tsx`
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Preserve behavior**

Do not change callbacks, preserve panel conditions, share modes, sell state handling, or result payload reads.

- [ ] **Step 2: Darken and compact visual treatment**

Use the new app-frame tokens so the result screen feels like the reference current-batch card while retaining full details: wine label, DNA, production, verdicts, preserve state, and actions.

- [ ] **Step 3: Run existing result tests**

Run:

```powershell
pnpm --filter @chateau/web test -- WineResultScreen.test.ts
```

Expected: PASS.

---

### Task 5: Verification and Notes

**Files:**
- Modify: `SESSION_NOTES.md`

- [ ] **Step 1: Run required validation**

Run:

```powershell
pnpm --filter @chateau/web test
pnpm --filter @chateau/web typecheck
pnpm typecheck
pnpm test
pnpm build
git diff --check
Select-String -Path apps/web/next-env.d.ts -Pattern '\.next'
```

Expected: all commands exit successfully; the final `Select-String` returns no matches.

- [ ] **Step 2: Browser visual QA**

Start web dev server:

```powershell
pnpm --filter @chateau/web dev
```

Inspect at least `390x844` and `1280x800`. Verify no horizontal overflow, controls do not cover prompt or bottom nav incoherently, map renders nonblank, and HUD text remains inside containers.

- [ ] **Step 3: Update notes**

Append implementation summary, validation results, remaining risks, and next safe step to `SESSION_NOTES.md`.
