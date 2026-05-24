import type { CoreWineEngineConfig } from "../config/defaultGameConfig.js";
import type { VineState } from "./calculateVineState.js";

export function calculateGrapeYield(
  vineState: VineState,
  config: CoreWineEngineConfig
): number {
  return Math.floor(
    config.baseGrapeYield * config.vineStates[vineState.key].yieldMultiplier
  );
}
