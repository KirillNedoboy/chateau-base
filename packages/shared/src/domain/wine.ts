import type { GameMoment } from "./moments.js";
import type { VineStateKey } from "./vine.js";

export type WineQualityLevel =
  | "common"
  | "good"
  | "premium"
  | "grand_cru"
  | "legendary";

export type ProductionVesselKey =
  | "steel_tank"
  | "old_oak_barrel"
  | "new_oak_barrel";

export type AgingPlanKey =
  | "no_aging"
  | "short_old_oak_aging"
  | "new_oak_aging"
  | "new_to_old_oak_aging";

export type ClosureTypeKey = "screw_cap" | "cork";

export type WineBatchStatus = "revealed" | "stored" | "sold";

export type WineStyleTag =
  | "low_yield"
  | "balanced_vine"
  | "overcropped"
  | "steel_tank"
  | "old_oak"
  | "new_oak"
  | "no_aging"
  | "short_aging"
  | "new_to_old_oak"
  | "screw_cap"
  | "corked"
  | "small_batch"
  | "high_complexity"
  | "gas_station_vintage"
  | "almost_legendary"
  | "based_vintage";

export type WineProfile = {
  acidity: number;
  body: number;
  tannin: number;
  aroma: number;
  complexity: number;
  balance: number;
};

export type WineLabelFrame = "basic" | "silver" | "gold" | "legendary" | "based";

export type WineLabel = {
  name: string;
  subtitle: string;
  frame: WineLabelFrame;
  icon: string;
};

export type WineProductionRecipe = {
  productionVessel: ProductionVesselKey;
  agingPlan: AgingPlanKey;
  closureType: ClosureTypeKey;
  vineState: VineStateKey;
  grapeAmount: number;
};

export type WineVerdict = {
  quality: string;
  style: string;
};

export type WineMetadata = {
  name: string;
  description: string;
  imageUrl: string | null;
  attributes: Record<string, string | number | boolean | null>;
};

export type WineBatch = {
  id: string;
  userId: string;
  seasonId: string;
  seasonKey: string;
  gameConfigVersion: string;
  qualityLevel: WineQualityLevel;
  qualityScore: number;
  rawQualityScore: number;
  capApplied: WineQualityLevel | null;
  bottleCount: number;
  grapeAmount: number;
  profile: WineProfile;
  styleTags: WineStyleTag[];
  label: WineLabel;
  recipe: WineProductionRecipe;
  verdict: WineVerdict;
  salePrice: number;
  moments: GameMoment[];
  primaryMoment: GameMoment | null;
  status: WineBatchStatus;
  nftReadyMetadata: WineMetadata;
  createdAt: string;
  soldAt: string | null;
  storedAt: string | null;
};

export type RunItBackMissingResources = {
  grapes?: number;
  screwCaps?: number;
  corks?: number;
  requiredUnlocks?: string[];
  requiredChateauLevel?: number;
};

export type RunItBackPreview = {
  canRun: boolean;
  missingResources: RunItBackMissingResources;
  recipe: WineProductionRecipe;
};

export type RecipeHistory = {
  id: string;
  userId: string;
  productionVessel: ProductionVesselKey;
  agingPlan: AgingPlanKey;
  closureType: ClosureTypeKey;
  vineState: VineStateKey;
  timesUsed: number;
  bestScore: number;
  bestQualityLevel: WineQualityLevel;
  lastUsedAt: string;
};
