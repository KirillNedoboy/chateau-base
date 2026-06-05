import type { ReferralChallenge, ReferralChallengeStatus } from "@chateau/shared";
import type { ApiPrismaClient } from "../../plugins/prisma.js";

const DB_STATUS_TO_APP = {
  OPENED: "opened",
  STARTED: "started",
  COMPLETED_FIRST_WINE: "completed_first_wine",
  BEAT_SCORE: "beat_score",
  FAILED: "failed"
} as const satisfies Record<string, ReferralChallengeStatus>;

const STATUS_TO_DB = {
  opened: "OPENED",
  started: "STARTED",
  completed_first_wine: "COMPLETED_FIRST_WINE",
  beat_score: "BEAT_SCORE",
  failed: "FAILED"
} as const satisfies Record<ReferralChallengeStatus, string>;

const TERMINAL_STATUS_VALUES = ["BEAT_SCORE", "FAILED"] as const;
const TERMINAL_STATUSES = new Set<string>(TERMINAL_STATUS_VALUES);

function createHttpError(statusCode: number, message: string) {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

function hasOwnKey<T extends object>(object: T, key: PropertyKey): key is keyof T {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function isUniqueConstraintError(error: unknown): error is { code: string } {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  return (error as { code?: unknown }).code === "P2002";
}

function serializeChallenge(challenge: {
  id: string;
  inviterUserId: string;
  invitedUserId: string | null;
  sourceShareId: string;
  sourceBatchId: string | null;
  status: string;
  inviterScore: number | null;
  invitedScore: number | null;
  createdAt: Date;
  completedAt: Date | null;
}): ReferralChallenge {
  const status = hasOwnKey(DB_STATUS_TO_APP, challenge.status)
    ? DB_STATUS_TO_APP[challenge.status]
    : "opened";

  return {
    id: challenge.id,
    inviterUserId: challenge.inviterUserId,
    invitedUserId: challenge.invitedUserId,
    sourceShareId: challenge.sourceShareId,
    sourceBatchId: challenge.sourceBatchId,
    status,
    inviterScore: challenge.inviterScore,
    invitedScore: challenge.invitedScore,
    createdAt: challenge.createdAt.toISOString(),
    completedAt: challenge.completedAt?.toISOString() ?? null
  };
}

async function refetchChallenge(
  prisma: ApiPrismaClient,
  challengeId: string
): Promise<Parameters<typeof serializeChallenge>[0] | null> {
  return prisma.referralChallenge.findUnique({
    where: { id: challengeId }
  });
}

function resolveStartGuardMiss(
  challenge: Parameters<typeof serializeChallenge>[0] | null,
  invitedUserId: string
) {
  if (!challenge) {
    throw createHttpError(404, "ReferralChallenge not found");
  }
  if (TERMINAL_STATUSES.has(challenge.status)) {
    return serializeChallenge(challenge);
  }
  if (challenge.invitedUserId === invitedUserId) {
    return serializeChallenge(challenge);
  }
  if (challenge.invitedUserId !== null) {
    throw createHttpError(409, "Challenge already started by another user");
  }
  throw createHttpError(409, "Challenge state changed before start");
}

function resolveCompleteGuardMiss(
  challenge: Parameters<typeof serializeChallenge>[0] | null,
  invitedUserId: string
) {
  if (!challenge) {
    throw createHttpError(404, "ReferralChallenge not found");
  }
  if (TERMINAL_STATUSES.has(challenge.status)) {
    return serializeChallenge(challenge);
  }
  if (challenge.invitedUserId !== null && challenge.invitedUserId !== invitedUserId) {
    throw createHttpError(409, "Challenge already started by another user");
  }
  throw createHttpError(409, "Challenge state changed before completion");
}

async function getBatchScore(
  prisma: ApiPrismaClient,
  batchId: string | null
): Promise<number | null> {
  if (!batchId) {
    return null;
  }

  const batch = await prisma.wineBatch.findUnique({
    where: { id: batchId }
  });

  return batch?.qualityScore ?? null;
}

export async function openChallenge(prisma: ApiPrismaClient, shareId: string) {
  const share = await prisma.shareObject.findUnique({
    where: { id: shareId }
  });

  if (!share) {
    throw createHttpError(404, "ShareObject not found");
  }

  const inviterScore = await getBatchScore(prisma, share.batchId);
  const existing = await prisma.referralChallenge.findUnique({
    where: { sourceShareId: share.id }
  });

  if (existing) {
    return serializeChallenge(existing);
  }

  let created;
  try {
    created = await prisma.referralChallenge.create({
      data: {
        inviterUserId: share.userId,
        invitedUserId: null,
        sourceShareId: share.id,
        sourceBatchId: share.batchId,
        status: STATUS_TO_DB.opened,
        inviterScore,
        invitedScore: null
      }
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const recovered = await prisma.referralChallenge.findUnique({
      where: { sourceShareId: share.id }
    });
    if (!recovered) {
      throw error;
    }
    return serializeChallenge(recovered);
  }

  await prisma.gameEvent.create({
    data: {
      userId: share.userId,
      sessionId: null,
      name: "challenge_opened",
      payload: {
        challengeId: created.id,
        sourceShareId: share.id,
        sourceBatchId: share.batchId
      }
    }
  });

  return serializeChallenge(created);
}

export async function startChallenge({
  prisma,
  challengeId,
  invitedUserId
}: {
  prisma: ApiPrismaClient;
  challengeId: string;
  invitedUserId: string;
}) {
  const [challenge, invitedUser] = await Promise.all([
    prisma.referralChallenge.findUnique({
      where: { id: challengeId }
    }),
    prisma.user.findUnique({
      where: { id: invitedUserId }
    })
  ]);

  if (!challenge) {
    throw createHttpError(404, "ReferralChallenge not found");
  }
  if (!invitedUser) {
    throw createHttpError(404, "Invited user not found");
  }

  if (TERMINAL_STATUSES.has(challenge.status)) {
    return serializeChallenge(challenge);
  }

  if (challenge.invitedUserId !== null) {
    if (challenge.invitedUserId !== invitedUserId) {
      throw createHttpError(409, "Challenge already started by another user");
    }

    return serializeChallenge(challenge);
  }

  const updatedCount = await prisma.referralChallenge.updateMany({
    where: {
      id: challenge.id,
      status: { notIn: [...TERMINAL_STATUS_VALUES] },
      invitedUserId: null
    },
    data: {
      invitedUserId,
      status: STATUS_TO_DB.started
    }
  });

  if (updatedCount.count === 0) {
    return resolveStartGuardMiss(
      await refetchChallenge(prisma, challenge.id),
      invitedUserId
    );
  }

  const updated = await refetchChallenge(prisma, challenge.id);
  if (!updated) {
    throw createHttpError(404, "ReferralChallenge not found");
  }

  await prisma.gameEvent.create({
    data: {
      userId: invitedUserId,
      sessionId: null,
      name: "challenge_started",
      payload: {
        challengeId: challenge.id,
        sourceShareId: challenge.sourceShareId,
        sourceBatchId: challenge.sourceBatchId
      }
    }
  });

  return serializeChallenge(updated);
}

export async function completeChallenge({
  prisma,
  challengeId,
  invitedUserId,
  invitedBatchId
}: {
  prisma: ApiPrismaClient;
  challengeId: string;
  invitedUserId: string;
  invitedBatchId: string;
}) {
  const [challenge, invitedBatch] = await Promise.all([
    prisma.referralChallenge.findUnique({
      where: { id: challengeId }
    }),
    prisma.wineBatch.findUnique({
      where: { id: invitedBatchId }
    })
  ]);

  if (!challenge) {
    throw createHttpError(404, "ReferralChallenge not found");
  }

  if (TERMINAL_STATUSES.has(challenge.status)) {
    return serializeChallenge(challenge);
  }

  if (challenge.invitedUserId !== null && challenge.invitedUserId !== invitedUserId) {
    throw createHttpError(409, "Challenge already started by another user");
  }

  if (!invitedBatch || invitedBatch.userId !== invitedUserId) {
    throw createHttpError(404, "Invited WineBatch not found");
  }

  const inviterScore =
    challenge.inviterScore ?? (await getBatchScore(prisma, challenge.sourceBatchId));
  if (inviterScore === null) {
    throw createHttpError(409, "Challenge source score unavailable");
  }

  const invitedScore = invitedBatch.qualityScore;
  const status = invitedScore > inviterScore ? "beat_score" : "failed";
  const completedAt = new Date();
  const updatedCount = await prisma.referralChallenge.updateMany({
    where: {
      id: challenge.id,
      status: { notIn: [...TERMINAL_STATUS_VALUES] },
      OR: [{ invitedUserId: null }, { invitedUserId }]
    },
    data: {
      invitedUserId,
      status: STATUS_TO_DB[status],
      inviterScore,
      invitedScore,
      completedAt
    }
  });

  if (updatedCount.count === 0) {
    return resolveCompleteGuardMiss(
      await refetchChallenge(prisma, challenge.id),
      invitedUserId
    );
  }

  const updated = await refetchChallenge(prisma, challenge.id);
  if (!updated) {
    throw createHttpError(404, "ReferralChallenge not found");
  }

  await prisma.gameEvent.create({
    data: {
      userId: invitedUserId,
      sessionId: null,
      name: "challenge_completed",
      payload: {
        challengeId: challenge.id,
        sourceShareId: challenge.sourceShareId,
        sourceBatchId: challenge.sourceBatchId,
        invitedBatchId,
        inviterScore,
        invitedScore,
        status
      }
    }
  });

  return serializeChallenge(updated);
}
