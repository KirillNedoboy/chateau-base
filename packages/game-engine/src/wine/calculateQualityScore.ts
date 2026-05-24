import type {
  AgingPlanKey,
  ClosureTypeKey,
  ProductionVesselKey,
  WineQualityLevel
} from "@chateau/shared";
import type { CoreWineEngineConfig } from "../config/defaultGameConfig.js";
import type { VineState } from "../vine/index.js";

export type CalculateRawQualityScoreInput = {
  vineState: VineState;
  productionVessel: ProductionVesselKey;
  agingPlan: AgingPlanKey;
  closureType: ClosureTypeKey;
  randomFactor: number;
  config: CoreWineEngineConfig;
};

export function calculateRawQualityScore(
  input: CalculateRawQualityScoreInput
): number {
  return (
    input.config.quality.baseGrapeQuality +
    input.config.vineStates[input.vineState.key].grapeQualityBonus +
    input.config.qualityBonuses.vessel[input.productionVessel] +
    input.config.qualityBonuses.aging[input.agingPlan] +
    input.config.qualityBonuses.closure[input.closureType] +
    input.randomFactor
  );
}

export function getQualityLevelFromScore(
  score: number,
  config: CoreWineEngineConfig
): WineQualityLevel {
  const thresholdEntries = Object.entries(config.quality.thresholds) as Array<
    [WineQualityLevel, readonly [number, number]]
  >;

  for (const [qualityLevel, [min, max]] of thresholdEntries) {
    if (qualityLevel === "legendary" && score >= min) {
      return qualityLevel;
    }

    if (score >= min && score <= max) {
      return qualityLevel;
    }
  }

  return "common";
}
