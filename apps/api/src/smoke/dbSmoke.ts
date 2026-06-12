import { randomUUID } from "node:crypto";
import { prisma } from "@chateau/db";
import { buildServer } from "../server.js";

const BASE_SEPOLIA_CHAIN_ID = 84532;
const TEST_WALLET = "0xaa0000000000000000000000000000000000db01";

type JsonObject = Record<string, unknown>;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readJson(response: { json: () => unknown }): JsonObject {
  const payload = response.json();
  assert(
    typeof payload === "object" && payload !== null && !Array.isArray(payload),
    "Expected JSON object response"
  );
  return payload as JsonObject;
}

function assertStatus(
  response: { statusCode: number; body: string },
  expectedStatus: number,
  label: string
) {
  if (response.statusCode !== expectedStatus) {
    throw new Error(
      `${label} failed: expected HTTP ${expectedStatus}, received ${response.statusCode}: ${response.body}`
    );
  }
}

async function main() {
  let server: ReturnType<typeof buildServer> | null = null;
  const anonymousSessionId = `db-smoke-${randomUUID()}`;
  let userId: string | null = null;
  const originalBaseSepoliaAddress =
    process.env.CHATEAU_CELLAR_BASE_SEPOLIA_ADDRESS;
  let smokeError: unknown = null;

  try {
    const activeSeason = await prisma.season.findFirst({
      where: {
        key: "GENESIS_HARVEST",
        isActive: true
      }
    });
    assert(activeSeason, "Genesis Harvest seed is missing or inactive");

    server = buildServer({ logger: false });

    const session = await server.inject({
      method: "POST",
      url: "/api/session/start",
      payload: {
        anonymousSessionId
      }
    });
    assertStatus(session, 200, "session start");
    const sessionPayload = readJson(session);
    const user = sessionPayload.user as JsonObject | undefined;
    assert(user, "Session response is missing user");
    assert(user.walletAddress === null, "Smoke user should start without wallet");
    assert(user.grapeBalance === 500, "Smoke user should start with 500 GRAPE");
    assert(typeof user.id === "string", "Session response user id is missing");
    userId = user.id;

    const state = await server.inject({
      method: "GET",
      url: `/api/game/state?userId=${encodeURIComponent(userId)}`
    });
    assertStatus(state, 200, "game state");
    const statePayload = readJson(state);
    assert(statePayload.activeSeason !== null, "Game state is missing active season");

    const buy = await server.inject({
      method: "POST",
      url: "/api/shop/buy",
      payload: {
        userId,
        itemKey: "vine",
        quantity: 1,
        idempotencyKey: "db-smoke-buy-vine"
      }
    });
    assertStatus(buy, 200, "buy vine");
    assert(readJson(buy).grapeBalance === 420, "Buy vine did not debit 80 GRAPE");

    const plant = await server.inject({
      method: "POST",
      url: "/api/vines/plant",
      payload: {
        userId,
        plotId: "plot_1",
        idempotencyKey: "db-smoke-plant"
      }
    });
    assertStatus(plant, 200, "plant vine");

    await prisma.vine.updateMany({
      where: {
        userId
      },
      data: {
        readyAt: new Date(Date.now() - 1_000)
      }
    });

    const harvest = await server.inject({
      method: "POST",
      url: "/api/vines/harvest",
      payload: {
        userId,
        plotId: "plot_1",
        idempotencyKey: "db-smoke-harvest"
      }
    });
    assertStatus(harvest, 200, "harvest vine");
    assert(readJson(harvest).grapesAdded === 7, "Tutorial harvest should add 7 grapes");

    const preview = await server.inject({
      method: "POST",
      url: "/api/winery/preview",
      payload: {
        userId,
        grapeAmount: 7,
        productionVessel: "steel_tank",
        agingPlan: "no_aging",
        closureType: "screw_cap"
      }
    });
    assertStatus(preview, 200, "winery preview");
    assert(readJson(preview).canCraft === true, "Preview should allow tutorial craft");

    const craft = await server.inject({
      method: "POST",
      url: "/api/winery/craft",
      payload: {
        userId,
        grapeAmount: 7,
        productionVessel: "steel_tank",
        agingPlan: "no_aging",
        closureType: "screw_cap",
        idempotencyKey: "db-smoke-craft"
      }
    });
    assertStatus(craft, 200, "winery craft");
    const wine = readJson(craft);
    assert(typeof wine.id === "string", "Craft response is missing wine id");
    assert(wine.qualityLevel !== "common", "Tutorial first wine must not be common");

    const share = await server.inject({
      method: "POST",
      url: "/api/share",
      payload: {
        userId,
        batchId: wine.id,
        type: "wine_result",
        mode: "degen",
        idempotencyKey: "db-smoke-share"
      }
    });
    assertStatus(share, 200, "share create");
    assert(typeof readJson(share).id === "string", "Share response is missing id");

    const wallet = await server.inject({
      method: "POST",
      url: "/api/wallet/link",
      payload: {
        userId,
        walletAddress: TEST_WALLET,
        chainId: BASE_SEPOLIA_CHAIN_ID,
        idempotencyKey: "db-smoke-wallet-link"
      }
    });
    assertStatus(wallet, 200, "wallet link");

    delete process.env.CHATEAU_CELLAR_BASE_SEPOLIA_ADDRESS;
    const preserve = await server.inject({
      method: "POST",
      url: "/api/preserve/prepare",
      payload: {
        userId,
        batchId: wine.id,
        chainId: BASE_SEPOLIA_CHAIN_ID
      }
    });
    assertStatus(preserve, 500, "preserve prepare missing config");
    assert(
      readJson(preserve).message ===
        "ChateauCellar contract address is not configured",
      "Preserve prepare should fail safely when ChateauCellar is not configured"
    );
  } catch (error) {
    smokeError = error;
    throw error;
  } finally {
    let cleanupError: unknown = null;

    if (originalBaseSepoliaAddress === undefined) {
      delete process.env.CHATEAU_CELLAR_BASE_SEPOLIA_ADDRESS;
    } else {
      process.env.CHATEAU_CELLAR_BASE_SEPOLIA_ADDRESS =
        originalBaseSepoliaAddress;
    }

    if (userId) {
      await prisma.user.delete({
        where: {
          id: userId
        }
      }).catch((error: unknown) => {
        cleanupError = cleanupError ?? error;
      });
    }

    if (server) {
      await server.close().catch((error: unknown) => {
        cleanupError = cleanupError ?? error;
      });
    }

    await prisma.$disconnect().catch((error: unknown) => {
      cleanupError = cleanupError ?? error;
    });

    if (cleanupError) {
      console.error("DB-backed MVP smoke cleanup failed:", cleanupError);
      if (smokeError === null) {
        throw cleanupError;
      }
    }
  }
}

main()
  .then(() => {
    console.log("DB-backed MVP smoke passed");
  })
  .catch((error: unknown) => {
    console.error("DB-backed MVP smoke failed:", error);
    process.exitCode = 1;
  });
