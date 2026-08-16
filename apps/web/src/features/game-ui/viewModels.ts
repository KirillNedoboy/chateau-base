import type { ShopItemKey, TutorialStep } from "@chateau/shared";

type InventoryLike = {
  itemKey: string;
  quantity: number;
};

export type ShopItemViewModel = {
  key: ShopItemKey;
  label: string;
  description: string;
  badge: string;
  tone: "field" | "closure" | "unlock" | "expansion";
  actionLabel: string;
};

export type CoachOverlayView = {
  promptLabel: string;
  targetZone: "shop" | "plot_1" | "production";
  sommelierName: "Ghost Sommelier";
  sommelierLine: string;
};

export const SHOP_ITEMS: readonly ShopItemViewModel[] = [
  {
    key: "vine",
    label: "Vine",
    description: "Plantable vine inventory for vineyard plots.",
    badge: "Field",
    tone: "field",
    actionLabel: "Buy"
  },
  {
    key: "screw_cap",
    label: "Screw Cap",
    description: "Cheap closure for safe early batches.",
    badge: "Fast",
    tone: "closure",
    actionLabel: "Buy"
  },
  {
    key: "cork",
    label: "Cork",
    description: "Prestige closure for status bottles.",
    badge: "Prestige",
    tone: "closure",
    actionLabel: "Buy"
  },
  {
    key: "steel_tank_unlock",
    label: "Steel Tank Unlock",
    description: "Basic clean production vessel unlock.",
    badge: "Gear",
    tone: "unlock",
    actionLabel: "Buy"
  },
  {
    key: "old_oak_barrel_unlock",
    label: "Old Oak Barrel Unlock",
    description: "Unlocks old oak production paths.",
    badge: "Oak",
    tone: "unlock",
    actionLabel: "Buy"
  },
  {
    key: "new_oak_barrel_unlock",
    label: "New Oak Barrel Unlock",
    description: "Unlocks higher-risk oak production paths.",
    badge: "Risk",
    tone: "unlock",
    actionLabel: "Buy"
  },
  {
    key: "new_plot",
    label: "New Plot",
    description: "Adds one backend-owned vineyard plot.",
    badge: "Expand",
    tone: "expansion",
    actionLabel: "Buy"
  }
] as const;

const TUTORIAL_LINES: Record<TutorialStep, string> = {
  session_started: "Buy a vine. Then pretend it was strategy.",
  shop_opened: "Pick the vine. The grapes are not buying themselves.",
  vine_bought: "Plant the vine, genius.",
  vine_planted: "Wait for harvest. Agriculture has a timer.",
  vine_harvested: "Walk to the winery. Use your legs.",
  winery_opened: "Pick a vessel. Steel is safe. Oak is ego.",
  production_started: "Bottle it. Let us see if you cooked.",
  wine_revealed: "You made wine. The judgment is now permanent.",
  wallet_prompt_seen: "Wallet can wait. The bottle came first."
};

export function formatKey(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => (part[0] ? `${part[0].toUpperCase()}${part.slice(1)}` : part))
    .join(" ");
}

export function getInventoryQuantity(
  items: readonly InventoryLike[],
  itemKey: string
): number {
  return items.find((item) => item.itemKey === itemKey)?.quantity ?? 0;
}

export function getPlotIndex(plotId: string): number {
  const match = /^plot_(\d+)$/.exec(plotId);
  return match ? Number(match[1]) : 0;
}

export function getPlotStatusCopy(plotId: string, unlockedPlotCount: number): string {
  const plotIndex = getPlotIndex(plotId);
  if (plotIndex < 1 || plotIndex > unlockedPlotCount) {
    return "Locked plot";
  }
  return "Backend will validate plot state.";
}

export function getTutorialLine(step: TutorialStep | null): string {
  if (!step) {
    return "Follow the vineyard. It usually knows before you do.";
  }
  return TUTORIAL_LINES[step];
}

export function getCoachOverlayView(step: TutorialStep | null): CoachOverlayView | null {
  if (!step || step === "wine_revealed" || step === "wallet_prompt_seen") {
    return null;
  }

  const targetByStep: Partial<Record<TutorialStep, CoachOverlayView["targetZone"]>> = {
    session_started: "shop",
    shop_opened: "shop",
    vine_bought: "plot_1",
    vine_planted: "plot_1",
    vine_harvested: "production",
    winery_opened: "production",
    production_started: "production"
  };
  const targetZone = targetByStep[step];
  if (!targetZone) {
    return null;
  }

  return {
    promptLabel:
      targetZone === "shop"
        ? "Tap to buy vine"
        : targetZone === "plot_1"
          ? "Tap the vineyard"
          : "Tap to craft wine",
    targetZone,
    sommelierName: "Ghost Sommelier",
    sommelierLine: getTutorialLine(step)
  };
}
