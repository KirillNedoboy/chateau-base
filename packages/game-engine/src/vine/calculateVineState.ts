import type { VineStateKey } from "@chateau/shared";

export type VineState = {
  key: VineStateKey;
  harvestCount: number;
};

export function calculateVineState(harvestCount: number): VineState {
  if (harvestCount <= 2) {
    return { key: "low_yield", harvestCount };
  }

  if (harvestCount <= 4) {
    return { key: "balanced", harvestCount };
  }

  return { key: "overcropped", harvestCount };
}
