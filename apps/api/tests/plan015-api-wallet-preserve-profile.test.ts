import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildServer } from "../src/server.js";
import {
  createTestPrisma,
  type TestDbState
} from "./helpers/createTestPrisma.js";

const BASE_SEPOLIA_CHAIN_ID = 84532;
const UNSUPPORTED_CHAIN_ID = 1;
const WALLET_A = "0xAa00000000000000000000000000000000000001";
const WALLET_B = "0xbb00000000000000000000000000000000000002";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const VALID_CONTRACT_ADDRESS = "0xCc00000000000000000000000000000000000003";
const TX_HASH =
  "0x1111111111111111111111111111111111111111111111111111111111111111";
const ORIGINAL_BASE_ADDRESS = process.env.CHATEAU_CELLAR_BASE_ADDRESS;
const ORIGINAL_BASE_SEPOLIA_ADDRESS =
  process.env.CHATEAU_CELLAR_BASE_SEPOLIA_ADDRESS;

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

async function linkWallet(
  server: ReturnType<typeof buildServer>,
  userId: string,
  walletAddress = WALLET_A,
  idempotencyKey = `wallet_${userId}`
) {
  return server.inject({
    method: "POST",
    url: "/api/wallet/link",
    payload: {
      userId,
      walletAddress,
      chainId: BASE_SEPOLIA_CHAIN_ID,
      idempotencyKey
    }
  });
}

function seedWineBatch(
  state: TestDbState,
  userId: string,
  overrides: Partial<TestDbState["wineBatches"][number]> = {}
) {
  const now = new Date("2026-01-02T00:00:00.000Z");
  const suffix = state.wineBatches.length + 1;
  const batch: TestDbState["wineBatches"][number] = {
    id: `batch_plan015_${suffix}`,
    userId,
    seasonId: "season_genesis",
    seasonKey: "GENESIS_HARVEST",
    gameConfigVersion: "mvp-0.1.0",
    batchHash: `0x${String(suffix).padStart(64, "0")}`,
    metadataUri: `chateau://metadata/${suffix}`,
    onchainEligible: true,
    preservedOnchain: false,
    preserveTxHash: null,
    preserveChainId: null,
    preservedAt: null,
    qualityLevel: "GRAND_CRU",
    qualityScore: 88,
    rawQualityScore: 91,
    rawQualityLevel: "LEGENDARY",
    capApplied: true,
    capAppliedLevel: "PREMIUM",
    capCause: "screw_cap",
    productionVessel: "NEW_OAK_BARREL",
    agingPlan: "NEW_TO_OLD_OAK_AGING",
    closureType: "CORK",
    vineState: "LOW_YIELD",
    grapeAmount: 7,
    bottleCount: 3,
    profile: {
      acidity: 54,
      body: 82,
      tannin: 76,
      aroma: 70,
      complexity: 91,
      balance: 88
    },
    styleTags: ["low_yield", "new_oak", "corked"],
    label: {
      name: "Chateau Base - Liquid Alpha",
      subtitle: "Genesis Harvest / 3 Bottles",
      frame: "gold",
      icon: "bottle"
    },
    moments: ["almost_legendary", "corkfather"],
    primaryMoment: "almost_legendary",
    verdict: {
      quality: "You are legally allowed to be annoying now.",
      style: "Dense, oaky, dramatic."
    },
    nftReadyMetadata: {
      name: "Chateau Base - Liquid Alpha",
      description: "Grand Cru",
      imageUrl: null,
      attributes: {}
    },
    recipe: {
      grapeAmount: 7,
      productionVessel: "new_oak_barrel",
      agingPlan: "new_to_old_oak_aging",
      closureType: "cork"
    },
    salePrice: 620,
    status: "REVEALED",
    createdAt: now,
    soldAt: null,
    storedAt: null,
    updatedAt: now,
    ...overrides
  };

  state.wineBatches.push(batch);
  return batch;
}

