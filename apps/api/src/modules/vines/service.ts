import {
  DEFAULT_GAME_CONFIG,
  calculateGrapeYield,
  calculateVineState
} from "@chateau/game-engine";
import {
  HARVESTED_GRAPE_ITEM_KEY,
  type HarvestedGrapeItemKey
} from "@chateau/shared";
import type { ApiPrismaClient } from "../../plugins/prisma.js";
import {
  advanceTutorialState,
  isTutorialActive
} from "../tutorial/state.js";

const PLOT_ID_PATTERN = /^plot_(\d+)$/;

const VINE_STATE_TO_DB_KEY = {
  low_yield: "LOW_YIELD",
  balanced: "BALANCED",
  overcropped: "OVERCROPPED"
} as const;

// Prisma enum symbol maps to database value "grape"; API/shared contracts use "grape".
const PRISMA_HARVESTED_GRAPE_ITEM_KEY = "GRAPE" as const;

function createHttpError(statusCode: number, message: string) {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

function parsePlotIndex(plotId: string): number {
  const match = PLOT_ID_PATTERN.exec(plotId);
  if (!match) {
    throw createHttpError(400, "plotId must use plot_<index> format");
  }

  return Number(match[1]);
}

function resolveGrowthSeconds(tutorialState: unknown): number {
  return isTutorialActive(tutorialState)
    ? DEFAULT_GAME_CONFIG.growthTimers.tutorialVineSeconds
    : DEFAULT_GAME_CONFIG.growthTimers.earlyVineSeconds;
}

type PlantVineInput = {
  prisma: ApiPrismaClient;
  userId: string;
  plotId: string;
};

type PlantVineResult = {
  plotId: string;
  remainingVines: number;
  vine: {
    id: string;
    plotId: string;
    harvestCount: number;
    state: "low_yield" | "balanced" | "overcropped";
    plantedAt: string;
    readyAt: string;
  };
};

type HarvestVineInput = {
  prisma: ApiPrismaClient;
  userId: string;
  plotId: string;
};

type HarvestVineResult = {
  plotId: string;
  grapesAdded: number;
  inventoryItemKey: HarvestedGrapeItemKey;
  grapeInventoryQuantity: number;
  grapeBalance: number;
  vine: {
    id: string;
    plotId: string;
    harvestCount: number;
    state: "low_yield" | "balanced" | "overcropped";
    plantedAt: string;
    readyAt: string;
    lastHarvestedAt: string | null;
  };
};

export async function plantVine({
  prisma,
  userId,
  plotId
}: PlantVineInput): Promise<PlantVineResult> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    const plotIndex = parsePlotIndex(plotId);
    const plot = await tx.plot.findFirst({
      where: {
        userId,
        index: plotIndex
      }
    });

    if (!plot) {
      throw createHttpError(409, "Plot is locked");
    }

    if (plot.vineId !== null || plot.status !== "EMPTY") {
      throw createHttpError(409, "Plot is already occupied");
    }

    const vineInventory = await tx.inventory.findFirst({
      where: {
        userId,
        itemKey: "VINE"
      }
    });

    if (!vineInventory || vineInventory.quantity < 1) {
      throw createHttpError(409, "No Vine inventory available");
    }

    const plantedAt = new Date();
    const readyAt = new Date(
      plantedAt.getTime() + resolveGrowthSeconds(user.tutorialState) * 1000
    );
    const vineState = calculateVineState(0);

    const vine = await tx.vine.create({
      data: {
        userId,
        plotId: plot.id,
        harvestCount: 0,
        state: VINE_STATE_TO_DB_KEY[vineState.key],
        plantedAt,
        readyAt
      }
    });

    await tx.inventory.update({
      where: {
        id: vineInventory.id
      },
      data: {
        quantity: {
          decrement: 1
        }
      }
    });

    await tx.plot.update({
      where: { id: plot.id },
      data: {
        status: "PLANTED",
        vineId: vine.id
      }
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        tutorialState: advanceTutorialState(user.tutorialState, ["vine_planted"])
      }
    });

    await tx.gameEvent.create({
      data: {
        userId,
        sessionId: null,
        name: "vine_planted",
        payload: {
          plotId,
          vineId: vine.id,
          readyAt: readyAt.toISOString()
        }
      }
    });

    return {
      plotId,
      remainingVines: vineInventory.quantity - 1,
      vine: {
        id: vine.id,
        plotId,
        harvestCount: vine.harvestCount,
        state: vineState.key,
        plantedAt: vine.plantedAt.toISOString(),
        readyAt: vine.readyAt.toISOString()
      }
    };
  });
}

