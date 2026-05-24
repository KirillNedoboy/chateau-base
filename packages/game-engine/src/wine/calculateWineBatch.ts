import type {
  AgingPlanKey,
  ChateauLevel,
  ClosureTypeKey,
  ProductionVesselKey,
  SeasonKey,
  WineBatch
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
  id: string;
  userId: string;
  seasonId: string;
  seasonKey: SeasonKey;
  chateauLevel: ChateauLevel;
  harvestCount: number;
  productionVessel: ProductionVesselKey;
  agingPlan: AgingPlanKey;
  closureType: ClosureTypeKey;
  randomFactor: number;
  createdAt: string;
};

export type CalculatedWineBatch = Omit<WineBatch, "capApplied"> & {
  rawQualityLevel: WineBatch["qualityLevel"];
  finalQualityLevel: WineBatch["qualityLevel"];
  capApplied: boolean;
  capCause: string | null;
};

export function calculateWineBatch(
  input: CalculateWineBatchInput,
  config: CoreWineEngineConfig
): CalculatedWineBatch {
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
    id: input.id,
    userId: input.userId,
    seasonId: input.seasonId,
    seasonKey: input.seasonKey,
    gameConfigVersion: config.version,
    qualityLevel: capResult.finalQualityLevel,
    rawQualityLevel,
    finalQualityLevel: capResult.finalQualityLevel,
    qualityScore: rawQualityScore,
    rawQualityScore,
    capApplied: capResult.capApplied,
    capCause: capResult.capCause,
    bottleCount,
    grapeAmount,
    profile: {
      acidity: 0,
      body: 0,
      tannin: 0,
      aroma: 0,
      complexity: 0,
      balance: 0
    },
    styleTags: [],
    label: {
      name: "Pending Label",
      subtitle: "Pending Subtitle",
      frame: "basic",
      icon: "pending"
    },
    recipe: {
      productionVessel: input.productionVessel,
      agingPlan: input.agingPlan,
      closureType: input.closureType,
      vineState: vineState.key,
      grapeAmount
    },
    verdict: {
      quality: "",
      style: ""
    },
    salePrice: 0,
    moments: [],
    primaryMoment: null,
    status: "revealed",
    nftReadyMetadata: {
      name: "",
      description: "",
      imageUrl: null,
      attributes: {}
    },
    createdAt: input.createdAt,
    soldAt: null,
    storedAt: null
  };
}
