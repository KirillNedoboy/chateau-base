import { describe, expect, it, vi } from "vitest";
import {
  ApiError,
  buyShopItem,
  craftWine,
  getGameState,
  getOrCreateAnonymousSessionId,
  harvestVine,
  plantVine,
  previewWinery,
  startSession
} from "./api";

function createMemoryStorage(initial: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initial));

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    }
  };
}

describe("web API client", () => {
  it("reuses the persisted anonymous session id", () => {
    const storage = createMemoryStorage({
      chateau_anonymous_session_id: "anon_existing"
    });

    expect(getOrCreateAnonymousSessionId(storage)).toBe("anon_existing");
  });

  it("creates and persists an anonymous session id without Math.random", () => {
    const storage = createMemoryStorage();

    const id = getOrCreateAnonymousSessionId(storage, {
      randomUUID: () => "generated_id"
    });

    expect(id).toBe("generated_id");
    expect(storage.getItem("chateau_anonymous_session_id")).toBe("generated_id");
  });

  it("starts a session through the configured API base URL", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          user: {
            id: "user_1",
            telegramUserId: null,
            walletAddress: null,
            chainId: null,
            baseProfileLinked: false,
            grapeBalance: 500,
            chateauLevel: 1,
            tutorialState: {
              status: "not_started",
              currentStep: "session_started",
              completedSteps: ["session_started"],
              firstWineBatchId: null,
              firstWineRevealedAt: null,
              violenceModePromptedAt: null,
              updatedAt: "2026-01-01T00:00:00.000Z"
            },
            sommelierViolenceEnabled: false,
            cowardMeter: 0
          },
          activeSeason: null
        }),
        { status: 200 }
      )
    );

    const session = await startSession(
      { anonymousSessionId: "anon_1" },
      { apiBaseUrl: "http://127.0.0.1:4000", fetchImpl }
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:4000/api/session/start",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ anonymousSessionId: "anon_1" })
      })
    );
    expect(session.user.id).toBe("user_1");
  });

  it("throws ApiError for non-2xx responses", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ message: "User not found" }), { status: 404 })
    );

    await expect(
      getGameState("missing_user", {
        apiBaseUrl: "",
        fetchImpl
      })
    ).rejects.toMatchObject({
      status: 404,
      message: "User not found"
    });
  });

  it("throws ApiError for network failures", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("connect ECONNREFUSED");
    });

    await expect(
      getGameState("user_1", {
        apiBaseUrl: "http://127.0.0.1:4000",
        fetchImpl
      })
    ).rejects.toMatchObject({
      status: null,
      message: "connect ECONNREFUSED"
    });
  });

  it("posts shop buy mutations with a per-action idempotency key", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          userId: "user_1",
          itemKey: "vine",
          quantity: 1,
          totalCost: 80,
          grapeBalance: 420
        }),
        { status: 200 }
      )
    );

    await buyShopItem(
      {
        userId: "user_1",
        itemKey: "vine",
        quantity: 1,
        idempotencyKey: "buy_key_1"
      },
      { apiBaseUrl: "http://127.0.0.1:4000", fetchImpl }
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:4000/api/shop/buy",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          userId: "user_1",
          itemKey: "vine",
          quantity: 1,
          idempotencyKey: "buy_key_1"
        })
      })
    );
  });

  it("posts plant and harvest mutations to the existing vine endpoints", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ plotId: "plot_1" }), { status: 200 })
    );

    await plantVine(
      {
        userId: "user_1",
        plotId: "plot_1",
        idempotencyKey: "plant_key_1"
      },
      { fetchImpl }
    );
    await harvestVine(
      {
        userId: "user_1",
        plotId: "plot_1",
        idempotencyKey: "harvest_key_1"
      },
      { fetchImpl }
    );

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      "/api/vines/plant",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          userId: "user_1",
          plotId: "plot_1",
          idempotencyKey: "plant_key_1"
        })
      })
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "/api/vines/harvest",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          userId: "user_1",
          plotId: "plot_1",
          idempotencyKey: "harvest_key_1"
        })
      })
    );
  });

  it("posts winery preview without idempotency and craft with idempotency", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          canCraft: true,
          missingResources: {},
          requiredUnlocks: [],
          estimatedBottleCount: 3,
          applicableCaps: ["steel_tank", "no_aging", "screw_cap", "chateau_level_1"],
          maxPossibleQualityLevel: "good"
        }),
        { status: 200 }
      )
    );

    await previewWinery(
      {
        userId: "user_1",
        grapeAmount: 7,
        productionVessel: "steel_tank",
        agingPlan: "no_aging",
        closureType: "screw_cap"
      },
      { fetchImpl }
    );
    await craftWine(
      {
        userId: "user_1",
        grapeAmount: 7,
        productionVessel: "steel_tank",
        agingPlan: "no_aging",
        closureType: "screw_cap",
        idempotencyKey: "craft_key_1"
      },
      { fetchImpl }
    );

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      "/api/winery/preview",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          userId: "user_1",
          grapeAmount: 7,
          productionVessel: "steel_tank",
          agingPlan: "no_aging",
          closureType: "screw_cap"
        })
      })
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "/api/winery/craft",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          userId: "user_1",
          grapeAmount: 7,
          productionVessel: "steel_tank",
          agingPlan: "no_aging",
          closureType: "screw_cap",
          idempotencyKey: "craft_key_1"
        })
      })
    );
  });
});
