import { randomUUID } from "node:crypto";
import {
  DEFAULT_GAME_CONFIG,
  applyQualityCaps,
  applyTutorialFirstWineRule,
  buildWineMetadata,
  calculateBottleCount,
  calculateRawQualityScore,
  calculateSalePrice,
  checkOnchainEligibility,
  createBatchHash,
  detectMoments,
  generateSommelierVerdict,
  generateStyleTags,
  generateStyleVerdict,
  generateWineLabel,
  generateWineProfile,
  getQualityLevelFromScore,
  selectPrimaryMoment
} from "@chateau/game-engine";
import type {
  AgingPlanKey,
  ClosureTypeKey,
  GameMoment,
  ProductionVesselKey,
  VineStateKey,
  WineQualityLevel
} from "@chateau/shared";
import type { ShopItemKey as PrismaShopItemKey } from "@prisma/client";
import type { ApiPrismaClient } from "../../plugins/prisma.js";
import { advanceTutorialState, isTutorialActive } from "../tutorial/state.js";

type InventoryReader = {
  inventory: Pick<ApiPrismaClient["inventory"], "findFirst">;
};

type InventoryGuardWriter = {
  inventory: Pick<ApiPrismaClient["inventory"], "updateMany">;
};

const HARVESTED_GRAPE_DB_KEY = "GRAPE" as const satisfies PrismaShopItemKey;

const CLOSURE_TO_DB_KEY = {
  screw_cap: "SCREW_CAP",
  cork: "CORK"
} as const satisfies Record<ClosureTypeKey, PrismaShopItemKey>;

const REQUIRED_UNLOCK_BY_CHOICE = {
  old_oak_barrel: "old_oak_barrel_unlock",
  new_oak_barrel: "new_oak_barrel_unlock",
  short_old_oak_aging: "old_oak_barrel_unlock",
  new_oak_aging: "new_oak_barrel_unlock",
  new_to_old_oak_aging: "new_oak_barrel_unlock"
} as const;

const UNLOCK_TO_DB_KEY = {
  old_oak_barrel_unlock: "OLD_OAK_BARREL_UNLOCK",
  new_oak_barrel_unlock: "NEW_OAK_BARREL_UNLOCK"
} as const satisfies Record<string, PrismaShopItemKey>;

const QUALITY_TO_DB_KEY = {
  common: "COMMON",
  good: "GOOD",
  premium: "PREMIUM",
  grand_cru: "GRAND_CRU",
  legendary: "LEGENDARY"
} as const satisfies Record<WineQualityLevel, string>;

const DB_QUALITY_TO_APP_KEY = {
  COMMON: "common",
  GOOD: "good",
  PREMIUM: "premium",
  GRAND_CRU: "grand_cru",
  LEGENDARY: "legendary"
} as const satisfies Record<string, WineQualityLevel>;

const PRODUCTION_VESSEL_TO_DB_KEY = {
  steel_tank: "STEEL_TANK",
  old_oak_barrel: "OLD_OAK_BARREL",
  new_oak_barrel: "NEW_OAK_BARREL"
} as const satisfies Record<ProductionVesselKey, string>;

const AGING_PLAN_TO_DB_KEY = {
  no_aging: "NO_AGING",
  short_old_oak_aging: "SHORT_OLD_OAK_AGING",
  new_oak_aging: "NEW_OAK_AGING",
  new_to_old_oak_aging: "NEW_TO_OLD_OAK_AGING"
} as const satisfies Record<AgingPlanKey, string>;

const CLOSURE_TO_DB_ENUM_KEY = {
  screw_cap: "SCREW_CAP",
  cork: "CORK"
} as const satisfies Record<ClosureTypeKey, string>;

const VINE_STATE_TO_DB_KEY = {
  low_yield: "LOW_YIELD",
  balanced: "BALANCED",
  overcropped: "OVERCROPPED"
} as const satisfies Record<VineStateKey, string>;

const DB_VINE_STATE_TO_APP_KEY = {
  LOW_YIELD: "low_yield",
  BALANCED: "balanced",
  OVERCROPPED: "overcropped"
} as const satisfies Record<string, VineStateKey>;

