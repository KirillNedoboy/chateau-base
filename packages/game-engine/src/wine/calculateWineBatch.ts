import type {
  AgingPlanKey,
  ChateauLevel,
  ClosureTypeKey,
  ProductionVesselKey,
  VineStateKey,
  WineQualityLevel
} from "@chateau/shared";
import type { CoreWineEngineConfig } from "../config/defaultGameConfig.js";
import { calculateGrapeYield, calculateVineState } from "../vine/index.js";
import { applyQualityCaps } from "./applyQualityCaps.js";
import { calculateBottleCount } from "./calculateBottleCount.js";
import {
  calculateRawQualityScore,
  getQualityLevelFromScore
} from "./calculateQualityScore.js";

export type CalculateWineBatchInput = {
  chateauLevel: ChateauLevel;
  harvestCount: number;
  productionVessel: ProductionVesselKey;
  agingPlan: AgingPlanKey;
  closureType: ClosureTypeKey;
  randomFactor: number;
};

export type CoreWineBatchCalculationResult = {
  rawQualityScore: number;
  rawQualityLevel: WineQualityLevel;
  finalQualityLevel: WineQualityLevel;
  capApplied: boolean;
  capCause: string | null;
  bottleCount: number;
  grapeAmount: number;
  vineState: VineStateKey;
  productionVessel: ProductionVesselKey;
  agingPlan: AgingPlanKey;
  closureType: ClosureTypeKey;
  gameConfigVersion: string;
};

export function calculateWineBatch(
  input: CalculateWineBatchInput,
  config: CoreWineEngineConfig
): CoreWineBatchCalculationResult {
  const vineState = calculateVineState(input.harvestCount);
  const grapeAmount = calculateGrapeYield(vineState, config);
  const bottleCount = calculateBottleCount(grapeAmount);
  const rawQualityScore = calculateRawQualityScore({
    vineState,
    productionVessel: input.productionVessel,
    agingPlan: input.agingPlan,
    closureType: input.closureType,
    randomFactor: input.randomFactor,
    config
  });
  const rawQualityLevel = getQualityLevelFromScore(rawQualityScore, config);
  const capResult = applyQualityCaps(
    rawQualityLevel,
    {
      productionVessel: input.productionVessel,
      agingPlan: input.agingPlan,
      closureType: input.closureType
    },
    input.chateauLevel,
    config
  );

  return {
    rawQualityScore,
    rawQualityLevel,
    finalQualityLevel: capResult.finalQualityLevel,
    capApplied: capResult.capApplied,
    capCause: capResult.capCause,
    bottleCount,
    grapeAmount,
    vineState: vineState.key,
    productionVessel: input.productionVessel,
    agingPlan: input.agingPlan,
    closureType: input.closureType,
    gameConfigVersion: config.version
  };
}
