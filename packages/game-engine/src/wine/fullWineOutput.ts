import type {
  AgingPlanKey,
  ClosureTypeKey,
  GameMoment,
  ProductionVesselKey,
  VineStateKey,
  WineLabel,
  WineMetadata,
  WineProfile,
  WineQualityLevel,
  WineStyleTag
} from "@chateau/shared";
import type { CoreWineEngineConfig } from "../config/defaultGameConfig.js";

type WineOutputBaseInput = {
  qualityLevel: WineQualityLevel;
  rawQualityLevel: WineQualityLevel;
  rawQualityScore: number;
  qualityScore: number;
  bottleCount: number;
  grapeAmount: number;
  vineState: VineStateKey;
  productionVessel: ProductionVesselKey;
  agingPlan: AgingPlanKey;
  closureType: ClosureTypeKey;
  moments: readonly GameMoment[];
};

type GenerateStyleTagsInput = WineOutputBaseInput & {
  profile: WineProfile;
  primaryMoment: GameMoment | null;
};

type GenerateWineLabelInput = WineOutputBaseInput & {
  primaryMoment: GameMoment | null;
};

type GenerateStyleVerdictInput = WineOutputBaseInput & {
  styleTags: readonly WineStyleTag[];
};

type BuildWineMetadataInput = WineOutputBaseInput & {
  profile: WineProfile;
  styleTags: readonly WineStyleTag[];
  label: WineLabel;
  primaryMoment: GameMoment | null;
  salePrice: number;
};

type CreateBatchHashInput = {
  batchId: string;
  userId: string;
  seasonKey: string;
  gameConfigVersion: string;
  grapeAmount: number;
  bottleCount: number;
  productionVessel: ProductionVesselKey;
  agingPlan: AgingPlanKey;
  closureType: ClosureTypeKey;
  vineState: VineStateKey;
  rawQualityScore: number;
  qualityScore: number;
  rawQualityLevel: WineQualityLevel;
  qualityLevel: WineQualityLevel;
  capApplied: boolean;
  capCause: string | null;
  wineProfile: WineProfile;
  styleTags: readonly WineStyleTag[];
  label: WineLabel;
  moments: readonly GameMoment[];
  primaryMoment: GameMoment | null;
  sommelierVerdict: string;
  styleVerdict: string;
  salePrice: number;
  metadataUri: string | null;
};

type TutorialFirstWineInput = {
  qualityLevel: WineQualityLevel;
  tutorialSeed: string;
  idempotencyKey?: string;
};

type OnchainEligibilityInput = {
  qualityLevel: WineQualityLevel;
  moments: readonly GameMoment[];
};

const QUALITY_RANK: Record<WineQualityLevel, number> = {
  common: 0,
  good: 1,
  premium: 2,
  grand_cru: 3,
  legendary: 4
};

const QUALITY_LABEL: Record<WineQualityLevel, string> = {
  common: "Common",
  good: "Good",
  premium: "Premium",
  grand_cru: "Grand Cru",
  legendary: "Legendary"
};

const MEANINGFUL_PRESERVE_MOMENTS: ReadonlySet<GameMoment> = new Set([
  "first_wine",
  "first_premium",
  "first_grand_cru",
  "first_legendary",
  "almost_legendary",
  "rng_rugged",
  "corkfather",
  "based_vintage"
]);