// MVP harvested grapes are generic inventory until GrapeLot provenance exists.
// Keep the persisted enum compatible while making the fallback explicit.
const MVP_GENERIC_GRAPE_VINE_STATE_FALLBACK: VineStateKey = "low_yield";

type WineryRecipeInput = {
  userId: string;
  grapeAmount: number;
  productionVessel: ProductionVesselKey;
  agingPlan: AgingPlanKey;
  closureType: ClosureTypeKey;
};

export type PreviewWineryInput = WineryRecipeInput & {
  prisma: ApiPrismaClient;
};

export type CraftWineInput = WineryRecipeInput & {
  prisma: ApiPrismaClient;
  idempotencyKey: string;
};

type MissingResources = {
  grapes?: number;
  screwCaps?: number;
  corks?: number;
};

type PreviewWineryResult = {
  canCraft: boolean;
  missingResources: MissingResources;
  requiredUnlocks: string[];
  estimatedBottleCount: number;
  applicableCaps: string[];
  maxPossibleQualityLevel: WineQualityLevel;
};

type CraftWineResult = {
  id: string;
  userId: string;
  seasonId: string;
  seasonKey: string;
  gameConfigVersion: string;
  grapeAmount: number;
  bottleCount: number;
  vineState: VineStateKey;
  productionVessel: ProductionVesselKey;
  agingPlan: AgingPlanKey;
  closureType: ClosureTypeKey;
  rawQualityScore: number;
  rawQualityLevel: WineQualityLevel;
  qualityScore: number;
  qualityLevel: WineQualityLevel;
  capApplied: boolean;
  capCause: string | null;
  profile: ReturnType<typeof generateWineProfile>;
  styleTags: ReturnType<typeof generateStyleTags>;
  label: ReturnType<typeof generateWineLabel>;
  moments: GameMoment[];
  primaryMoment: GameMoment | null;
  verdict: {
    quality: string;
    style: string;
  };
  salePrice: number;
  batchHash: string;
  metadataUri: string;
  onchainEligible: boolean;
  preservedOnchain: false;
  nftReadyMetadata: ReturnType<typeof buildWineMetadata>;
};

