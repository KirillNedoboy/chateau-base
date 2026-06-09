import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildServer } from "../src/server.js";
import {
  createTestPrisma,
  type TestDbState
} from "./helpers/createTestPrisma.js";

const BASE_SEPOLIA_CHAIN_ID = 84532;
const TEST_WALLET = "0xaa00000000000000000000000000000000000016";
const TEST_CONTRACT = "0xbb00000000000000000000000000000000000016";
const TEST_TX_HASH =
  "0x1616161616161616161616161616161616161616161616161616161616161616";

function inventoryQuantity(
  state: TestDbState,
  userId: string,
  itemKey: TestDbState["inventories"][number]["itemKey"]
): number {
  return (
    state.inventories.find(
      (entry) => entry.userId === userId && entry.itemKey === itemKey
    )?.quantity ?? 0
  );
}

async function startAnonymousSession(server: ReturnType<typeof buildServer>) {
  const response = await server.inject({
    method: "POST",
    url: "/api/session/start",
    payload: {
      anonymousSessionId: "plan016-anon"
    }
  });

  expect(response.statusCode).toBe(200);
  return response.json().user as {
    id: string;
    walletAddress: string | null;
    baseProfileLinked: boolean;
    grapeBalance: number;
  };
}

function createWineBatchFixture(
  userId: string,
  overrides: Partial<TestDbState["wineBatches"][number]> = {}
): TestDbState["wineBatches"][number] {
  const now = new Date("2026-01-02T00:00:00.000Z");

  return {
    id: "plan016_fixture_batch",
    userId,
    seasonId: "season_genesis",
    seasonKey: "GENESIS_HARVEST",
    gameConfigVersion: "mvp-0.1.0",
    batchHash: "0xplan016fixture",
    metadataUri: "chateau://metadata/0xplan016fixture",
    onchainEligible: false,
    preservedOnchain: false,
    preserveTxHash: null,
    preserveChainId: null,
    preservedAt: null,
    qualityLevel: "GOOD",
    qualityScore: 60,
    rawQualityScore: 60,
    rawQualityLevel: "PREMIUM",
    capApplied: true,
    capAppliedLevel: "GOOD",
    capCause: "no_aging",
    productionVessel: "STEEL_TANK",
    agingPlan: "NO_AGING",
    closureType: "SCREW_CAP",
    vineState: "LOW_YIELD",
    grapeAmount: 7,
    bottleCount: 3,
    profile: {},
    styleTags: [],
    label: {
      name: "Chateau Base - Genesis Good",
      subtitle: "Low Yield / 3 Bottles",
      frame: "basic",
      icon: "screw_cap"
    },
    moments: ["first_wine"],
    primaryMoment: "first_wine",
    verdict: {
      quality: "Acceptable.",
      style: "Clean and safe."
    },
    nftReadyMetadata: {},
    recipe: {},
    salePrice: 230,
    status: "REVEALED",
    createdAt: now,
    soldAt: null,
    storedAt: null,
    updatedAt: now,
    ...overrides
  };
}

