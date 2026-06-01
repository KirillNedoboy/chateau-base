import { beforeEach, describe, expect, it } from "vitest";
import { createBatchHash } from "@chateau/game-engine";
import { buildServer } from "../src/server.js";
import {
  createTestPrisma,
  type TestDbState
} from "./helpers/createTestPrisma.js";

const PRISMA_HARVESTED_GRAPE_ITEM_KEY = "GRAPE" as const;

async function startSession(server: ReturnType<typeof buildServer>, telegramUserId: string) {
  const response = await server.inject({
    method: "POST",
    url: "/api/session/start",
    payload: {
      telegramUserId
    }
  });

  expect(response.statusCode).toBe(200);
  return response.json().user.id as string;
}

function seedInventory(
  state: TestDbState,
  userId: string,
  itemKey:
    | "GRAPE"
    | "SCREW_CAP"
    | "CORK"
    | "OLD_OAK_BARREL_UNLOCK"
    | "NEW_OAK_BARREL_UNLOCK",
  quantity: number
) {
  const now = new Date();
  state.inventories.push({
    id: `inventory_${state.inventories.length + 1}`,
    userId,
    itemKey,
    quantity,
    createdAt: now,
    updatedAt: now
  });
}

function craftPayload(userId: string, overrides: Record<string, unknown> = {}) {
  return {
    userId,
    grapeAmount: 7,
    productionVessel: "steel_tank",
    agingPlan: "no_aging",
    closureType: "screw_cap",
    idempotencyKey: "craft_default",
    ...overrides
  };
}