function createHttpError(statusCode: number, message: string) {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

function toChateauLevelNumber(chateauLevel: unknown): 1 | 2 | 3 {
  if (chateauLevel === "LEVEL_2") {
    return 2;
  }
  if (chateauLevel === "LEVEL_3") {
    return 3;
  }
  return 1;
}

function getRequiredUnlocks(
  productionVessel: ProductionVesselKey,
  agingPlan: AgingPlanKey
): string[] {
  const unlocks = new Set<string>();
  if (productionVessel in REQUIRED_UNLOCK_BY_CHOICE) {
    unlocks.add(
      REQUIRED_UNLOCK_BY_CHOICE[
        productionVessel as keyof typeof REQUIRED_UNLOCK_BY_CHOICE
      ]
    );
  }
  if (agingPlan in REQUIRED_UNLOCK_BY_CHOICE) {
    unlocks.add(
      REQUIRED_UNLOCK_BY_CHOICE[agingPlan as keyof typeof REQUIRED_UNLOCK_BY_CHOICE]
    );
  }
  return [...unlocks];
}

function getApplicableCaps(
  choices: Pick<WineryRecipeInput, "productionVessel" | "agingPlan" | "closureType">,
  chateauLevel: 1 | 2 | 3
): string[] {
  return [
    choices.productionVessel,
    choices.agingPlan,
    choices.closureType,
    `chateau_level_${chateauLevel}`
  ];
}

async function getInventoryQuantity(
  prisma: InventoryReader,
  userId: string,
  itemKey: PrismaShopItemKey
): Promise<number> {
  const entry = await prisma.inventory.findFirst({
    where: {
      userId,
      itemKey
    }
  });
  return entry?.quantity ?? 0;
}

async function getMissingResources(
  prisma: InventoryReader,
  input: WineryRecipeInput
): Promise<MissingResources> {
  const missing: MissingResources = {};
  const grapeQuantity = await getInventoryQuantity(
    prisma,
    input.userId,
    HARVESTED_GRAPE_DB_KEY
  );
  const closureQuantity = await getInventoryQuantity(
    prisma,
    input.userId,
    CLOSURE_TO_DB_KEY[input.closureType]
  );

  if (grapeQuantity < input.grapeAmount) {
    missing.grapes = input.grapeAmount - grapeQuantity;
  }
  if (closureQuantity < 1) {
    if (input.closureType === "cork") {
      missing.corks = 1 - closureQuantity;
    } else {
      missing.screwCaps = 1 - closureQuantity;
    }
  }

  return missing;
}

async function getMissingUnlocks(
  prisma: InventoryReader,
  input: WineryRecipeInput
): Promise<string[]> {
  const requiredUnlocks = getRequiredUnlocks(input.productionVessel, input.agingPlan);
  const missing: string[] = [];

  for (const unlock of requiredUnlocks) {
    const quantity = await getInventoryQuantity(
      prisma,
      input.userId,
      UNLOCK_TO_DB_KEY[unlock as keyof typeof UNLOCK_TO_DB_KEY]
    );
    if (quantity < 1) {
      missing.push(unlock);
    }
  }

  return missing;
}

async function assertCanCraft(prisma: InventoryReader, input: WineryRecipeInput) {
  const [missingResources, requiredUnlocks] = await Promise.all([
    getMissingResources(prisma, input),
    getMissingUnlocks(prisma, input)
  ]);

  if (Object.keys(missingResources).length > 0 || requiredUnlocks.length > 0) {
    throw createHttpError(409, "Missing resources or unlocks");
  }
}

function buildPreviewResult(
  input: WineryRecipeInput,
  chateauLevel: 1 | 2 | 3,
  missingResources: MissingResources,
  requiredUnlocks: string[]
): PreviewWineryResult {
  const rawCapResult = applyQualityCaps(
    "legendary",
    {
      productionVessel: input.productionVessel,
      agingPlan: input.agingPlan,
      closureType: input.closureType
    },
    chateauLevel,
    DEFAULT_GAME_CONFIG
  );

  return {
    canCraft: Object.keys(missingResources).length === 0 && requiredUnlocks.length === 0,
    missingResources,
    requiredUnlocks,
    estimatedBottleCount: calculateBottleCount(input.grapeAmount),
    applicableCaps: getApplicableCaps(input, chateauLevel),
    maxPossibleQualityLevel: rawCapResult.finalQualityLevel
  };
}

function mapStoredQualityLevel(level: unknown): WineQualityLevel | null {
  if (typeof level !== "string") {
    return null;
  }
  if (level in DB_QUALITY_TO_APP_KEY) {
    return DB_QUALITY_TO_APP_KEY[level as keyof typeof DB_QUALITY_TO_APP_KEY];
  }

  return null;
}

function mapStoredVineState(state: unknown): VineStateKey {
  if (typeof state !== "string") {
    return MVP_GENERIC_GRAPE_VINE_STATE_FALLBACK;
  }
  if (state in DB_VINE_STATE_TO_APP_KEY) {
    return DB_VINE_STATE_TO_APP_KEY[state as keyof typeof DB_VINE_STATE_TO_APP_KEY];
  }

  return MVP_GENERIC_GRAPE_VINE_STATE_FALLBACK;
}

async function consumeInventoryItem(
  prisma: InventoryGuardWriter,
  userId: string,
  itemKey: PrismaShopItemKey,
  quantity: number
) {
  const result = await prisma.inventory.updateMany({
    where: {
      userId,
      itemKey,
      quantity: {
        gte: quantity
      }
    },
    data: {
      quantity: {
        decrement: quantity
      }
    }
  });

  if (result.count !== 1) {
    throw createHttpError(409, "Missing resources");
  }
}

export async function previewWinery({
  prisma,
  ...input
}: PreviewWineryInput): Promise<PreviewWineryResult> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId }
  });

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  const [missingResources, requiredUnlocks] = await Promise.all([
    getMissingResources(prisma, input),
    getMissingUnlocks(prisma, input)
  ]);

  return buildPreviewResult(
    input,
    toChateauLevelNumber(user.chateauLevel),
    missingResources,
    requiredUnlocks
  );
}

