import { beforeEach, describe, expect, it } from "vitest";
import { HARVESTED_GRAPE_ITEM_KEY } from "@chateau/shared";
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

describe("Plan 009 shop, plant, and harvest API", () => {
  let state: TestDbState;
  let prismaLike: unknown;

  beforeEach(() => {
    const testDb = createTestPrisma();
    state = testDb.state;
    prismaLike = testDb.prismaLike;
  });

  it("buying Vine costs 80 GRAPE", async () => {
    const server = buildServer({
      logger: false,
      prisma: prismaLike
    });
    const userId = await startSession(server, "tg_buy_cost");

    const response = await server.inject({
      method: "POST",
      url: "/api/shop/buy",
      payload: {
        userId,
        itemKey: "vine",
        quantity: 1,
        idempotencyKey: "buy_vine_001"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().grapeBalance).toBe(420);
    expect(state.users[0]?.grapeBalance).toBe(420);
    expect(
      state.inventories.find(
        (entry) => entry.userId === userId && entry.itemKey === "VINE"
      )?.quantity
    ).toBe(1);
    await server.close();
  });

  it("insufficient balance fails", async () => {
    const server = buildServer({
      logger: false,
      prisma: prismaLike
    });
    const userId = await startSession(server, "tg_insufficient");
    state.users[0]!.grapeBalance = 79;

    const response = await server.inject({
      method: "POST",
      url: "/api/shop/buy",
      payload: {
        userId,
        itemKey: "vine",
        quantity: 1,
        idempotencyKey: "buy_vine_002"
      }
    });

    expect(response.statusCode).toBe(409);
    expect(state.users[0]?.grapeBalance).toBe(79);
    expect(
      state.inventories.find(
        (entry) => entry.userId === userId && entry.itemKey === "VINE"
      )
    ).toBeUndefined();
    await server.close();
  });

  it("invalid itemKey fails", async () => {
    const server = buildServer({
      logger: false,
      prisma: prismaLike
    });
    const userId = await startSession(server, "tg_invalid_item");

    const response = await server.inject({
      method: "POST",
      url: "/api/shop/buy",
      payload: {
        userId,
        itemKey: "legendary_vine",
        quantity: 1,
        idempotencyKey: "buy_vine_003"
      }
    });

    expect(response.statusCode).toBe(400);
    await server.close();
  });

  it("repeated buy idempotencyKey does not double-charge", async () => {
    const server = buildServer({
      logger: false,
      prisma: prismaLike
    });
    const userId = await startSession(server, "tg_buy_idempotent");

    const first = await server.inject({
      method: "POST",
      url: "/api/shop/buy",
      payload: {
        userId,
        itemKey: "vine",
        quantity: 1,
        idempotencyKey: "buy_vine_004"
      }
    });
    const second = await server.inject({
      method: "POST",
      url: "/api/shop/buy",
      payload: {
        userId,
        itemKey: "vine",
        quantity: 1,
        idempotencyKey: "buy_vine_004"
      }
    });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(state.users[0]?.grapeBalance).toBe(420);
    expect(
      state.inventories.find(
        (entry) => entry.userId === userId && entry.itemKey === "VINE"
      )?.quantity
    ).toBe(1);
    expect(
      state.gameActionLogs.filter(
        (entry) =>
          entry.userId === userId &&
          entry.actionType === "shop_buy" &&
          entry.idempotencyKey === "buy_vine_004"
      )
    ).toHaveLength(1);
    await server.close();
  });

  it("cannot plant locked plot", async () => {
    const server = buildServer({
      logger: false,
      prisma: prismaLike
    });
    const userId = await startSession(server, "tg_locked_plot");

    const buyResponse = await server.inject({
      method: "POST",
      url: "/api/shop/buy",
      payload: {
        userId,
        itemKey: "vine",
        quantity: 1,
        idempotencyKey: "buy_for_locked_plot"
      }
    });
    expect(buyResponse.statusCode).toBe(200);

    const response = await server.inject({
      method: "POST",
      url: "/api/vines/plant",
      payload: {
        userId,
        plotId: "plot_4",
        idempotencyKey: "plant_vine_001"
      }
    });

    expect(response.statusCode).toBe(409);
    expect(state.vines).toHaveLength(0);
    await server.close();
  });

  it("cannot plant without Vine inventory", async () => {
    const server = buildServer({
      logger: false,
      prisma: prismaLike
    });
    const userId = await startSession(server, "tg_no_vine_inventory");

    const response = await server.inject({
      method: "POST",
      url: "/api/vines/plant",
      payload: {
        userId,
        plotId: "plot_1",
        idempotencyKey: "plant_vine_002"
      }
    });

    expect(response.statusCode).toBe(409);
    expect(state.vines).toHaveLength(0);
    await server.close();
  });

  it("cannot plant on occupied plot", async () => {
    const server = buildServer({
      logger: false,
      prisma: prismaLike
    });
    const userId = await startSession(server, "tg_occupied_plot");

    const buyResponse = await server.inject({
      method: "POST",
      url: "/api/shop/buy",
      payload: {
        userId,
        itemKey: "vine",
        quantity: 2,
        idempotencyKey: "buy_for_occupied_plot"
      }
    });
    expect(buyResponse.statusCode).toBe(200);

    const firstPlant = await server.inject({
      method: "POST",
      url: "/api/vines/plant",
      payload: {
        userId,
        plotId: "plot_1",
        idempotencyKey: "plant_vine_003"
      }
    });
    const secondPlant = await server.inject({
      method: "POST",
      url: "/api/vines/plant",
      payload: {
        userId,
        plotId: "plot_1",
        idempotencyKey: "plant_vine_004"
      }
    });

    expect(firstPlant.statusCode).toBe(200);
    expect(secondPlant.statusCode).toBe(409);
    expect(state.vines).toHaveLength(1);
    await server.close();
  });

  it("plant consumes one Vine", async () => {
    const server = buildServer({
      logger: false,
      prisma: prismaLike
    });
    const userId = await startSession(server, "tg_plant_consumes");

    const buyResponse = await server.inject({
      method: "POST",
      url: "/api/shop/buy",
      payload: {
        userId,
        itemKey: "vine",
        quantity: 1,
        idempotencyKey: "buy_for_plant_consumes"
      }
    });
    expect(buyResponse.statusCode).toBe(200);

    const response = await server.inject({
      method: "POST",
      url: "/api/vines/plant",
      payload: {
        userId,
        plotId: "plot_1",
        idempotencyKey: "plant_vine_005"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(
      state.inventories.find(
        (entry) => entry.userId === userId && entry.itemKey === "VINE"
      )?.quantity
    ).toBe(0);
    expect(state.vines).toHaveLength(1);
    const plantedVine = state.vines[0]!;
    expect(plantedVine.harvestCount).toBe(0);
    expect(plantedVine.readyAt.getTime() - plantedVine.plantedAt.getTime()).toBe(
      45_000
    );
    expect(state.plots.find((plot) => plot.index === 1)?.vineId).toBe(plantedVine.id);
    await server.close();
  });

  it("repeated plant idempotencyKey does not consume twice", async () => {
    const server = buildServer({
      logger: false,
      prisma: prismaLike
    });
    const userId = await startSession(server, "tg_plant_idempotent");

    const buyResponse = await server.inject({
      method: "POST",
      url: "/api/shop/buy",
      payload: {
        userId,
        itemKey: "vine",
        quantity: 1,
        idempotencyKey: "buy_for_plant_idempotent"
      }
    });
    expect(buyResponse.statusCode).toBe(200);

    const first = await server.inject({
      method: "POST",
      url: "/api/vines/plant",
      payload: {
        userId,
        plotId: "plot_1",
        idempotencyKey: "plant_vine_006"
      }
    });
    const second = await server.inject({
      method: "POST",
      url: "/api/vines/plant",
      payload: {
        userId,
        plotId: "plot_1",
        idempotencyKey: "plant_vine_006"
      }
    });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(state.vines).toHaveLength(1);
    expect(
      state.inventories.find(
        (entry) => entry.userId === userId && entry.itemKey === "VINE"
      )?.quantity
    ).toBe(0);
    await server.close();
  });

  it("cannot harvest before readyAt", async () => {
    const server = buildServer({
      logger: false,
      prisma: prismaLike
    });
    const userId = await startSession(server, "tg_harvest_early");

    await server.inject({
      method: "POST",
      url: "/api/shop/buy",
      payload: {
        userId,
        itemKey: "vine",
        quantity: 1,
        idempotencyKey: "buy_for_harvest_early"
      }
    });
    await server.inject({
      method: "POST",
      url: "/api/vines/plant",
      payload: {
        userId,
        plotId: "plot_1",
        idempotencyKey: "plant_for_harvest_early"
      }
    });

    const response = await server.inject({
      method: "POST",
      url: "/api/vines/harvest",
      payload: {
        userId,
        plotId: "plot_1",
        idempotencyKey: "harvest_vine_001"
      }
    });

    expect(response.statusCode).toBe(409);
    expect(state.users[0]?.grapeBalance).toBe(420);
    expect(state.vines[0]?.harvestCount).toBe(0);
    expect(
      state.inventories.find(
        (entry) =>
          entry.userId === userId &&
          entry.itemKey === PRISMA_HARVESTED_GRAPE_ITEM_KEY
      )
    ).toBeUndefined();
    await server.close();
  });

  it("first harvest increments harvestCount and adds 7 grapes", async () => {
    const server = buildServer({
      logger: false,
      prisma: prismaLike
    });
    const userId = await startSession(server, "tg_harvest_success");

    await server.inject({
      method: "POST",
      url: "/api/shop/buy",
      payload: {
        userId,
        itemKey: "vine",
        quantity: 1,
        idempotencyKey: "buy_for_harvest_success"
      }
    });
    await server.inject({
      method: "POST",
      url: "/api/vines/plant",
      payload: {
        userId,
        plotId: "plot_1",
        idempotencyKey: "plant_for_harvest_success"
      }
    });
    state.vines[0]!.readyAt = new Date(Date.now() - 1_000);

    const response = await server.inject({
      method: "POST",
      url: "/api/vines/harvest",
      payload: {
        userId,
        plotId: "plot_1",
        idempotencyKey: "harvest_vine_002"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().grapesAdded).toBe(7);
    expect(response.json().inventoryItemKey).toBe(HARVESTED_GRAPE_ITEM_KEY);
    expect(state.users[0]?.grapeBalance).toBe(420);
    expect(
      state.inventories.find(
        (entry) =>
          entry.userId === userId &&
          entry.itemKey === PRISMA_HARVESTED_GRAPE_ITEM_KEY
      )?.quantity
    ).toBe(7);
    expect(state.vines[0]?.harvestCount).toBe(1);
    expect(state.vines[0]?.state).toBe("LOW_YIELD");
    expect(state.plots.find((plot) => plot.index === 1)?.vineId).toBe(state.vines[0]?.id);
    expect(state.vines[0]!.readyAt.getTime()).toBeGreaterThan(Date.now());
    await server.close();
  });

  it("repeated harvest idempotencyKey does not double-add grapes", async () => {
    const server = buildServer({
      logger: false,
      prisma: prismaLike
    });
    const userId = await startSession(server, "tg_harvest_idempotent");

    await server.inject({
      method: "POST",
      url: "/api/shop/buy",
      payload: {
        userId,
        itemKey: "vine",
        quantity: 1,
        idempotencyKey: "buy_for_harvest_idempotent"
      }
    });
    await server.inject({
      method: "POST",
      url: "/api/vines/plant",
      payload: {
        userId,
        plotId: "plot_1",
        idempotencyKey: "plant_for_harvest_idempotent"
      }
    });
    state.vines[0]!.readyAt = new Date(Date.now() - 1_000);

    const first = await server.inject({
      method: "POST",
      url: "/api/vines/harvest",
      payload: {
        userId,
        plotId: "plot_1",
        idempotencyKey: "harvest_vine_003"
      }
    });
    const second = await server.inject({
      method: "POST",
      url: "/api/vines/harvest",
      payload: {
        userId,
        plotId: "plot_1",
        idempotencyKey: "harvest_vine_003"
      }
    });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(first.json().inventoryItemKey).toBe(HARVESTED_GRAPE_ITEM_KEY);
    expect(second.json().inventoryItemKey).toBe(HARVESTED_GRAPE_ITEM_KEY);
    expect(state.users[0]?.grapeBalance).toBe(420);
    expect(
      state.inventories.find(
        (entry) =>
          entry.userId === userId &&
          entry.itemKey === PRISMA_HARVESTED_GRAPE_ITEM_KEY
      )?.quantity
    ).toBe(7);
    expect(state.vines[0]?.harvestCount).toBe(1);
    await server.close();
  });

  it("no client-trusted price, yield, or balance", async () => {
    const server = buildServer({
      logger: false,
      prisma: prismaLike
    });
    const userId = await startSession(server, "tg_no_client_trust");

    const buyResponse = await server.inject({
      method: "POST",
      url: "/api/shop/buy",
      payload: {
        userId,
        itemKey: "vine",
        quantity: 1,
        idempotencyKey: "buy_no_client_trust",
        price: 1,
        grapeBalance: 99_999
      }
    });

    expect(buyResponse.statusCode).toBe(200);
    expect(state.users[0]?.grapeBalance).toBe(420);

    await server.inject({
      method: "POST",
      url: "/api/vines/plant",
      payload: {
        userId,
        plotId: "plot_1",
        idempotencyKey: "plant_no_client_trust"
      }
    });
    state.vines[0]!.readyAt = new Date(Date.now() - 1_000);

    const harvestResponse = await server.inject({
      method: "POST",
      url: "/api/vines/harvest",
      payload: {
        userId,
        plotId: "plot_1",
        idempotencyKey: "harvest_no_client_trust",
        grapeYield: 999,
        grapeBalance: 99_999
      }
    });

    expect(harvestResponse.statusCode).toBe(200);
    expect(harvestResponse.json().grapesAdded).toBe(7);
    expect(harvestResponse.json().inventoryItemKey).toBe(
      HARVESTED_GRAPE_ITEM_KEY
    );
    expect(state.users[0]?.grapeBalance).toBe(420);
    expect(
      state.inventories.find(
        (entry) =>
          entry.userId === userId &&
          entry.itemKey === PRISMA_HARVESTED_GRAPE_ITEM_KEY
      )?.quantity
    ).toBe(7);
    await server.close();
  });
});