describe("Plan 010 winery preview and craft API", () => {
  let state: TestDbState;
  let prismaLike: unknown;
  let createInitialTutorialState: ReturnType<typeof createTestPrisma>["createInitialTutorialState"];

  beforeEach(() => {
    const testDb = createTestPrisma();
    state = testDb.state;
    prismaLike = testDb.prismaLike;
    createInitialTutorialState = testDb.createInitialTutorialState;
  });

  it("preview does not mutate inventory and reports craftability", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_preview_ok");
    seedInventory(state, userId, PRISMA_HARVESTED_GRAPE_ITEM_KEY, 7);
    seedInventory(state, userId, "SCREW_CAP", 1);

    const beforeInventory = structuredClone(state.inventories);
    const response = await server.inject({
      method: "POST",
      url: "/api/winery/preview",
      payload: craftPayload(userId)
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      canCraft: true,
      missingResources: {},
      requiredUnlocks: [],
      estimatedBottleCount: 3,
      maxPossibleQualityLevel: "good"
    });
    expect(response.json().applicableCaps).toContain("no_aging");
    expect(state.inventories).toEqual(beforeInventory);
    await server.close();
  });

  it("preview reports missing grapes, closures, and unlocks", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_preview_missing");
    seedInventory(state, userId, PRISMA_HARVESTED_GRAPE_ITEM_KEY, 3);

    const response = await server.inject({
      method: "POST",
      url: "/api/winery/preview",
      payload: craftPayload(userId, {
        grapeAmount: 7,
        productionVessel: "new_oak_barrel",
        agingPlan: "new_to_old_oak_aging",
        closureType: "cork"
      })
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().canCraft).toBe(false);
    expect(response.json().missingResources).toEqual({
      grapes: 4,
      corks: 1
    });
    expect(response.json().requiredUnlocks).toEqual(["new_oak_barrel_unlock"]);
    await server.close();
  });

  it("craft consumes harvested grapes and closure inventory without changing grapeBalance", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_craft_consumes");
    seedInventory(state, userId, PRISMA_HARVESTED_GRAPE_ITEM_KEY, 7);
    seedInventory(state, userId, "SCREW_CAP", 1);
    const startingBalance = state.users[0]!.grapeBalance;

    const response = await server.inject({
      method: "POST",
      url: "/api/winery/craft",
      payload: craftPayload(userId, { idempotencyKey: "craft_consumes" })
    });

    expect(response.statusCode).toBe(200);
    expect(state.users[0]!.grapeBalance).toBe(startingBalance);
    expect(
      state.inventories.find(
        (entry) => entry.userId === userId && entry.itemKey === "GRAPE"
      )?.quantity
    ).toBe(0);
    expect(
      state.inventories.find(
        (entry) => entry.userId === userId && entry.itemKey === "SCREW_CAP"
      )?.quantity
    ).toBe(0);
    expect(state.wineBatches).toHaveLength(1);
    await server.close();
  });

  it("craft fails guarded inventory decrement without negative inventory or WineBatch", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_craft_stale_guard");
    seedInventory(state, userId, PRISMA_HARVESTED_GRAPE_ITEM_KEY, 7);
    seedInventory(state, userId, "SCREW_CAP", 1);
    (
      state as TestDbState & {
        beforeNextInventoryUpdateMany?: () => void;
      }
    ).beforeNextInventoryUpdateMany = () => {
      const grapes = state.inventories.find(
        (entry) => entry.userId === userId && entry.itemKey === "GRAPE"
      );
      if (grapes) {
        grapes.quantity = 0;
      }
    };

    const response = await server.inject({
      method: "POST",
      url: "/api/winery/craft",
      payload: craftPayload(userId, { idempotencyKey: "craft_stale_guard" })
    });

    expect(response.statusCode).toBe(409);
    expect(state.wineBatches).toHaveLength(0);
    expect(
      state.inventories.find(
        (entry) => entry.userId === userId && entry.itemKey === "GRAPE"
      )?.quantity
    ).toBeGreaterThanOrEqual(0);
    await server.close();
  });

  it("repeated craft idempotencyKey does not double-consume resources or create duplicate WineBatch", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_craft_idempotent");
    seedInventory(state, userId, PRISMA_HARVESTED_GRAPE_ITEM_KEY, 14);
    seedInventory(state, userId, "CORK", 2);

    const payload = craftPayload(userId, {
      closureType: "cork",
      idempotencyKey: "craft_idempotent"
    });
    const first = await server.inject({
      method: "POST",
      url: "/api/winery/craft",
      payload
    });
    const second = await server.inject({
      method: "POST",
      url: "/api/winery/craft",
      payload
    });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(first.json().id).toBe(second.json().id);
    expect(first.json().batchHash).toBe(second.json().batchHash);
    expect(state.wineBatches).toHaveLength(1);
    expect(
      state.inventories.find(
        (entry) => entry.userId === userId && entry.itemKey === "GRAPE"
      )?.quantity
    ).toBe(7);
    expect(
      state.inventories.find(
        (entry) => entry.userId === userId && entry.itemKey === "CORK"
      )?.quantity
    ).toBe(1);
    await server.close();
  });

  it("allows separate identical crafts to create distinct WineBatches and batchHash values", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_identical_crafts_distinct_hash");
    state.wineBatches.push({
      id: "existing_batch",
      userId,
      preservedOnchain: false,
      qualityLevel: "premium"
    } as unknown as TestDbState["wineBatches"][number]);
    seedInventory(state, userId, PRISMA_HARVESTED_GRAPE_ITEM_KEY, 14);
    seedInventory(state, userId, "SCREW_CAP", 2);

    const first = await server.inject({
      method: "POST",
      url: "/api/winery/craft",
      payload: craftPayload(userId, {
        idempotencyKey: "craft_identical_first"
      })
    });
    const second = await server.inject({
      method: "POST",
      url: "/api/winery/craft",
      payload: craftPayload(userId, {
        idempotencyKey: "craft_identical_second"
      })
    });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(first.json().id).not.toBe(second.json().id);
    expect(first.json().batchHash).not.toBe(second.json().batchHash);
    expect(state.wineBatches).toHaveLength(3);
    expect(
      state.inventories.find(
        (entry) => entry.userId === userId && entry.itemKey === "GRAPE"
      )?.quantity
    ).toBe(0);
    expect(
      state.inventories.find(
        (entry) => entry.userId === userId && entry.itemKey === "SCREW_CAP"
      )?.quantity
    ).toBe(0);

    const firstBody = first.json();
    const recomputedFirstHash = createBatchHash({
      batchId: firstBody.id,
      userId: firstBody.userId,
      seasonKey: firstBody.seasonKey,
      gameConfigVersion: firstBody.gameConfigVersion,
      grapeAmount: firstBody.grapeAmount,
      bottleCount: firstBody.bottleCount,
      productionVessel: firstBody.productionVessel,
      agingPlan: firstBody.agingPlan,
      closureType: firstBody.closureType,
      vineState: firstBody.vineState,
      rawQualityScore: firstBody.rawQualityScore,
      qualityScore: firstBody.qualityScore,
      rawQualityLevel: firstBody.rawQualityLevel,
      qualityLevel: firstBody.qualityLevel,
      capApplied: firstBody.capApplied,
      capCause: firstBody.capCause,
      wineProfile: firstBody.profile,
      styleTags: firstBody.styleTags,
      label: firstBody.label,
      moments: firstBody.moments,
      primaryMoment: firstBody.primaryMoment,
      sommelierVerdict: firstBody.verdict.quality,
      styleVerdict: firstBody.verdict.style,
      salePrice: firstBody.salePrice,
      metadataUri: null
    });
    expect(recomputedFirstHash).toBe(firstBody.batchHash);
    await server.close();
  });

  it("first tutorial wine cannot be Common", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_tutorial_not_common");
    seedInventory(state, userId, PRISMA_HARVESTED_GRAPE_ITEM_KEY, 7);
    seedInventory(state, userId, "SCREW_CAP", 1);

    const response = await server.inject({
      method: "POST",
      url: "/api/winery/craft",
      payload: craftPayload(userId, {
        idempotencyKey: "tutorial_first_common_blocked"
      })
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().qualityLevel).not.toBe("common");
    expect(response.json().moments).toContain("first_wine");
    await server.close();
  });

  it("changing idempotencyKey does not steer first tutorial wine quality for the same user seed", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_tutorial_seed_stable");
    seedInventory(state, userId, PRISMA_HARVESTED_GRAPE_ITEM_KEY, 7);
    seedInventory(state, userId, "SCREW_CAP", 1);

    const first = await server.inject({
      method: "POST",
      url: "/api/winery/craft",
      payload: craftPayload(userId, { idempotencyKey: "a" })
    });

    state.wineBatches = [];
    state.recipeHistory = [];
    state.gameActionLogs = [];
    state.gameEvents = [];
    state.users[0]!.tutorialState = createInitialTutorialState();
    state.inventories = [];
    seedInventory(state, userId, PRISMA_HARVESTED_GRAPE_ITEM_KEY, 7);
    seedInventory(state, userId, "SCREW_CAP", 1);

    const second = await server.inject({
      method: "POST",
      url: "/api/winery/craft",
      payload: craftPayload(userId, { idempotencyKey: "d" })
    });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(first.json().qualityLevel).toBe(second.json().qualityLevel);
    expect(first.json().qualityLevel).not.toBe("common");
    await server.close();
  });

  it("Screw Cap can cap raw Legendary to Premium", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_screw_cap_cap");
    state.users[0]!.chateauLevel = "LEVEL_3";
    seedInventory(state, userId, PRISMA_HARVESTED_GRAPE_ITEM_KEY, 7);
    seedInventory(state, userId, "SCREW_CAP", 1);
    seedInventory(state, userId, "NEW_OAK_BARREL_UNLOCK", 1);

    const response = await server.inject({
      method: "POST",
      url: "/api/winery/craft",
      payload: craftPayload(userId, {
        productionVessel: "new_oak_barrel",
        agingPlan: "new_to_old_oak_aging",
        closureType: "screw_cap",
        idempotencyKey: "craft_screw_cap_cap"
      })
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      rawQualityLevel: "legendary",
      qualityLevel: "premium",
      capApplied: true,
      capCause: "screw_cap"
    });
    await server.close();
  });

  it("WineBatch contains full result artifacts and preserve metadata without preserve transaction", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_full_batch");
    seedInventory(state, userId, PRISMA_HARVESTED_GRAPE_ITEM_KEY, 7);
    seedInventory(state, userId, "CORK", 1);
    seedInventory(state, userId, "NEW_OAK_BARREL_UNLOCK", 1);

    const response = await server.inject({
      method: "POST",
      url: "/api/winery/craft",
      payload: craftPayload(userId, {
        productionVessel: "new_oak_barrel",
        agingPlan: "new_to_old_oak_aging",
        closureType: "cork",
        idempotencyKey: "craft_full_batch"
      })
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().profile).toMatchObject({
      acidity: expect.any(Number),
      body: expect.any(Number),
      complexity: expect.any(Number)
    });
    expect(response.json().label.name).toContain("Chateau Base");
    expect(response.json().styleTags.length).toBeGreaterThan(0);
    expect(response.json().moments.length).toBeGreaterThan(0);
    expect(response.json().primaryMoment).not.toBeNull();
    expect(response.json().verdict.quality).toEqual(expect.any(String));
    expect(response.json().verdict.style).toEqual(expect.any(String));
    expect(response.json().salePrice).toBeGreaterThan(0);
    expect(response.json().batchHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(response.json().metadataUri).toContain(response.json().batchHash);
    expect(response.json().nftReadyMetadata.attributes.qualityLevel).toBe(
      response.json().qualityLevel
    );
    expect(response.json().preservedOnchain).toBe(false);
    expect((state as unknown as { onchainEvents?: unknown[] }).onchainEvents ?? []).toEqual([]);
    await server.close();
  });

  it("sets onchainEligible true only for Premium+ or meaningful moments", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_eligibility");
    state.wineBatches.push({
      id: "existing_batch",
      userId,
      preservedOnchain: false,
      qualityLevel: "premium"
    } as unknown as TestDbState["wineBatches"][number]);
    seedInventory(state, userId, PRISMA_HARVESTED_GRAPE_ITEM_KEY, 14);
    seedInventory(state, userId, "SCREW_CAP", 2);
    seedInventory(state, userId, "OLD_OAK_BARREL_UNLOCK", 1);

    const ordinary = await server.inject({
      method: "POST",
      url: "/api/winery/craft",
      payload: craftPayload(userId, {
        idempotencyKey: "craft_ordinary_good"
      })
    });
    const premium = await server.inject({
      method: "POST",
      url: "/api/winery/craft",
      payload: craftPayload(userId, {
        productionVessel: "old_oak_barrel",
        agingPlan: "short_old_oak_aging",
        closureType: "screw_cap",
        idempotencyKey: "craft_premium_eligible"
      })
    });

    expect(ordinary.statusCode).toBe(200);
    expect(ordinary.json().qualityLevel).toBe("good");
    expect(ordinary.json().onchainEligible).toBe(false);
    expect(premium.statusCode).toBe(200);
    expect(premium.json().qualityLevel).toBe("premium");
    expect(premium.json().onchainEligible).toBe(true);
    await server.close();
  });

  it("keeps RecipeHistory best score and quality level when a lower score recipe is crafted", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_recipe_history_best");
    seedInventory(state, userId, PRISMA_HARVESTED_GRAPE_ITEM_KEY, 7);
    seedInventory(state, userId, "SCREW_CAP", 1);
    const now = new Date("2026-01-02T00:00:00.000Z");
    state.recipeHistory.push({
      id: "recipe_existing_best",
      userId,
      productionVessel: "STEEL_TANK",
      agingPlan: "NO_AGING",
      closureType: "SCREW_CAP",
      vineState: "LOW_YIELD",
      timesUsed: 1,
      bestScore: 88,
      bestQualityLevel: "GRAND_CRU",
      lastUsedAt: now,
      createdAt: now,
      updatedAt: now
    });

    const response = await server.inject({
      method: "POST",
      url: "/api/winery/craft",
      payload: craftPayload(userId, { idempotencyKey: "craft_lower_history" })
    });

    expect(response.statusCode).toBe(200);
    const history = state.recipeHistory.find(
      (entry) => entry.id === "recipe_existing_best"
    );
    expect(history?.timesUsed).toBe(2);
    expect(history?.bestScore).toBe(88);
    expect(history?.bestQualityLevel).toBe("GRAND_CRU");
    expect(history?.lastUsedAt.getTime()).toBeGreaterThan(now.getTime());
    await server.close();
  });
});