export async function craftWine({
  prisma,
  idempotencyKey,
  ...input
}: CraftWineInput): Promise<CraftWineResult> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: input.userId }
    });

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    await assertCanCraft(tx, input);

    const activeSeason = await tx.season.findFirst({
      where: { isActive: true },
      orderBy: { startsAt: "desc" }
    });

    if (!activeSeason) {
      throw createHttpError(409, "No active season");
    }

    const existingBatches = await tx.wineBatch.findMany({
      where: { userId: input.userId }
    });
    const chateauLevel = toChateauLevelNumber(user.chateauLevel);
    const vineState = MVP_GENERIC_GRAPE_VINE_STATE_FALLBACK;
    const rawQualityScore = calculateRawQualityScore({
      vineState: {
        key: vineState,
        harvestCount: 1
      },
      productionVessel: input.productionVessel,
      agingPlan: input.agingPlan,
      closureType: input.closureType,
      randomFactor: 0,
      config: DEFAULT_GAME_CONFIG
    });
    const rawQualityLevel = getQualityLevelFromScore(
      rawQualityScore,
      DEFAULT_GAME_CONFIG
    );
    const capResult = applyQualityCaps(
      rawQualityLevel,
      {
        productionVessel: input.productionVessel,
        agingPlan: input.agingPlan,
        closureType: input.closureType
      },
      chateauLevel,
      DEFAULT_GAME_CONFIG
    );
    const firstWine = existingBatches.length === 0;
    const qualityLevel =
      firstWine && isTutorialActive(user.tutorialState)
        ? applyTutorialFirstWineRule({
            qualityLevel: capResult.finalQualityLevel,
            tutorialSeed: `${input.userId}:${String(activeSeason.key).toLowerCase()}:tutorial-first-wine`
          })
        : capResult.finalQualityLevel;
    const bottleCount = calculateBottleCount(input.grapeAmount);
    const qualityScore = rawQualityScore;

    const historyQualityLevels = existingBatches
      .map((batch) => mapStoredQualityLevel(batch.qualityLevel))
      .filter((level): level is WineQualityLevel => level !== null);
    const userHistory = {
      hasMadeWine: existingBatches.length > 0,
      hasPremium: historyQualityLevels.includes("premium"),
      hasGrandCru: historyQualityLevels.includes("grand_cru"),
      hasLegendary: historyQualityLevels.includes("legendary"),
      firstGrandCruWithCork:
        ["grand_cru", "legendary"].includes(qualityLevel) &&
        input.closureType === "cork" &&
        !existingBatches.some(
          (batch) =>
            ["GRAND_CRU", "LEGENDARY"].includes(String(batch.qualityLevel)) &&
            batch.closureType === "CORK"
        ),
      repeatedSafeRuns: false
    };
    const moments = detectMoments({
      rawQualityScore,
      rawQualityLevel,
      finalQualityLevel: qualityLevel,
      capApplied: capResult.capApplied,
      capCause: capResult.capCause,
      randomFactor: 0,
      choices: {
        productionVessel: input.productionVessel,
        agingPlan: input.agingPlan,
        closureType: input.closureType
      },
      vineState,
      userHistory,
      wallet: {
        walletLinked: user.walletAddress !== null,
        baseProfileLinked: user.baseProfileLinked
      },
      storedInCellar: false
    });
    const primaryMoment = selectPrimaryMoment(moments);
    const profile = generateWineProfile({
      rawQualityLevel,
      rawQualityScore,
      qualityLevel,
      qualityScore,
      bottleCount,
      grapeAmount: input.grapeAmount,
      vineState,
      productionVessel: input.productionVessel,
      agingPlan: input.agingPlan,
      closureType: input.closureType,
      moments
    });
    const styleTags = generateStyleTags({
      rawQualityLevel,
      rawQualityScore,
      qualityLevel,
      qualityScore,
      bottleCount,
      grapeAmount: input.grapeAmount,
      vineState,
      productionVessel: input.productionVessel,
      agingPlan: input.agingPlan,
      closureType: input.closureType,
      moments,
      profile,
      primaryMoment
    });
    const label = generateWineLabel({
      rawQualityLevel,
      rawQualityScore,
      qualityLevel,
      qualityScore,
      bottleCount,
      grapeAmount: input.grapeAmount,
      vineState,
      productionVessel: input.productionVessel,
      agingPlan: input.agingPlan,
      closureType: input.closureType,
      moments,
      primaryMoment
    });
    const salePrice = calculateSalePrice(
      {
        qualityLevel,
        qualityScore,
        bottleCount
      },
      DEFAULT_GAME_CONFIG
    );
    const verdict = {
      quality: generateSommelierVerdict(qualityLevel),
      style: generateStyleVerdict({
        rawQualityLevel,
        rawQualityScore,
        qualityLevel,
        qualityScore,
        bottleCount,
        grapeAmount: input.grapeAmount,
        vineState,
        productionVessel: input.productionVessel,
        agingPlan: input.agingPlan,
        closureType: input.closureType,
        moments,
        styleTags
      })
    };
    const nftReadyMetadata = buildWineMetadata({
      rawQualityLevel,
      rawQualityScore,
      qualityLevel,
      qualityScore,
      bottleCount,
      grapeAmount: input.grapeAmount,
      vineState,
      productionVessel: input.productionVessel,
      agingPlan: input.agingPlan,
      closureType: input.closureType,
      moments,
      profile,
      styleTags,
      label,
      primaryMoment,
      salePrice
    });
    const seasonKey = String(activeSeason.key).toLowerCase();
    const batchId = randomUUID();
    const batchHash = createBatchHash({
      batchId,
      userId: input.userId,
      seasonKey,
      gameConfigVersion: DEFAULT_GAME_CONFIG.version,
      grapeAmount: input.grapeAmount,
      bottleCount,
      productionVessel: input.productionVessel,
      agingPlan: input.agingPlan,
      closureType: input.closureType,
      vineState,
      rawQualityScore,
      qualityScore,
      rawQualityLevel,
      qualityLevel,
      capApplied: capResult.capApplied,
      capCause: capResult.capCause,
      wineProfile: profile,
      styleTags,
      label,
      moments,
      primaryMoment,
      sommelierVerdict: verdict.quality,
      styleVerdict: verdict.style,
      salePrice,
      metadataUri: null
    });
    const metadataUri = `chateau://metadata/${batchHash}`;
    const onchainEligible = checkOnchainEligibility({
      qualityLevel,
      moments
    });

    await consumeInventoryItem(
      tx,
      input.userId,
      HARVESTED_GRAPE_DB_KEY,
      input.grapeAmount
    );
    await consumeInventoryItem(tx, input.userId, CLOSURE_TO_DB_KEY[input.closureType], 1);

    await tx.gameEvent.create({
      data: {
        userId: input.userId,
        sessionId: null,
        name: "production_started",
        payload: {
          grapeAmount: input.grapeAmount,
          productionVessel: input.productionVessel,
          agingPlan: input.agingPlan,
          closureType: input.closureType
        }
      }
    });

    const wineBatch = await tx.wineBatch.create({
      data: {
        id: batchId,
        userId: input.userId,
        seasonId: activeSeason.id,
        seasonKey: activeSeason.key,
        gameConfigVersion: DEFAULT_GAME_CONFIG.version,
        batchHash,
        metadataUri,
        onchainEligible,
        preservedOnchain: false,
        qualityLevel: QUALITY_TO_DB_KEY[qualityLevel],
        qualityScore,
        rawQualityScore,
        rawQualityLevel: QUALITY_TO_DB_KEY[rawQualityLevel],
        capApplied: capResult.capApplied,
        capAppliedLevel: capResult.capApplied
          ? QUALITY_TO_DB_KEY[qualityLevel]
          : null,
        capCause: capResult.capCause,
        productionVessel: PRODUCTION_VESSEL_TO_DB_KEY[input.productionVessel],
        agingPlan: AGING_PLAN_TO_DB_KEY[input.agingPlan],
        closureType: CLOSURE_TO_DB_ENUM_KEY[input.closureType],
        vineState: VINE_STATE_TO_DB_KEY[vineState],
        grapeAmount: input.grapeAmount,
        bottleCount,
        profile,
        styleTags,
        label,
        moments,
        primaryMoment,
        verdict,
        nftReadyMetadata,
        recipe: {
          productionVessel: input.productionVessel,
          agingPlan: input.agingPlan,
          closureType: input.closureType,
          vineState,
          grapeAmount: input.grapeAmount
        },
        salePrice
      }
    });

    const recipeIdentity = {
      userId_productionVessel_agingPlan_closureType_vineState: {
        userId: input.userId,
        productionVessel: PRODUCTION_VESSEL_TO_DB_KEY[input.productionVessel],
        agingPlan: AGING_PLAN_TO_DB_KEY[input.agingPlan],
        closureType: CLOSURE_TO_DB_ENUM_KEY[input.closureType],
        vineState: VINE_STATE_TO_DB_KEY[vineState]
      }
    };
    const existingRecipeHistory = await tx.recipeHistory.findUnique({
      where: recipeIdentity
    });
    const recipeUsedAt = new Date();

    if (existingRecipeHistory) {
      const improvesBest = qualityScore > existingRecipeHistory.bestScore;
      await tx.recipeHistory.update({
        where: {
          id: existingRecipeHistory.id
        },
        data: {
          timesUsed: {
            increment: 1
          },
          bestScore: improvesBest ? qualityScore : existingRecipeHistory.bestScore,
          bestQualityLevel: improvesBest
            ? QUALITY_TO_DB_KEY[qualityLevel]
            : existingRecipeHistory.bestQualityLevel,
          lastUsedAt: recipeUsedAt
        }
      });
    } else {
      await tx.recipeHistory.create({
        data: {
          userId: input.userId,
          productionVessel: PRODUCTION_VESSEL_TO_DB_KEY[input.productionVessel],
          agingPlan: AGING_PLAN_TO_DB_KEY[input.agingPlan],
          closureType: CLOSURE_TO_DB_ENUM_KEY[input.closureType],
          vineState: VINE_STATE_TO_DB_KEY[vineState],
          timesUsed: 1,
          bestScore: qualityScore,
          bestQualityLevel: QUALITY_TO_DB_KEY[qualityLevel],
          lastUsedAt: recipeUsedAt
        }
      }
      );
    }

    await tx.user.update({
      where: { id: input.userId },
      data: {
        tutorialState: advanceTutorialState(user.tutorialState, ["wine_revealed"])
      }
    });

    await tx.gameEvent.create({
      data: {
        userId: input.userId,
        sessionId: null,
        name: "wine_revealed",
        payload: {
          batchId: wineBatch.id,
          qualityLevel,
          qualityScore,
          primaryMoment,
          onchainEligible
        }
      }
    });

    return {
      id: wineBatch.id,
      userId: input.userId,
      seasonId: activeSeason.id,
      seasonKey,
      gameConfigVersion: DEFAULT_GAME_CONFIG.version,
      grapeAmount: input.grapeAmount,
      bottleCount,
      vineState: mapStoredVineState(wineBatch.vineState),
      productionVessel: input.productionVessel,
      agingPlan: input.agingPlan,
      closureType: input.closureType,
      rawQualityScore,
      rawQualityLevel,
      qualityScore,
      qualityLevel,
      capApplied: capResult.capApplied,
      capCause: capResult.capCause,
      profile,
      styleTags,
      label,
      moments,
      primaryMoment,
      verdict,
      salePrice,
      batchHash,
      metadataUri,
      onchainEligible,
      preservedOnchain: false,
      nftReadyMetadata
    };
  });
}
