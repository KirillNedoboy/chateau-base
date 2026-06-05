import { Prisma } from "@prisma/client";
import type { ApiPrismaClient } from "../../plugins/prisma.js";
import {
  getChateauCellarAddress,
  isSupportedBaseChainId,
  type SupportedBaseChainId
} from "../base/config.js";
import { createHttpError, normalizeWalletAddress } from "../wallet/service.js";

const TX_HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/;

const QUALITY_TO_CONTRACT_LEVEL = {
  COMMON: 1,
  GOOD: 2,
  PREMIUM: 3,
  GRAND_CRU: 4,
  LEGENDARY: 5
} as const satisfies Record<string, number>;

const DB_ENUM_TO_APP = {
  GENESIS_HARVEST: "genesis_harvest",
  TUSCANY: "tuscany",
  BORDEAUX: "bordeaux",
  NAPA: "napa",
  GEORGIA_QVEVRI: "georgia_qvevri",
  CHAMPAGNE: "champagne",
  COMMON: "common",
  GOOD: "good",
  PREMIUM: "premium",
  GRAND_CRU: "grand_cru",
  LEGENDARY: "legendary"
} as const satisfies Record<string, string>;

type PreserveBatch = {
  id: string;
  userId: string;
  batchHash: string;
  metadataUri: string | null;
  onchainEligible: boolean;
  preservedOnchain: boolean;
  preserveTxHash: string | null;
  preserveChainId: number | null;
  preservedAt: Date | null;
  qualityLevel: string;
  qualityScore: number;
  primaryMoment: string | null;
  seasonKey: string;
};

type PreservePrismaClient = Pick<ApiPrismaClient, "user" | "wineBatch" | "onchainEvent">;

export type PreservePreparePayload = {
  contractAddress: string;
  chainId: number;
  batchId: string;
  batchHash: string;
  metadataUri: string;
  qualityLevel: number;
  primaryMoment: string;
  seasonKey: string;
  score: number;
};

export type PreserveConfirmResult = {
  batchId: string;
  preserveStatus: "pending" | "confirmed";
  preservedOnchain: boolean;
  preserveTxHash: string;
  preserveChainId: number;
  preservedAt: string | null;
  onchainEventId: string | null;
};

function mapDbEnum(value: string): string {
  return Object.prototype.hasOwnProperty.call(DB_ENUM_TO_APP, value)
    ? DB_ENUM_TO_APP[value as keyof typeof DB_ENUM_TO_APP]
    : value.toLowerCase();
}

function validateTxHash(txHash: string): string {
  const normalized = txHash.trim().toLowerCase();
  if (!TX_HASH_PATTERN.test(normalized)) {
    throw createHttpError(400, "Invalid transaction hash");
  }
  return normalized;
}

function assertSupportedChain(chainId: number): asserts chainId is SupportedBaseChainId {
  if (!isSupportedBaseChainId(chainId)) {
    throw createHttpError(400, "Unsupported Base chain");
  }
}

async function getLinkedUser(
  prisma: PreservePrismaClient,
  userId: string,
  chainId: SupportedBaseChainId
) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw createHttpError(404, "User not found");
  }
  if (!user.walletAddress || !user.baseProfileLinked) {
    throw createHttpError(400, "Wallet is not linked");
  }
  if (user.chainId !== chainId) {
    throw createHttpError(400, "Wallet is linked to a different Base chain");
  }

  return {
    ...user,
    walletAddress: normalizeWalletAddress(user.walletAddress)
  };
}

async function getOwnedBatch(
  prisma: PreservePrismaClient,
  userId: string,
  batchId: string
): Promise<PreserveBatch> {
  const batch = await prisma.wineBatch.findUnique({
    where: { id: batchId }
  });

  if (!batch || batch.userId !== userId) {
    throw createHttpError(404, "WineBatch not found");
  }

  return batch;
}

function buildPreparePayload(
  batch: PreserveBatch,
  chainId: SupportedBaseChainId
): PreservePreparePayload {
  if (!batch.onchainEligible) {
    throw createHttpError(400, "WineBatch is not preserve eligible");
  }
  if (!batch.metadataUri) {
    throw createHttpError(400, "WineBatch metadata URI is missing");
  }
  const contractAddress = getChateauCellarAddress(chainId);
  if (!contractAddress) {
    throw createHttpError(
      500,
      "ChateauCellar contract address is not configured"
    );
  }

  return {
    contractAddress,
    chainId,
    batchId: batch.id,
    batchHash: batch.batchHash,
    metadataUri: batch.metadataUri,
    qualityLevel: Object.prototype.hasOwnProperty.call(
      QUALITY_TO_CONTRACT_LEVEL,
      batch.qualityLevel
    )
      ? QUALITY_TO_CONTRACT_LEVEL[
          batch.qualityLevel as keyof typeof QUALITY_TO_CONTRACT_LEVEL
        ]
      : 1,
    primaryMoment: batch.primaryMoment ?? "",
    seasonKey: mapDbEnum(batch.seasonKey),
    score: batch.qualityScore
  };
}