describe("Plan 015 wallet, preserve, and public profile API", () => {
  let state: TestDbState;
  let prismaLike: unknown;

  beforeEach(() => {
    const testDb = createTestPrisma();
    state = testDb.state;
    prismaLike = testDb.prismaLike;
    process.env.CHATEAU_CELLAR_BASE_ADDRESS = VALID_CONTRACT_ADDRESS;
    process.env.CHATEAU_CELLAR_BASE_SEPOLIA_ADDRESS = VALID_CONTRACT_ADDRESS;
  });

  afterEach(() => {
    if (ORIGINAL_BASE_ADDRESS === undefined) {
      delete process.env.CHATEAU_CELLAR_BASE_ADDRESS;
    } else {
      process.env.CHATEAU_CELLAR_BASE_ADDRESS = ORIGINAL_BASE_ADDRESS;
    }

    if (ORIGINAL_BASE_SEPOLIA_ADDRESS === undefined) {
      delete process.env.CHATEAU_CELLAR_BASE_SEPOLIA_ADDRESS;
    } else {
      process.env.CHATEAU_CELLAR_BASE_SEPOLIA_ADDRESS =
        ORIGINAL_BASE_SEPOLIA_ADDRESS;
    }
  });

  it("wallet link rejects unsupported chain", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_wallet_reject_chain");

    const response = await server.inject({
      method: "POST",
      url: "/api/wallet/link",
      payload: {
        userId,
        walletAddress: WALLET_A,
        chainId: UNSUPPORTED_CHAIN_ID,
        idempotencyKey: "wallet_bad_chain"
      }
    });

    expect(response.statusCode).toBe(400);
    expect(state.users[0]?.walletAddress).toBeNull();
    await server.close();
  });

  it("wallet link stores normalized walletAddress chainId and baseProfileLinked", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_wallet_store");

    const response = await linkWallet(server, userId);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      userId,
      walletAddress: WALLET_A.toLowerCase(),
      chainId: BASE_SEPOLIA_CHAIN_ID,
      baseProfileLinked: true
    });
    expect(state.users[0]).toMatchObject({
      walletAddress: WALLET_A.toLowerCase(),
      chainId: BASE_SEPOLIA_CHAIN_ID,
      baseProfileLinked: true
    });
    await server.close();
  });

  it("wallet link conflict cannot steal wallet from another user", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const ownerUserId = await startSession(server, "tg_wallet_owner");
    const otherUserId = await startSession(server, "tg_wallet_other");
    const linked = await linkWallet(server, ownerUserId);

    const conflict = await linkWallet(server, otherUserId, WALLET_A, "wallet_conflict");

    expect(linked.statusCode).toBe(200);
    expect(conflict.statusCode).toBe(409);
    expect(state.users.find((user) => user.id === ownerUserId)?.walletAddress).toBe(
      WALLET_A.toLowerCase()
    );
    expect(state.users.find((user) => user.id === otherUserId)?.walletAddress).toBeNull();
    await server.close();
  });

  it("preserve prepare rejects ineligible batch", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_preserve_ineligible");
    await linkWallet(server, userId);
    const batch = seedWineBatch(state, userId, {
      onchainEligible: false,
      qualityLevel: "GOOD",
      qualityScore: 44
    });

    const response = await server.inject({
      method: "POST",
      url: "/api/preserve/prepare",
      payload: {
        userId,
        batchId: batch.id,
        chainId: BASE_SEPOLIA_CHAIN_ID
      }
    });

    expect(response.statusCode).toBe(400);
    expect(batch.preservedOnchain).toBe(false);
    await server.close();
  });

  it("preserve prepare rejects missing ChateauCellar contract address", async () => {
    delete process.env.CHATEAU_CELLAR_BASE_SEPOLIA_ADDRESS;
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_preserve_missing_contract");
    await linkWallet(server, userId);
    const batch = seedWineBatch(state, userId);

    const response = await server.inject({
      method: "POST",
      url: "/api/preserve/prepare",
      payload: {
        userId,
        batchId: batch.id,
        chainId: BASE_SEPOLIA_CHAIN_ID
      }
    });

    expect(response.statusCode).toBe(500);
    expect(response.json().message).toMatch(/ChateauCellar contract address/i);
    expect(batch.preservedOnchain).toBe(false);
    await server.close();
  });

  it("preserve prepare rejects zero ChateauCellar contract address", async () => {
    process.env.CHATEAU_CELLAR_BASE_SEPOLIA_ADDRESS = ZERO_ADDRESS;
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_preserve_zero_contract");
    await linkWallet(server, userId);
    const batch = seedWineBatch(state, userId);

    const response = await server.inject({
      method: "POST",
      url: "/api/preserve/prepare",
      payload: {
        userId,
        batchId: batch.id,
        chainId: BASE_SEPOLIA_CHAIN_ID
      }
    });

    expect(response.statusCode).toBe(500);
    expect(response.json().message).toMatch(/ChateauCellar contract address/i);
    expect(batch.preservedOnchain).toBe(false);
    await server.close();
  });

  it("preserve prepare returns contract payload for eligible batch", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_preserve_prepare");
    await linkWallet(server, userId);
    const batch = seedWineBatch(state, userId);

    const response = await server.inject({
      method: "POST",
      url: "/api/preserve/prepare",
      payload: {
        userId,
        batchId: batch.id,
        chainId: BASE_SEPOLIA_CHAIN_ID
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      contractAddress: VALID_CONTRACT_ADDRESS.toLowerCase(),
      chainId: BASE_SEPOLIA_CHAIN_ID,
      batchId: batch.id,
      batchHash: batch.batchHash,
      metadataUri: batch.metadataUri,
      qualityLevel: 4,
      primaryMoment: "almost_legendary",
      seasonKey: "genesis_harvest",
      score: 88
    });
    expect(batch.preservedOnchain).toBe(false);
    await server.close();
  });

  it("preserve confirm creates a pending OnchainEvent without marking batch preserved", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_preserve_confirm");
    await linkWallet(server, userId);
    const batch = seedWineBatch(state, userId);

    const response = await server.inject({
      method: "POST",
      url: "/api/preserve/confirm",
      payload: {
        userId,
        batchId: batch.id,
        chainId: BASE_SEPOLIA_CHAIN_ID,
        txHash: TX_HASH,
        idempotencyKey: "preserve_confirm_1"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      batchId: batch.id,
      preserveStatus: "pending",
      preservedOnchain: false,
      preserveTxHash: TX_HASH,
      preserveChainId: BASE_SEPOLIA_CHAIN_ID,
      preservedAt: null
    });
    expect(state.wineBatches[0]).toMatchObject({
      preservedOnchain: false,
      preserveTxHash: TX_HASH,
      preserveChainId: BASE_SEPOLIA_CHAIN_ID,
      preservedAt: null
    });
    expect(state.onchainEvents).toHaveLength(1);
    expect(state.onchainEvents[0]).toMatchObject({
      userId,
      walletAddress: WALLET_A.toLowerCase(),
      chainId: BASE_SEPOLIA_CHAIN_ID,
      eventType: "VINTAGE_PRESERVED",
      txHash: TX_HASH,
      batchId: batch.id,
      status: "PENDING"
    });
    await server.close();
  });

  it("duplicate preserve confirm is idempotent and safe", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_preserve_duplicate");
    await linkWallet(server, userId);
    const batch = seedWineBatch(state, userId);
    const payload = {
      userId,
      batchId: batch.id,
      chainId: BASE_SEPOLIA_CHAIN_ID,
      txHash: TX_HASH,
      idempotencyKey: "preserve_duplicate"
    };

    const first = await server.inject({
      method: "POST",
      url: "/api/preserve/confirm",
      payload
    });
    const second = await server.inject({
      method: "POST",
      url: "/api/preserve/confirm",
      payload: {
        ...payload,
        idempotencyKey: "preserve_duplicate_retry"
      }
    });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(second.json()).toEqual(first.json());
    expect(state.onchainEvents).toHaveLength(1);
    expect(state.wineBatches[0]?.preservedOnchain).toBe(false);
    expect(state.wineBatches[0]?.preserveTxHash).toBe(TX_HASH);
    expect(state.wineBatches[0]?.preservedAt).toBeNull();
    await server.close();
  });

  it("public profile excludes pending preserve submissions from confirmed preserved count", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_public_profile_pending");
    await linkWallet(server, userId, WALLET_B);
    const batch = seedWineBatch(state, userId, {
      id: "profile_pending",
      batchHash: `0x${"c".repeat(64)}`
    });

    const confirm = await server.inject({
      method: "POST",
      url: "/api/preserve/confirm",
      payload: {
        userId,
        batchId: batch.id,
        chainId: BASE_SEPOLIA_CHAIN_ID,
        txHash: TX_HASH,
        idempotencyKey: "preserve_profile_pending"
      }
    });
    const response = await server.inject({
      method: "GET",
      url: `/api/chateau/${WALLET_B}`
    });

    expect(confirm.statusCode).toBe(200);
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      preservedVintagesCount: 0,
      pendingPreserveCount: 1
    });
    expect(response.json().publicCellar[0]).toMatchObject({
      batchId: "profile_pending",
      preservedOnchain: false,
      preserveStatus: "pending"
    });
    await server.close();
  });

  it("public profile returns expected stats", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_public_profile");
    await linkWallet(server, userId, WALLET_B);
    seedWineBatch(state, userId, {
      id: "profile_best",
      batchHash: `0x${"a".repeat(64)}`,
      qualityLevel: "LEGENDARY",
      qualityScore: 94,
      preservedOnchain: true,
      preserveTxHash: TX_HASH,
      preserveChainId: BASE_SEPOLIA_CHAIN_ID,
      preservedAt: new Date("2026-01-03T00:00:00.000Z")
    });
    seedWineBatch(state, userId, {
      id: "profile_worst",
      batchHash: `0x${"b".repeat(64)}`,
      qualityLevel: "COMMON",
      qualityScore: 12,
      onchainEligible: false,
      primaryMoment: "screw_cap_criminal",
      preservedOnchain: false
    });

    const response = await server.inject({
      method: "GET",
      url: `/api/chateau/${WALLET_B}`
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      walletAddress: WALLET_B.toLowerCase(),
      shortWallet: "0xbb00...0002",
      basedWinemaker: true,
      genesisHarvest: {
        totalBatches: 2,
        premium: 0,
        grandCru: 0,
        legendary: 1,
        almostLegendaryFumbles: 1
      },
      bestWine: {
        batchId: "profile_best",
        qualityLevel: "legendary",
        score: 94
      },
      worstShame: {
        batchId: "profile_worst",
        moment: "screw_cap_criminal",
        score: 12
      },
      preservedVintagesCount: 1,
      pendingPreserveCount: 0
    });
    expect(response.json().publicCellar).toHaveLength(2);
    await server.close();
  });
});
