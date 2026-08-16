import type { WineQualityLevel } from "@chateau/shared";
import type { WineCraftResponse } from "../../lib/api";
import { formatKey } from "../game-ui/viewModels";

export type WineResultSection = {
  title: string;
  values: string[];
};

export type WineSellUiState = {
  busy: boolean;
  error: string | null;
  message: string | null;
  sold: boolean;
};

export type WineSellActionView = {
  buttonDisabled: boolean;
  buttonLabel: string;
  error: string | null;
  message: string | null;
  resultActionsDisabled: boolean;
};

export type QualityPresentation = {
  toneClassName: string;
  eyebrow: string;
  summary: string;
};

export type WineProfileRow = {
  label: string;
  value: number;
};

export type CurrentBatchDockView = {
  title: string;
  tierLabel: string;
  scoreLabel: string;
  bottleLabel: string;
  statusLabel: "Ready" | "Selling" | "Sold";
  sellDisabled: boolean;
};

export type SellWineIntent = {
  batchId: string;
  idempotencyKey: string;
};

export type SellWineIntentTracker = {
  byBatchId: Record<string, SellWineIntent | undefined>;
};

export type WineSellUiStateByBatch = Record<string, WineSellUiState | undefined>;

export const IDLE_WINE_SELL_UI_STATE: WineSellUiState = {
  busy: false,
  error: null,
  message: null,
  sold: false
};

const QUALITY_PRESENTATION: Record<WineQualityLevel, QualityPresentation> = {
  common: {
    toneClassName: "quality-common",
    eyebrow: "Cellar Judgment",
    summary: "Fermented. Barely."
  },
  good: {
    toneClassName: "quality-good",
    eyebrow: "Cellar Judgment",
    summary: "A real first bottle."
  },
  premium: {
    toneClassName: "quality-premium",
    eyebrow: "Cellar Judgment",
    summary: "The chateau has a pulse."
  },
  grand_cru: {
    toneClassName: "quality-grand-cru",
    eyebrow: "Cellar Judgment",
    summary: "This bottle can talk."
  },
  legendary: {
    toneClassName: "quality-legendary",
    eyebrow: "Cellar Judgment",
    summary: "Base may need to witness this."
  }
};

const PROFILE_ORDER = [
  "acidity",
  "body",
  "tannin",
  "aroma",
  "complexity",
  "balance"
] as const;

function formatProfileEntry(key: string, value: number): string {
  return `${formatKey(key)} ${value}`;
}

export function getQualityPresentation(
  qualityLevel: WineQualityLevel
): QualityPresentation {
  return QUALITY_PRESENTATION[qualityLevel];
}

export function getWineProfileRows(
  profile: WineCraftResponse["profile"]
): WineProfileRow[] {
  return PROFILE_ORDER.map((key) => ({
    label: formatKey(key),
    value: profile[key]
  }));
}

export function getCurrentBatchDockView(
  result: WineCraftResponse,
  sellState: WineSellUiState
): CurrentBatchDockView {
  return {
    title: result.label.name,
    tierLabel: formatKey(result.qualityLevel),
    scoreLabel: `${result.qualityScore}/100`,
    bottleLabel: String(result.bottleCount),
    statusLabel: sellState.sold ? "Sold" : sellState.busy ? "Selling" : "Ready",
    sellDisabled: sellState.busy || sellState.sold
  };
}

export function formatMoment(moment: string): string {
  return formatKey(moment);
}

export function getWineResultSections(result: WineCraftResponse): WineResultSection[] {
  return [
    {
      title: "Wine DNA",
      values: Object.entries(result.profile).map(([key, value]) =>
        formatProfileEntry(key, value)
      )
    },
    {
      title: "Style Tags",
      values: result.styleTags.length > 0 ? result.styleTags.map(formatKey) : ["None"]
    },
    {
      title: "Production",
      values: [
        formatKey(result.productionVessel),
        formatKey(result.agingPlan),
        formatKey(result.closureType),
        `${result.grapeAmount} grapes`
      ]
    },
    {
      title: "Moments",
      values:
        result.moments.length > 0 ? result.moments.map(formatMoment) : ["No moment"]
    }
  ];
}

export function shouldShowPreserveAction(
  result: Pick<WineCraftResponse, "onchainEligible">
): boolean {
  return result.onchainEligible;
}

export function getWineSellActionView(state: WineSellUiState): WineSellActionView {
  return {
    buttonDisabled: state.busy || state.sold,
    buttonLabel: state.sold ? "Sold" : state.busy ? "Selling..." : "Sell Wine",
    error: state.error,
    message: state.message,
    resultActionsDisabled: state.busy
  };
}

export function getWineSellUiStateForBatch(
  stateByBatch: WineSellUiStateByBatch,
  batchId: string
): WineSellUiState {
  return stateByBatch[batchId] ?? IDLE_WINE_SELL_UI_STATE;
}

export function getVisibleWineSellUiState(
  stateByBatch: WineSellUiStateByBatch,
  visibleBatchId: string | null
): WineSellUiState {
  if (!visibleBatchId) {
    return IDLE_WINE_SELL_UI_STATE;
  }

  return getWineSellUiStateForBatch(stateByBatch, visibleBatchId);
}

export function setWineSellUiStateForBatch(
  stateByBatch: WineSellUiStateByBatch,
  batchId: string,
  state: WineSellUiState
): WineSellUiStateByBatch {
  return {
    ...stateByBatch,
    [batchId]: state
  };
}

export function setWineSellUiStateForIntent(
  stateByBatch: WineSellUiStateByBatch,
  intent: SellWineIntent,
  state: WineSellUiState
): WineSellUiStateByBatch {
  return setWineSellUiStateForBatch(stateByBatch, intent.batchId, state);
}

export function claimSellWineIntent(
  tracker: SellWineIntentTracker,
  batchId: string,
  createIdempotencyKey: () => string
): SellWineIntent | null {
  if (tracker.byBatchId[batchId] !== undefined) {
    return null;
  }

  const intent = {
    batchId,
    idempotencyKey: createIdempotencyKey()
  };
  tracker.byBatchId[batchId] = intent;
  return intent;
}

export function releaseSellWineIntent(
  tracker: SellWineIntentTracker,
  intent: SellWineIntent
): void {
  if (
    tracker.byBatchId[intent.batchId]?.batchId === intent.batchId &&
    tracker.byBatchId[intent.batchId]?.idempotencyKey === intent.idempotencyKey
  ) {
    delete tracker.byBatchId[intent.batchId];
  }
}