function clampProfileValue(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function tutorialBucket(seed: string): number {
  let total = 0;
  for (const character of seed) {
    total += character.charCodeAt(0);
  }
  return total % 10;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left.localeCompare(right)
  );
  return `{${entries
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

export function applyTutorialFirstWineRule(
  input: TutorialFirstWineInput
): WineQualityLevel {
  if (QUALITY_RANK[input.qualityLevel] >= QUALITY_RANK.premium) {
    return input.qualityLevel;
  }

  return tutorialBucket(input.tutorialSeed) < 7 ? "good" : "premium";
}

export function generateWineProfile(input: WineOutputBaseInput): WineProfile {
  const isLowYield = input.vineState === "low_yield";
  const usesNewOak = input.productionVessel === "new_oak_barrel";
  const usesNewToOld = input.agingPlan === "new_to_old_oak_aging";
  const usesCork = input.closureType === "cork";
  const isSmallBatch = input.bottleCount <= 3;
  const qualityBonus = QUALITY_RANK[input.qualityLevel] * 3 + 1;

  return {
    acidity: clampProfileValue(60 + (isLowYield ? 8 : 0) + (isSmallBatch ? 8 : 0)),
    body: clampProfileValue(
      55 + (usesNewOak ? 12 : 0) + (usesNewToOld ? 8 : 0) + (usesCork ? 4 : 0)
    ),
    tannin: clampProfileValue(
      50 + (usesNewOak ? 14 : 0) + (usesNewToOld ? 10 : 0) + (usesCork ? 4 : 0)
    ),
    aroma: clampProfileValue(
      55 + (isLowYield ? 7 : 0) + (usesNewOak ? 8 : 0) + (usesCork ? 5 : 0) + qualityBonus
    ),
    complexity: clampProfileValue(
      50 + (usesNewOak ? 12 : 0) + (usesNewToOld ? 15 : 0) + (usesCork ? 5 : 0) + qualityBonus + 1
    ),
    balance: clampProfileValue(
      61 + qualityBonus + (isLowYield ? 5 : 0) + (usesCork ? 5 : 0) + (isSmallBatch ? 5 : 0)
    )
  };
}

export function generateStyleTags(input: GenerateStyleTagsInput): WineStyleTag[] {
  const tags: WineStyleTag[] = [];

  if (input.vineState === "low_yield") {
    tags.push("low_yield");
  } else if (input.vineState === "balanced") {
    tags.push("balanced_vine");
  } else {
    tags.push("overcropped");
  }

  if (input.productionVessel === "steel_tank") {
    tags.push("steel_tank");
  }
  if (input.productionVessel === "old_oak_barrel") {
    tags.push("old_oak");
  }
  if (input.productionVessel === "new_oak_barrel") {
    tags.push("new_oak");
  }
  if (input.agingPlan === "no_aging") {
    tags.push("no_aging");
  }
  if (input.agingPlan === "short_old_oak_aging") {
    tags.push("short_aging");
  }
  if (input.agingPlan === "new_to_old_oak_aging") {
    tags.push("new_to_old_oak");
  }
  if (input.closureType === "screw_cap") {
    tags.push("screw_cap");
  }
  if (input.closureType === "cork") {
    tags.push("corked");
  }
  if (input.bottleCount <= 3) {
    tags.push("small_batch");
  }
  if (input.profile.complexity >= 85) {
    tags.push("high_complexity");
  }
  if (input.primaryMoment === "almost_legendary") {
    tags.push("almost_legendary");
  }
  if (input.primaryMoment === "based_vintage") {
    tags.push("based_vintage");
  }
  if (
    input.productionVessel === "steel_tank" &&
    input.agingPlan === "no_aging" &&
    input.closureType === "screw_cap"
  ) {
    tags.push("gas_station_vintage");
  }

  return tags;
}

export function generateWineLabel(input: GenerateWineLabelInput): WineLabel {
  if (input.primaryMoment === "corkfather") {
    return {
      name: "The Corkfather Reserve",
      subtitle: `${QUALITY_LABEL[input.qualityLevel]} / ${input.bottleCount} Bottles`,
      frame: "gold",
      icon: "cork"
    };
  }

  const frame =
    input.qualityLevel === "legendary"
      ? "legendary"
      : input.qualityLevel === "grand_cru"
        ? "gold"
        : input.qualityLevel === "premium"
          ? "silver"
          : "basic";

  return {
    name: `Chateau Base - Genesis ${QUALITY_LABEL[input.qualityLevel]}`,
    subtitle: `${input.vineState === "low_yield" ? "Low Yield" : "Estate"} / ${input.bottleCount} Bottles`,
    frame,
    icon: input.closureType === "cork" ? "cork" : "screw_cap"
  };
}

export function generateSommelierVerdict(qualityLevel: WineQualityLevel): string {
  const verdicts: Record<WineQualityLevel, string> = {
    common: "This is not wine. This is fermented regret.",
    good: "Acceptable. Still smells like you followed a tutorial.",
    premium: "Okay, Chad. You cooked.",
    grand_cru: "You are legally allowed to be annoying now.",
    legendary: "This is not a bottle. This is social violence."
  };

  return verdicts[qualityLevel];
}

export function generateStyleVerdict(input: GenerateStyleVerdictInput): string {
  if (input.styleTags.includes("gas_station_vintage")) {
    return "Fast, cheap, and dangerously close to gas station vintage.";
  }

  if (input.styleTags.includes("new_oak")) {
    return "Dense, oaky, dramatic. Basically your ego in liquid form.";
  }

  if (input.styleTags.includes("steel_tank")) {
    return "Clean and safe. The spreadsheet survived.";
  }

  return "Balanced enough to pour without explaining yourself.";
}

export function calculateSalePrice(
  input: Pick<WineOutputBaseInput, "qualityLevel" | "qualityScore" | "bottleCount">,
  config: CoreWineEngineConfig
): number {
  return (
    config.sale.baseTierValue[input.qualityLevel] +
    input.qualityScore * config.sale.scoreMultiplier +
    input.bottleCount * config.sale.bottleMultiplier
  );
}

export function buildWineMetadata(input: BuildWineMetadataInput): WineMetadata {
  return {
    name: input.label.name,
    description: `${QUALITY_LABEL[input.qualityLevel]} vintage from Chateau Base.`,
    imageUrl: null,
    attributes: {
      qualityLevel: input.qualityLevel,
      qualityScore: input.qualityScore,
      bottleCount: input.bottleCount,
      grapeAmount: input.grapeAmount,
      vineState: input.vineState,
      productionVessel: input.productionVessel,
      agingPlan: input.agingPlan,
      closureType: input.closureType,
      primaryMoment: input.primaryMoment,
      salePrice: input.salePrice
    }
  };
}

export function createBatchHash(input: CreateBatchHashInput): string {
  const payload = stableStringify({
    batchId: input.batchId,
    userId: input.userId,
    seasonKey: input.seasonKey,
    gameConfigVersion: input.gameConfigVersion,
    grapeAmount: input.grapeAmount,
    bottleCount: input.bottleCount,
    productionVessel: input.productionVessel,
    agingPlan: input.agingPlan,
    closureType: input.closureType,
    vineState: input.vineState,
    rawQualityScore: input.rawQualityScore,
    qualityScore: input.qualityScore,
    rawQualityLevel: input.rawQualityLevel,
    qualityLevel: input.qualityLevel,
    capApplied: input.capApplied,
    capCause: input.capCause,
    wineProfile: input.wineProfile,
    styleTags: input.styleTags,
    label: input.label,
    moments: input.moments,
    primaryMoment: input.primaryMoment,
    sommelierVerdict: input.sommelierVerdict,
    styleVerdict: input.styleVerdict,
    salePrice: input.salePrice,
    metadataUri: input.metadataUri
  });

  const parts = Array.from({ length: 8 }, (_, index) => {
    let hash = 0x811c9dc5 ^ index;
    for (let charIndex = 0; charIndex < payload.length; charIndex += 1) {
      hash ^= payload.charCodeAt(charIndex) + index;
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  });

  return `0x${parts.join("")}`;
}

export function checkOnchainEligibility(input: OnchainEligibilityInput): boolean {
  if (QUALITY_RANK[input.qualityLevel] >= QUALITY_RANK.premium) {
    return true;
  }

  return input.moments.some((moment) => MEANINGFUL_PRESERVE_MOMENTS.has(moment));
}