describe("Plan 016 MVP smoke path", () => {
  let state: TestDbState;
  let prismaLike: unknown;
  let originalBaseSepoliaAddress: string | undefined;

  beforeEach(() => {
    const testDb = createTestPrisma();
    state = testDb.state;
    prismaLike = testDb.prismaLike;
    originalBaseSepoliaAddress = process.env.CHATEAU_CELLAR_BASE_SEPOLIA_ADDRESS;
    delete process.env.CHATEAU_CELLAR_BASE_SEPOLIA_ADDRESS;
  });

  afterEach(() => {
    if (originalBaseSepoliaAddress === undefined) {
      delete process.env.CHATEAU_CELLAR_BASE_SEPOLIA_ADDRESS;
    } else {
      process.env.CHATEAU_CELLAR_BASE_SEPOLIA_ADDRESS =
        originalBaseSepoliaAddress;
    }
  });

  it("lets a new walletless user complete the MVP loop with pending preserve and sell", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });

    try {
      const user = await startAnonymousSession(server);
      expect(user.walletAddress).toBeNull();
      expect(user.baseProfileLinked).toBe(false);
      expect(user.grapeBalance).toBe(500);
      expect(inventoryQuantity(state, user.id, "SCREW_CAP")).toBe(1);

      const initialState = await server.inject({
        method: "GET",
        url: `/api/game/state?userId=${encodeURIComponent(user.id)}`
      });
      expect(initialState.statusCode).toBe(200);
      expect(initialState.json()).toMatchObject({
        user: {
          grapeBalance: 500
        },
        plots: {
          total: 3
        },
        vines: {
          total: 0
        },
        preserve: {
          walletLinked: false,
          baseProfileLinked: false,
          preservedBatchCount: 0
        }
      });

      const repeatSession = await server.inject({
        method: "POST",
        url: "/api/session/start",
        payload: {
          anonymousSessionId: "plan016-anon"
        }
      });
      expect(repeatSession.statusCode).toBe(200);
      expect(inventoryQuantity(state, user.id, "SCREW_CAP")).toBe(1);

      const buy = await server.inject({
        method: "POST",
        url: "/api/shop/buy",
        payload: {
          userId: user.id,
          itemKey: "vine",
          quantity: 1,
          idempotencyKey: "plan016-buy-vine"
        }
      });
      expect(buy.statusCode).toBe(200);
      expect(buy.json()).toMatchObject({
        itemKey: "vine",
        totalCost: 80,
        grapeBalance: 420
      });
      expect(state.users[0]?.grapeBalance).toBe(420);

      const plant = await server.inject({
        method: "POST",
        url: "/api/vines/plant",
        payload: {
          userId: user.id,
          plotId: "plot_1",
          idempotencyKey: "plan016-plant"
        }
      });
      expect(plant.statusCode).toBe(200);
      expect(plant.json().vine.plotId).toBe("plot_1");
      expect(
        new Date(plant.json().vine.readyAt).getTime() -
          new Date(plant.json().vine.plantedAt).getTime()
      ).toBe(45_000);

      state.vines[0]!.readyAt = new Date(Date.now() - 1_000);
      const harvest = await server.inject({
        method: "POST",
        url: "/api/vines/harvest",
        payload: {
          userId: user.id,
          plotId: "plot_1",
          idempotencyKey: "plan016-harvest"
        }
      });
      expect(harvest.statusCode).toBe(200);
      expect(harvest.json()).toMatchObject({
        grapesAdded: 7,
        inventoryItemKey: "grape",
        grapeInventoryQuantity: 7,
        grapeBalance: 420
      });
      expect(inventoryQuantity(state, user.id, "GRAPE")).toBe(7);
      expect(state.users[0]?.grapeBalance).toBe(420);

      const preview = await server.inject({
        method: "POST",
        url: "/api/winery/preview",
        payload: {
          userId: user.id,
          grapeAmount: 7,
          productionVessel: "steel_tank",
          agingPlan: "no_aging",
          closureType: "screw_cap"
        }
      });
      expect(preview.statusCode).toBe(200);
      expect(preview.json()).toMatchObject({
        canCraft: true,
        missingResources: {},
        requiredUnlocks: [],
        estimatedBottleCount: 3
      });

      const craft = await server.inject({
        method: "POST",
        url: "/api/winery/craft",
        payload: {
          userId: user.id,
          grapeAmount: 7,
          productionVessel: "steel_tank",
          agingPlan: "no_aging",
          closureType: "screw_cap",
          idempotencyKey: "plan016-craft"
        }
      });
      expect(craft.statusCode).toBe(200);
      const wine = craft.json() as {
        id: string;
        qualityLevel: string;
        qualityScore: number;
        bottleCount: number;
        profile: Record<string, number>;
        styleTags: string[];
        label: { name: string; subtitle: string };
        moments: string[];
        verdict: { quality: string; style: string };
        salePrice: number;
        onchainEligible: boolean;
      };
      expect(["good", "premium"]).toContain(wine.qualityLevel);
      expect(wine.qualityLevel).not.toBe("common");
      expect(wine.qualityScore).toEqual(expect.any(Number));
      expect(wine.bottleCount).toBe(3);
      expect(wine.profile).toMatchObject({
        acidity: expect.any(Number),
        body: expect.any(Number),
        tannin: expect.any(Number),
        aroma: expect.any(Number),
        complexity: expect.any(Number),
        balance: expect.any(Number)
      });
      expect(wine.styleTags.length).toBeGreaterThan(0);
      expect(wine.label.name).toContain("Chateau Base");
      expect(wine.label.subtitle.length).toBeGreaterThan(0);
      expect(wine.moments).toContain("first_wine");
      expect(wine.verdict.quality.length).toBeGreaterThan(0);
      expect(wine.verdict.style.length).toBeGreaterThan(0);
      expect(wine.salePrice).toBeGreaterThan(0);
      expect(wine.onchainEligible).toBe(true);
      expect(inventoryQuantity(state, user.id, "GRAPE")).toBe(0);
      expect(inventoryQuantity(state, user.id, "SCREW_CAP")).toBe(0);

      const share = await server.inject({
        method: "POST",
        url: "/api/share",
        payload: {
          userId: user.id,
          batchId: wine.id,
          type: "wine_result",
          mode: "degen",
          idempotencyKey: "plan016-share"
        }
      });
      expect(share.statusCode).toBe(200);
      expect(share.json()).toMatchObject({
        batchId: wine.id,
        mode: "degen",
        deeplinkUrl: expect.stringMatching(/^\/s\//)
      });

      const publicShare = await server.inject({
        method: "GET",
        url: `/api/s/${share.json().id}`
      });
      expect(publicShare.statusCode).toBe(200);
      expect(publicShare.json().id).toBe(share.json().id);

      const challenge = await server.inject({
        method: "POST",
        url: "/api/challenge/open",
        payload: {
          shareId: share.json().id
        }
      });
      expect(challenge.statusCode).toBe(200);
      expect(challenge.json()).toMatchObject({
        inviterUserId: user.id,
        sourceShareId: share.json().id,
        sourceBatchId: wine.id,
        status: "opened",
        inviterScore: wine.qualityScore
      });

      const wallet = await server.inject({
        method: "POST",
        url: "/api/wallet/link",
        payload: {
          userId: user.id,
          walletAddress: TEST_WALLET,
          chainId: BASE_SEPOLIA_CHAIN_ID,
          idempotencyKey: "plan016-wallet"
        }
      });
      expect(wallet.statusCode).toBe(200);

      const missingConfigPrepare = await server.inject({
        method: "POST",
        url: "/api/preserve/prepare",
        payload: {
          userId: user.id,
          batchId: wine.id,
          chainId: BASE_SEPOLIA_CHAIN_ID
        }
      });
      expect(missingConfigPrepare.statusCode).toBe(500);
      expect(missingConfigPrepare.json().message).toBe(
        "ChateauCellar contract address is not configured"
      );

      process.env.CHATEAU_CELLAR_BASE_SEPOLIA_ADDRESS = TEST_CONTRACT;
      const prepare = await server.inject({
        method: "POST",
        url: "/api/preserve/prepare",
        payload: {
          userId: user.id,
          batchId: wine.id,
          chainId: BASE_SEPOLIA_CHAIN_ID
        }
      });
      expect(prepare.statusCode).toBe(200);
      expect(prepare.json()).toMatchObject({
        batchId: wine.id,
        contractAddress: TEST_CONTRACT,
        chainId: BASE_SEPOLIA_CHAIN_ID
      });

      const confirm = await server.inject({
        method: "POST",
        url: "/api/preserve/confirm",
        payload: {
          userId: user.id,
          batchId: wine.id,
          chainId: BASE_SEPOLIA_CHAIN_ID,
          txHash: TEST_TX_HASH,
          idempotencyKey: "plan016-preserve-confirm"
        }
      });
      expect(confirm.statusCode).toBe(200);
      expect(confirm.json()).toMatchObject({
        batchId: wine.id,
        preserveStatus: "pending",
        preservedOnchain: false,
        preserveTxHash: TEST_TX_HASH,
        preserveChainId: BASE_SEPOLIA_CHAIN_ID,
        preservedAt: null
      });
      expect(state.onchainEvents).toHaveLength(1);
      expect(state.onchainEvents[0]).toMatchObject({
        batchId: wine.id,
        status: "PENDING"
      });
      expect(state.wineBatches[0]?.preservedOnchain).toBe(false);
      expect(state.wineBatches[0]?.preservedAt).toBeNull();

      const profile = await server.inject({
        method: "GET",
        url: `/api/chateau/${TEST_WALLET}`
      });
      expect(profile.statusCode).toBe(200);
      expect(profile.json()).toMatchObject({
        preservedVintagesCount: 0,
        pendingPreserveCount: 1
      });
      expect(profile.json().publicCellar[0]).toMatchObject({
        batchId: wine.id,
        preserveStatus: "pending",
        preservedOnchain: false
      });

      const sell = await server.inject({
        method: "POST",
        url: `/api/wine/${wine.id}/sell`,
        payload: {
          userId: user.id,
          idempotencyKey: "plan016-sell"
        }
      });
      expect(sell.statusCode).toBe(200);
      expect(sell.json()).toMatchObject({
        batchId: wine.id,
        status: "sold",
        salePrice: wine.salePrice,
        grapeBalance: 420 + wine.salePrice
      });
      expect(state.users[0]?.grapeBalance).toBe(420 + wine.salePrice);
      expect(state.wineBatches[0]?.status).toBe("SOLD");
      expect(state.wineBatches[0]?.soldAt).toBeInstanceOf(Date);
    } finally {
      await server.close();
    }
  });

  it("selling a revealed wine is idempotent and cannot be repeated with a new key", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });

    try {
      const user = await startAnonymousSession(server);
      const now = new Date("2026-01-02T00:00:00.000Z");
      state.wineBatches.push({
        id: "plan016_sell_batch",
        userId: user.id,
        seasonId: "season_genesis",
        seasonKey: "GENESIS_HARVEST",
        gameConfigVersion: "mvp-0.1.0",
        batchHash: "0xplan016sell",
        metadataUri: "chateau://metadata/0xplan016sell",
        onchainEligible: false,
        preservedOnchain: false,
        preserveTxHash: null,
        preserveChainId: null,
        preservedAt: null,
        qualityLevel: "GOOD",
        qualityScore: 60,
        rawQualityScore: 60,
        rawQualityLevel: "PREMIUM",
        capApplied: true,
        capAppliedLevel: "GOOD",
        capCause: "no_aging",
        productionVessel: "STEEL_TANK",
        agingPlan: "NO_AGING",
        closureType: "SCREW_CAP",
        vineState: "LOW_YIELD",
        grapeAmount: 7,
        bottleCount: 3,
        profile: {},
        styleTags: [],
        label: {
          name: "Chateau Base - Genesis Good",
          subtitle: "Low Yield / 3 Bottles",
          frame: "basic",
          icon: "screw_cap"
        },
        moments: ["first_wine"],
        primaryMoment: "first_wine",
        verdict: {
          quality: "Acceptable.",
          style: "Clean and safe."
        },
        nftReadyMetadata: {},
        recipe: {},
        salePrice: 230,
        status: "REVEALED",
        createdAt: now,
        soldAt: null,
        storedAt: null,
        updatedAt: now
      });

      const payload = {
        userId: user.id,
        idempotencyKey: "plan016-sell-repeat"
      };
      const first = await server.inject({
        method: "POST",
        url: "/api/wine/plan016_sell_batch/sell",
        payload
      });
      const second = await server.inject({
        method: "POST",
        url: "/api/wine/plan016_sell_batch/sell",
        payload
      });
      const resale = await server.inject({
        method: "POST",
        url: "/api/wine/plan016_sell_batch/sell",
        payload: {
          userId: user.id,
          idempotencyKey: "plan016-sell-new-key"
        }
      });

      expect(first.statusCode).toBe(200);
      expect(second.statusCode).toBe(200);
      expect(second.json()).toEqual(first.json());
      expect(state.users[0]?.grapeBalance).toBe(730);
      expect(resale.statusCode).toBe(409);
      expect(state.users[0]?.grapeBalance).toBe(730);
    } finally {
      await server.close();
    }
  });

  it("rejects stored and already sold wines before crediting GRAPE", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });

    try {
      const user = await startAnonymousSession(server);
      state.wineBatches.push(
        createWineBatchFixture(user.id, {
          id: "plan016_stored_batch",
          batchHash: "0xplan016stored",
          metadataUri: "chateau://metadata/0xplan016stored",
          status: "STORED",
          storedAt: new Date("2026-01-02T00:01:00.000Z")
        }),
        createWineBatchFixture(user.id, {
          id: "plan016_sold_batch",
          batchHash: "0xplan016sold",
          metadataUri: "chateau://metadata/0xplan016sold",
          status: "SOLD",
          soldAt: new Date("2026-01-02T00:02:00.000Z")
        })
      );

      const stored = await server.inject({
        method: "POST",
        url: "/api/wine/plan016_stored_batch/sell",
        payload: {
          userId: user.id,
          idempotencyKey: "plan016-sell-stored"
        }
      });
      const sold = await server.inject({
        method: "POST",
        url: "/api/wine/plan016_sold_batch/sell",
        payload: {
          userId: user.id,
          idempotencyKey: "plan016-sell-direct-sold"
        }
      });

      expect(stored.statusCode).toBe(409);
      expect(stored.json().message).toBe(
        "WineBatch cannot be sold from current state"
      );
      expect(sold.statusCode).toBe(409);
      expect(sold.json().message).toBe("WineBatch is already sold");
      expect(state.users[0]?.grapeBalance).toBe(500);
      expect(
        state.wineBatches.find((batch) => batch.id === "plan016_stored_batch")
          ?.status
      ).toBe("STORED");
      expect(
        state.wineBatches.find((batch) => batch.id === "plan016_sold_batch")
          ?.status
      ).toBe("SOLD");
    } finally {
      await server.close();
    }
  });
});