export async function harvestVine({
  prisma,
  userId,
  plotId
}: HarvestVineInput): Promise<HarvestVineResult> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    const plotIndex = parsePlotIndex(plotId);
    const plot = await tx.plot.findFirst({
      where: {
        userId,
        index: plotIndex
      }
    });

    if (!plot) {
      throw createHttpError(409, "Plot is locked");
    }

    const vine = await tx.vine.findFirst({
      where: {
        userId,
        plotId: plot.id
      }
    });

    if (!vine) {
      throw createHttpError(409, "No vine planted on this plot");
    }

    const now = new Date();
    if (vine.readyAt.getTime() > now.getTime()) {
      throw createHttpError(409, "Vine is not ready to harvest");
    }

    const nextHarvestCount = vine.harvestCount + 1;
    const vineState = calculateVineState(nextHarvestCount);
    const grapesAdded = calculateGrapeYield(vineState, DEFAULT_GAME_CONFIG);
    const nextReadyAt = new Date(
      now.getTime() + resolveGrowthSeconds(user.tutorialState) * 1000
    );

    const updatedVine = await tx.vine.update({
      where: { id: vine.id },
      data: {
        harvestCount: nextHarvestCount,
        state: VINE_STATE_TO_DB_KEY[vineState.key],
        readyAt: nextReadyAt,
        lastHarvestedAt: now
      }
    });

    const grapeInventory = await tx.inventory.upsert({
      where: {
        userId_itemKey: {
          userId,
          itemKey: PRISMA_HARVESTED_GRAPE_ITEM_KEY
        }
      },
      update: {
        quantity: {
          increment: grapesAdded
        }
      },
      create: {
        userId,
        itemKey: PRISMA_HARVESTED_GRAPE_ITEM_KEY,
        quantity: grapesAdded
      }
    });

    await tx.plot.update({
      where: { id: plot.id },
      data: {
        status: "PLANTED",
        vineId: vine.id
      }
    });

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        tutorialState: advanceTutorialState(user.tutorialState, ["vine_harvested"])
      }
    });

    await tx.gameEvent.create({
      data: {
        userId,
        sessionId: null,
        name: "vine_harvested",
        payload: {
          plotId,
          vineId: vine.id,
          grapesAdded,
          harvestCount: nextHarvestCount,
          grapeBalance: updatedUser.grapeBalance,
          inventoryItemKey: HARVESTED_GRAPE_ITEM_KEY,
          grapeInventoryQuantity: grapeInventory.quantity
        }
      }
    });

    return {
      plotId,
      grapesAdded,
      inventoryItemKey: HARVESTED_GRAPE_ITEM_KEY,
      grapeInventoryQuantity: grapeInventory.quantity,
      grapeBalance: updatedUser.grapeBalance,
      vine: {
        id: updatedVine.id,
        plotId,
        harvestCount: updatedVine.harvestCount,
        state: vineState.key,
        plantedAt: updatedVine.plantedAt.toISOString(),
        readyAt: updatedVine.readyAt.toISOString(),
        lastHarvestedAt: updatedVine.lastHarvestedAt?.toISOString() ?? null
      }
    };
  });
}