export async function preparePreserve({
  prisma,
  userId,
  batchId,
  chainId
}: {
  prisma: ApiPrismaClient;
  userId: string;
  batchId: string;
  chainId: number;
}): Promise<PreservePreparePayload> {
  assertSupportedChain(chainId);
  await getLinkedUser(prisma, userId, chainId);
  const batch = await getOwnedBatch(prisma, userId, batchId);
  return buildPreparePayload(batch, chainId);
}

function serializeConfirmResult(
  batch: PreserveBatch,
  onchainEventId: string | null
): PreserveConfirmResult {
  if (!batch.preserveTxHash || !batch.preserveChainId) {
    throw createHttpError(500, "Preserve state was not recorded");
  }

  return {
    batchId: batch.id,
    preserveStatus: batch.preservedOnchain ? "confirmed" : "pending",
    preservedOnchain: batch.preservedOnchain,
    preserveTxHash: batch.preserveTxHash,
    preserveChainId: batch.preserveChainId,
    preservedAt: batch.preservedAt?.toISOString() ?? null,
    onchainEventId
  };
}

function isUniqueConstraintError(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    typeof (error as { code?: unknown }).code === "string" &&
    (error as { code?: string }).code === "P2002"
  );
}

export async function confirmPreserve({
  prisma,
  userId,
  batchId,
  chainId,
  txHash
}: {
  prisma: ApiPrismaClient;
  userId: string;
  batchId: string;
  chainId: number;
  txHash: string;
}): Promise<PreserveConfirmResult> {
  assertSupportedChain(chainId);
  const normalizedTxHash = validateTxHash(txHash);

  return prisma.$transaction(async (tx) => {
    const user = await getLinkedUser(tx, userId, chainId);
    const batch = await getOwnedBatch(tx, userId, batchId);
    const payload = buildPreparePayload(batch, chainId);

    if (batch.preserveTxHash) {
      if (batch.preserveTxHash !== normalizedTxHash || batch.preserveChainId !== chainId) {
        throw createHttpError(409, "WineBatch already has another preserve transaction");
      }
      const existingEvent = await tx.onchainEvent.findUnique({
        where: {
          chainId_txHash: {
            chainId,
            txHash: normalizedTxHash
          }
        }
      });
      return serializeConfirmResult(batch, existingEvent?.id ?? null);
    }

    const existingEvent = await tx.onchainEvent.findUnique({
      where: {
        chainId_txHash: {
          chainId,
          txHash: normalizedTxHash
        }
      }
    });

    if (existingEvent) {
      if (existingEvent.batchId !== batchId || existingEvent.userId !== userId) {
        throw createHttpError(409, "Transaction hash is already recorded");
      }
      const updatedExisting = await tx.wineBatch.update({
        where: { id: batchId },
        data: {
          preserveTxHash: normalizedTxHash,
          preserveChainId: chainId,
          preservedAt: null
        }
      });
      return serializeConfirmResult(updatedExisting, existingEvent.id);
    }

    const guardedUpdate = await tx.wineBatch.updateMany({
      where: {
        id: batchId,
        userId,
        onchainEligible: true,
        preservedOnchain: false,
        preserveTxHash: null
      },
      data: {
        preserveTxHash: normalizedTxHash,
        preserveChainId: chainId,
        preservedAt: null
      }
    });

    if (guardedUpdate.count !== 1) {
      const refetched = await getOwnedBatch(tx, userId, batchId);
      if (refetched.preservedOnchain) {
        if (
          refetched.preserveTxHash === normalizedTxHash &&
          refetched.preserveChainId === chainId
        ) {
          return serializeConfirmResult(refetched, null);
        }
        throw createHttpError(409, "WineBatch already has another preserve transaction");
      }
      if (
        refetched.preserveTxHash === normalizedTxHash &&
        refetched.preserveChainId === chainId
      ) {
        return serializeConfirmResult(refetched, null);
      }
      if (refetched.preserveTxHash) {
        throw createHttpError(409, "WineBatch already has another preserve transaction");
      }
      throw createHttpError(400, "WineBatch is not preserve eligible");
    }

    let event;
    try {
      event = await tx.onchainEvent.create({
        data: {
          userId,
          walletAddress: user.walletAddress,
          chainId,
          contractAddress: payload.contractAddress,
          eventType: "VINTAGE_PRESERVED",
          txHash: normalizedTxHash,
          blockNumber: BigInt(0),
          batchId,
          challengeId: null,
          status: "PENDING",
          rawPayload: {
            ...payload,
            txHash: normalizedTxHash
          } as Prisma.InputJsonObject,
          confirmedAt: null
        }
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
      const duplicate = await tx.onchainEvent.findUnique({
        where: {
          chainId_txHash: {
            chainId,
            txHash: normalizedTxHash
          }
        }
      });
      if (!duplicate || duplicate.batchId !== batchId || duplicate.userId !== userId) {
        throw createHttpError(409, "Transaction hash is already recorded");
      }
      event = duplicate;
    }

    const updated = await getOwnedBatch(tx, userId, batchId);
    return serializeConfirmResult(updated, event.id);
  });
}
