import type { ChateauLevel } from "./user.js";
import type { ShopItemKey } from "./vine.js";
import type {
  AgingPlanKey,
  ClosureTypeKey,
  ProductionVesselKey,
  WineQualityLevel
} from "./wine.js";

export type ScoreRange = readonly [number, number];

export type GameConfig = {
  version: string;
  startingGrapeBalance: number;
  shopPrices: Record<ShopItemKey, number>;
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
    thresholds: Record<WineQualityLevel, ScoreRange>;
  };
  sale: {
    baseTierValue: Record<WineQualityLevel, number>;
    scoreMultiplier: number;
    bottleMultiplier: number;
  };
  caps: {
    chateauLevel: Record<ChateauLevel, WineQualityLevel>;
    vessel: Record<ProductionVesselKey, WineQualityLevel>;
    aging: Record<AgingPlanKey, WineQualityLevel>;
    closure: Record<ClosureTypeKey, WineQualityLevel>;
  };
};
