import { beforeEach, describe, expect, it } from "vitest";
import { buildServer } from "../src/server.js";
import {
  createTestPrisma,
  type TestDbState
} from "./helpers/createTestPrisma.js";

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

function seedWineBatch(
  state: TestDbState,
  userId: string,
  overrides: Partial<TestDbState["wineBatches"][number]> = {}
) {
  const now = new Date("2026-01-02T00:00:00.000Z");
  const batch: TestDbState["wineBatches"][number] = {
    id: "batch_plan014",
    userId,
    seasonId: "season_genesis",
    seasonKey: "GENESIS_HARVEST",
    gameConfigVersion: "mvp-0.1.0",
    batchHash: "0xplan014",
    metadataUri: "chateau://metadata/0xplan014",
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

function sharePayload(userId: string, batchId: string, idempotencyKey = "share_key_1") {
  return {
    userId,
    batchId,
    type: "wine_result",
    mode: "degen",
    idempotencyKey,
    payload: {
      qualityScore: 1,
      qualityLevel: "common",
      salePrice: 1
    }
  };
}

async function createShareAndOpenChallenge({
  server,
  state,
  inviterUserId
}: {
  server: ReturnType<typeof buildServer>;
  state: TestDbState;
  inviterUserId: string;
}) {
  const inviterBatch = seedWineBatch(state, inviterUserId, {
    id: `inviter_batch_${state.wineBatches.length + 1}`,
    batchHash: `0xinviter${state.wineBatches.length + 1}`,
    qualityScore: 88
  });
  const share = await server.inject({
    method: "POST",
    url: "/api/share",
    payload: sharePayload(inviterUserId, inviterBatch.id, `share_${inviterBatch.id}`)
  });
  expect(share.statusCode).toBe(200);
  const opened = await server.inject({
    method: "POST",
    url: "/api/challenge/open",
    payload: {
      shareId: share.json().id
    }
  });
  expect(opened.statusCode).toBe(200);
  return {
    inviterBatch,
    share: share.json(),
    challenge: opened.json()
  };
}

describe("Plan 014 share and challenge API", () => {
  let state: TestDbState;
  let prismaLike: unknown;

  beforeEach(() => {
    const testDb = createTestPrisma();
    state = testDb.state;
    prismaLike = testDb.prismaLike;
  });

  it("creates a wine share from backend WineBatch data and ignores client score", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_share_batch");
    const batch = seedWineBatch(state, userId);

    const response = await server.inject({
      method: "POST",
      url: "/api/share",
      payload: sharePayload(userId, batch.id)
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      userId,
      batchId: batch.id,
      type: "wine_result",
      mode: "degen",
      deeplinkUrl: expect.stringMatching(/^\/s\/.+/)
    });
    expect(response.json().payload).toMatchObject({
      batchId: batch.id,
      qualityScore: 88,
      qualityLevel: "grand_cru",
      salePrice: 620,
      bottleCount: 3
    });
    expect(response.json().payload.qualityScore).not.toBe(1);
    await server.close();
  });

  it("does not duplicate ShareObject rows for a repeated idempotencyKey", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_share_idempotent");
    const batch = seedWineBatch(state, userId);
    const payload = sharePayload(userId, batch.id, "same_share_key");

    const first = await server.inject({
      method: "POST",
      url: "/api/share",
      payload
    });
    const second = await server.inject({
      method: "POST",
      url: "/api/share",
      payload
    });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(first.json().id).toBe(second.json().id);
    expect((state as TestDbState & { shareObjects: unknown[] }).shareObjects).toHaveLength(1);
    await server.close();
  });

  it("does not leave a duplicateable ShareObject when analytics fails after share create", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_share_analytics_failure");
    const batch = seedWineBatch(state, userId);
    const failingState = state as TestDbState & {
      beforeNextGameEventCreate?: (() => void) | null;
    };
    failingState.beforeNextGameEventCreate = () => {
      throw new Error("simulated analytics write failure");
    };
    const payload = sharePayload(userId, batch.id, "share_analytics_failure");

    const failed = await server.inject({
      method: "POST",
      url: "/api/share",
      payload
    });
    const retried = await server.inject({
      method: "POST",
      url: "/api/share",
      payload
    });

    expect(failed.statusCode).toBe(500);
    expect(retried.statusCode).toBe(200);
    expect(state.shareObjects).toHaveLength(1);
    expect(state.gameActionLogs).toHaveLength(1);
    await server.close();
  });

  it("returns a stable share object by shareId", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_share_get");
    const batch = seedWineBatch(state, userId);
    const created = await server.inject({
      method: "POST",
      url: "/api/share",
      payload: sharePayload(userId, batch.id)
    });

    const response = await server.inject({
      method: "GET",
      url: `/api/s/${created.json().id}`
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(created.json());
    await server.close();
  });

  it("returns 404 for an invalid shareId", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });

    const response = await server.inject({
      method: "GET",
      url: "/api/s/missing_share"
    });

    expect(response.statusCode).toBe(404);
    await server.close();
  });

  it("challenge/open creates attribution for a share link", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_challenge_open");
    const batch = seedWineBatch(state, userId);
    const share = await server.inject({
      method: "POST",
      url: "/api/share",
      payload: sharePayload(userId, batch.id)
    });

    const response = await server.inject({
      method: "POST",
      url: "/api/challenge/open",
      payload: {
        shareId: share.json().id
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      inviterUserId: userId,
      invitedUserId: null,
      sourceShareId: share.json().id,
      sourceBatchId: batch.id,
      status: "opened",
      inviterScore: 88,
      invitedScore: null
    });
    await server.close();
  });

  it("challenge/open returns the same attribution for repeated opens", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_challenge_open_repeated");
    const batch = seedWineBatch(state, userId);
    const share = await server.inject({
      method: "POST",
      url: "/api/share",
      payload: sharePayload(userId, batch.id)
    });

    const first = await server.inject({
      method: "POST",
      url: "/api/challenge/open",
      payload: {
        shareId: share.json().id
      }
    });
    const second = await server.inject({
      method: "POST",
      url: "/api/challenge/open",
      payload: {
        shareId: share.json().id
      }
    });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(first.json().id).toBe(second.json().id);
    expect(state.referralChallenges).toHaveLength(1);
    await server.close();
  });

  it("challenge/open recovers from duplicate sourceShareId create conflict", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const userId = await startSession(server, "tg_challenge_open_conflict");
    const batch = seedWineBatch(state, userId);
    const share = await server.inject({
      method: "POST",
      url: "/api/share",
      payload: sharePayload(userId, batch.id)
    });
    const conflictState = state as TestDbState & {
      beforeNextReferralChallengeCreate?: (() => void) | null;
    };
    conflictState.beforeNextReferralChallengeCreate = () => {
      state.referralChallenges.push({
        id: "challenge_race_existing",
        inviterUserId: userId,
        invitedUserId: null,
        sourceShareId: share.json().id,
        sourceBatchId: batch.id,
        status: "OPENED",
        inviterScore: 88,
        invitedScore: null,
        createdAt: new Date("2026-01-03T00:00:00.000Z"),
        completedAt: null
      });
    };

    const response = await server.inject({
      method: "POST",
      url: "/api/challenge/open",
      payload: {
        shareId: share.json().id
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().id).toBe("challenge_race_existing");
    expect(state.referralChallenges).toHaveLength(1);
    await server.close();
  });

  it("challenge/start attaches the invited user", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const inviterUserId = await startSession(server, "tg_challenge_start_inviter");
    const invitedUserId = await startSession(server, "tg_challenge_start_invited");
    const batch = seedWineBatch(state, inviterUserId);
    const share = await server.inject({
      method: "POST",
      url: "/api/share",
      payload: sharePayload(inviterUserId, batch.id)
    });
    const opened = await server.inject({
      method: "POST",
      url: "/api/challenge/open",
      payload: {
        shareId: share.json().id
      }
    });

    const response = await server.inject({
      method: "POST",
      url: "/api/challenge/start",
      payload: {
        challengeId: opened.json().id,
        invitedUserId
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: opened.json().id,
      invitedUserId,
      status: "started"
    });
    await server.close();
  });

  it("different invited user cannot take over an existing started challenge", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const inviterUserId = await startSession(server, "tg_challenge_takeover_inviter");
    const invitedUserId = await startSession(server, "tg_challenge_takeover_invited");
    const otherUserId = await startSession(server, "tg_challenge_takeover_other");
    const { challenge } = await createShareAndOpenChallenge({
      server,
      state,
      inviterUserId
    });
    const firstStart = await server.inject({
      method: "POST",
      url: "/api/challenge/start",
      payload: {
        challengeId: challenge.id,
        invitedUserId
      }
    });

    const takeover = await server.inject({
      method: "POST",
      url: "/api/challenge/start",
      payload: {
        challengeId: challenge.id,
        invitedUserId: otherUserId
      }
    });

    expect(firstStart.statusCode).toBe(200);
    expect(takeover.statusCode).toBe(409);
    expect(state.referralChallenges[0]?.invitedUserId).toBe(invitedUserId);
    expect(state.referralChallenges[0]?.status).toBe("STARTED");
    await server.close();
  });

  it("simulated complete between start read and update cannot regress terminal status", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const inviterUserId = await startSession(server, "tg_challenge_start_race_inviter");
    const invitedUserId = await startSession(server, "tg_challenge_start_race_invited");
    const { challenge } = await createShareAndOpenChallenge({
      server,
      state,
      inviterUserId
    });
    const completedAt = new Date("2026-01-04T00:00:00.000Z");
    state.beforeNextReferralChallengeUpdate = () => {
      const row = state.referralChallenges.find((entry) => entry.id === challenge.id);
      if (!row) {
        throw new Error("Expected challenge row for race simulation");
      }
      row.invitedUserId = invitedUserId;
      row.status = "BEAT_SCORE";
      row.inviterScore = 88;
      row.invitedScore = 91;
      row.completedAt = completedAt;
    };

    const response = await server.inject({
      method: "POST",
      url: "/api/challenge/start",
      payload: {
        challengeId: challenge.id,
        invitedUserId
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      invitedUserId,
      status: "beat_score",
      inviterScore: 88,
      invitedScore: 91,
      completedAt: completedAt.toISOString()
    });
    expect(state.referralChallenges[0]?.status).toBe("BEAT_SCORE");
    await server.close();
  });

  it("different invited user cannot overwrite invitedUserId changed during start", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const inviterUserId = await startSession(server, "tg_challenge_start_race_owner_inviter");
    const invitedUserId = await startSession(server, "tg_challenge_start_race_owner_invited");
    const otherUserId = await startSession(server, "tg_challenge_start_race_owner_other");
    const { challenge } = await createShareAndOpenChallenge({
      server,
      state,
      inviterUserId
    });
    state.beforeNextReferralChallengeUpdate = () => {
      const row = state.referralChallenges.find((entry) => entry.id === challenge.id);
      if (!row) {
        throw new Error("Expected challenge row for owner simulation");
      }
      row.invitedUserId = otherUserId;
      row.status = "STARTED";
    };

    const response = await server.inject({
      method: "POST",
      url: "/api/challenge/start",
      payload: {
        challengeId: challenge.id,
        invitedUserId
      }
    });

    expect(response.statusCode).toBe(409);
    expect(state.referralChallenges[0]?.invitedUserId).toBe(otherUserId);
    expect(state.referralChallenges[0]?.status).toBe("STARTED");
    await server.close();
  });

  it("same invited user start is idempotent", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const inviterUserId = await startSession(server, "tg_challenge_start_same_inviter");
    const invitedUserId = await startSession(server, "tg_challenge_start_same_invited");
    const { challenge } = await createShareAndOpenChallenge({
      server,
      state,
      inviterUserId
    });

    const first = await server.inject({
      method: "POST",
      url: "/api/challenge/start",
      payload: {
        challengeId: challenge.id,
        invitedUserId
      }
    });
    const second = await server.inject({
      method: "POST",
      url: "/api/challenge/start",
      payload: {
        challengeId: challenge.id,
        invitedUserId
      }
    });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(second.json()).toEqual(first.json());
    expect(
      state.gameEvents.filter((event) => event.name === "challenge_started")
    ).toHaveLength(1);
    await server.close();
  });

  it("challenge/complete records beat_score when invitedScore beats inviterScore", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const inviterUserId = await startSession(server, "tg_challenge_beat_inviter");
    const invitedUserId = await startSession(server, "tg_challenge_beat_invited");
    const inviterBatch = seedWineBatch(state, inviterUserId, {
      id: "inviter_batch",
      qualityScore: 88
    });
    const invitedBatch = seedWineBatch(state, invitedUserId, {
      id: "invited_batch",
      batchHash: "0xinvited",
      qualityScore: 91
    });
    const share = await server.inject({
      method: "POST",
      url: "/api/share",
      payload: sharePayload(inviterUserId, inviterBatch.id)
    });
    const opened = await server.inject({
      method: "POST",
      url: "/api/challenge/open",
      payload: {
        shareId: share.json().id
      }
    });
    await server.inject({
      method: "POST",
      url: "/api/challenge/start",
      payload: {
        challengeId: opened.json().id,
        invitedUserId
      }
    });

    const response = await server.inject({
      method: "POST",
      url: "/api/challenge/complete",
      payload: {
        challengeId: opened.json().id,
        invitedUserId,
        invitedBatchId: invitedBatch.id
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "beat_score",
      inviterScore: 88,
      invitedScore: 91
    });
    expect(state.onchainEvents).toEqual([]);
    await server.close();
  });

  it("concurrent stale complete cannot overwrite terminal result", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const inviterUserId = await startSession(server, "tg_challenge_complete_race_inviter");
    const invitedUserId = await startSession(server, "tg_challenge_complete_race_invited");
    const otherUserId = await startSession(server, "tg_challenge_complete_race_other");
    const { challenge } = await createShareAndOpenChallenge({
      server,
      state,
      inviterUserId
    });
    const otherBatch = seedWineBatch(state, otherUserId, {
      id: "race_other_batch",
      batchHash: "0xraceother",
      qualityScore: 40
    });
    const completedAt = new Date("2026-01-05T00:00:00.000Z");
    state.beforeNextReferralChallengeUpdate = () => {
      const row = state.referralChallenges.find((entry) => entry.id === challenge.id);
      if (!row) {
        throw new Error("Expected challenge row for complete race simulation");
      }
      row.invitedUserId = invitedUserId;
      row.status = "BEAT_SCORE";
      row.inviterScore = 88;
      row.invitedScore = 91;
      row.completedAt = completedAt;
    };

    const response = await server.inject({
      method: "POST",
      url: "/api/challenge/complete",
      payload: {
        challengeId: challenge.id,
        invitedUserId: otherUserId,
        invitedBatchId: otherBatch.id
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      invitedUserId,
      status: "beat_score",
      inviterScore: 88,
      invitedScore: 91,
      completedAt: completedAt.toISOString()
    });
    expect(state.referralChallenges[0]?.invitedUserId).toBe(invitedUserId);
    expect(state.referralChallenges[0]?.status).toBe("BEAT_SCORE");
    expect(state.referralChallenges[0]?.invitedScore).toBe(91);
    await server.close();
  });

  it("different invited user complete cannot take over an attached challenge", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const inviterUserId = await startSession(server, "tg_challenge_complete_takeover_inviter");
    const invitedUserId = await startSession(server, "tg_challenge_complete_takeover_invited");
    const otherUserId = await startSession(server, "tg_challenge_complete_takeover_other");
    const { challenge } = await createShareAndOpenChallenge({
      server,
      state,
      inviterUserId
    });
    const otherBatch = seedWineBatch(state, otherUserId, {
      id: "complete_takeover_other_batch",
      batchHash: "0xcompletetakeoverother",
      qualityScore: 91
    });
    await server.inject({
      method: "POST",
      url: "/api/challenge/start",
      payload: {
        challengeId: challenge.id,
        invitedUserId
      }
    });

    const response = await server.inject({
      method: "POST",
      url: "/api/challenge/complete",
      payload: {
        challengeId: challenge.id,
        invitedUserId: otherUserId,
        invitedBatchId: otherBatch.id
      }
    });

    expect(response.statusCode).toBe(409);
    expect(state.referralChallenges[0]?.invitedUserId).toBe(invitedUserId);
    expect(state.referralChallenges[0]?.status).toBe("STARTED");
    await server.close();
  });

  it("repeated same invited user complete does not change scores status or completedAt", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const inviterUserId = await startSession(server, "tg_challenge_complete_repeat_inviter");
    const invitedUserId = await startSession(server, "tg_challenge_complete_repeat_invited");
    const { challenge } = await createShareAndOpenChallenge({
      server,
      state,
      inviterUserId
    });
    const firstBatch = seedWineBatch(state, invitedUserId, {
      id: "complete_repeat_first_batch",
      batchHash: "0xcompleterepeatfirst",
      qualityScore: 91
    });
    const secondBatch = seedWineBatch(state, invitedUserId, {
      id: "complete_repeat_second_batch",
      batchHash: "0xcompleterepeatsecond",
      qualityScore: 40
    });

    const first = await server.inject({
      method: "POST",
      url: "/api/challenge/complete",
      payload: {
        challengeId: challenge.id,
        invitedUserId,
        invitedBatchId: firstBatch.id
      }
    });
    const completedAt = state.referralChallenges[0]?.completedAt;
    const second = await server.inject({
      method: "POST",
      url: "/api/challenge/complete",
      payload: {
        challengeId: challenge.id,
        invitedUserId,
        invitedBatchId: secondBatch.id
      }
    });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(second.json()).toEqual(first.json());
    expect(state.referralChallenges[0]?.status).toBe("BEAT_SCORE");
    expect(state.referralChallenges[0]?.invitedScore).toBe(91);
    expect(state.referralChallenges[0]?.completedAt).toBe(completedAt);
    await server.close();
  });

  it("start after completion does not regress terminal challenge status", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const inviterUserId = await startSession(server, "tg_challenge_start_terminal_inviter");
    const invitedUserId = await startSession(server, "tg_challenge_start_terminal_invited");
    const { challenge } = await createShareAndOpenChallenge({
      server,
      state,
      inviterUserId
    });
    const invitedBatch = seedWineBatch(state, invitedUserId, {
      id: "terminal_invited_batch",
      batchHash: "0xterminalinvited",
      qualityScore: 91
    });
    await server.inject({
      method: "POST",
      url: "/api/challenge/complete",
      payload: {
        challengeId: challenge.id,
        invitedUserId,
        invitedBatchId: invitedBatch.id
      }
    });

    const response = await server.inject({
      method: "POST",
      url: "/api/challenge/start",
      payload: {
        challengeId: challenge.id,
        invitedUserId
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      invitedUserId,
      status: "beat_score",
      inviterScore: 88,
      invitedScore: 91
    });
    expect(state.referralChallenges[0]?.status).toBe("BEAT_SCORE");
    await server.close();
  });

  it("complete after completion does not overwrite terminal challenge result", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const inviterUserId = await startSession(server, "tg_challenge_complete_terminal_inviter");
    const invitedUserId = await startSession(server, "tg_challenge_complete_terminal_invited");
    const otherUserId = await startSession(server, "tg_challenge_complete_terminal_other");
    const { challenge } = await createShareAndOpenChallenge({
      server,
      state,
      inviterUserId
    });
    const invitedBatch = seedWineBatch(state, invitedUserId, {
      id: "terminal_first_batch",
      batchHash: "0xterminalfirst",
      qualityScore: 91
    });
    const otherBatch = seedWineBatch(state, otherUserId, {
      id: "terminal_other_batch",
      batchHash: "0xterminalother",
      qualityScore: 40
    });
    const first = await server.inject({
      method: "POST",
      url: "/api/challenge/complete",
      payload: {
        challengeId: challenge.id,
        invitedUserId,
        invitedBatchId: invitedBatch.id
      }
    });

    const second = await server.inject({
      method: "POST",
      url: "/api/challenge/complete",
      payload: {
        challengeId: challenge.id,
        invitedUserId: otherUserId,
        invitedBatchId: otherBatch.id
      }
    });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(second.json()).toMatchObject({
      invitedUserId,
      status: "beat_score",
      invitedScore: 91
    });
    expect(state.referralChallenges[0]?.invitedUserId).toBe(invitedUserId);
    expect(state.referralChallenges[0]?.status).toBe("BEAT_SCORE");
    expect(state.referralChallenges[0]?.invitedScore).toBe(91);
    await server.close();
  });

  it("same invited user repeated complete returns the existing terminal result", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const inviterUserId = await startSession(server, "tg_challenge_repeat_inviter");
    const invitedUserId = await startSession(server, "tg_challenge_repeat_invited");
    const { challenge } = await createShareAndOpenChallenge({
      server,
      state,
      inviterUserId
    });
    const invitedBatch = seedWineBatch(state, invitedUserId, {
      id: "repeat_invited_batch",
      batchHash: "0xrepeatinvited",
      qualityScore: 91
    });

    const first = await server.inject({
      method: "POST",
      url: "/api/challenge/complete",
      payload: {
        challengeId: challenge.id,
        invitedUserId,
        invitedBatchId: invitedBatch.id
      }
    });
    const second = await server.inject({
      method: "POST",
      url: "/api/challenge/complete",
      payload: {
        challengeId: challenge.id,
        invitedUserId,
        invitedBatchId: invitedBatch.id
      }
    });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(second.json()).toEqual(first.json());
    expect(state.referralChallenges).toHaveLength(1);
    await server.close();
  });

  it("challenge/complete records failed when invitedScore does not beat inviterScore", async () => {
    const server = buildServer({ logger: false, prisma: prismaLike });
    const inviterUserId = await startSession(server, "tg_challenge_fail_inviter");
    const invitedUserId = await startSession(server, "tg_challenge_fail_invited");
    const inviterBatch = seedWineBatch(state, inviterUserId, {
      id: "inviter_fail_batch",
      qualityScore: 88
    });
    const invitedBatch = seedWineBatch(state, invitedUserId, {
      id: "invited_fail_batch",
      batchHash: "0xinvitedfail",
      qualityScore: 72
    });
    const share = await server.inject({
      method: "POST",
      url: "/api/share",
      payload: sharePayload(inviterUserId, inviterBatch.id)
    });
    const opened = await server.inject({
      method: "POST",
      url: "/api/challenge/open",
      payload: {
        shareId: share.json().id
      }
    });

    const response = await server.inject({
      method: "POST",
      url: "/api/challenge/complete",
      payload: {
        challengeId: opened.json().id,
        invitedUserId,
        invitedBatchId: invitedBatch.id
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "failed",
      inviterScore: 88,
      invitedScore: 72
    });
    expect(state.onchainEvents).toEqual([]);
    await server.close();
  });
});
