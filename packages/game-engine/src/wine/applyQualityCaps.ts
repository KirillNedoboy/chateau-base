import type {
  AgingPlanKey,
  ChateauLevel,
  ClosureTypeKey,
  ProductionVesselKey,
  WineQualityLevel
} from "@chateau/shared";
import type { CoreWineEngineConfig } from "../config/defaultGameConfig.js";

export type QualityCapChoices = {
  productionVessel: ProductionVesselKey;
  agingPlan: AgingPlanKey;
  closureType: ClosureTypeKey;
};

export type QualityCapResult = {
  rawQualityLevel: WineQualityLevel;
  finalQualityLevel: WineQualityLevel;
  capApplied: boolean;
  capCause: string | null;
};

const QUALITY_RANK: Record<WineQualityLevel, number> = {
  common: 0,
  good: 1,
  premium: 2,
  grand_cru: 3,
  legendary: 4
};

export function applyQualityCaps(
  rawLevel: WineQualityLevel,
  choices: QualityCapChoices,
  chateauLevel: ChateauLevel,
  config: CoreWineEngineConfig
): QualityCapResult {
  const capCandidates = [
    {
      cause: choices.productionVessel,
      level: config.caps.vessel[choices.productionVessel]
    },
    {
      cause: choices.agingPlan,
      level: config.caps.aging[choices.agingPlan]
    },
    {
      cause: choices.closureType,
      level: config.caps.closure[choices.closureType]
    },
    {
      cause: `chateau_level_${chateauLevel}`,
      level: config.caps.chateauLevel[chateauLevel]
    }
  ];

  let finalQualityLevel = rawLevel;
  let capCause: string | null = null;

  for (const candidate of capCandidates) {
    if (QUALITY_RANK[candidate.level] < QUALITY_RANK[finalQualityLevel]) {
      finalQualityLevel = candidate.level;
      capCause = candidate.cause;
    }
  }

  return {
    rawQualityLevel: rawLevel,
    finalQualityLevel,
    capApplied: finalQualityLevel !== rawLevel,
    capCause
  };
}
