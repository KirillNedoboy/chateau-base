import type { ApiPrismaClient } from "../../plugins/prisma.js";
import { createHttpError, normalizeWalletAddress } from "../wallet/service.js";

const DB_QUALITY_TO_APP = {
  COMMON: "common",
  GOOD: "good",
  PREMIUM: "premium",
  GRAND_CRU: "grand_cru",
  LEGENDARY: "legendary"
} as const satisfies Record<string, string>;

type ProfileBatch = {
  id: string;
  seasonKey: string;
  qualityLevel: string;
  qualityScore: number;
  preservedOnchain: boolean;
  preserveTxHash: string | null;
  primaryMoment: string | null;
  label: unknown;
  createdAt: Date;
};

export type PublicChateauProfile = {
  walletAddress: string;
  shortWallet: string;
  basedWinemaker: boolean;
  genesisHarvest: {
    totalBatches: number;
    premium: number;
    grandCru: number;
    legendary: number;
    almostLegendaryFumbles: number;
  };
  bestWine: {
    batchId: string;
    labelName: string;
    qualityLevel: string;
    score: number;
  } | null;
  worstShame: {
    batchId: string;
    moment: string | null;
    score: number;
  } | null;
  preservedVintagesCount: number;
  pendingPreserveCount: number;
  publicCellar: Array<{
    batchId: string;
    labelName: string;
    qualityLevel: string;
    score: number;
    preservedOnchain: boolean;
    preserveStatus: "none" | "pending" | "confirmed";
    primaryMoment: string | null;
  }>;
};

function mapQuality(qualityLevel: string): string {
  return Object.prototype.hasOwnProperty.call(DB_QUALITY_TO_APP, qualityLevel)
    ? DB_QUALITY_TO_APP[qualityLevel as keyof typeof DB_QUALITY_TO_APP]
    : qualityLevel.toLowerCase();
}

function shortWallet(walletAddress: string): string {
  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
}

function getLabelName(label: unknown): string {
  if (typeof label === "object" && label !== null && !Array.isArray(label)) {
    const maybeName = (label as { name?: unknown }).name;
    if (typeof maybeName === "string" && maybeName.length > 0) {
      return maybeName;
    }
  }
  return "Chateau Base Vintage";
}

function selectBestWine(batches: ProfileBatch[]): ProfileBatch | null {
  return [...batches].sort(
    (left, right) => right.qualityScore - left.qualityScore
  )[0] ?? null;
}

function selectWorstShame(batches: ProfileBatch[]): ProfileBatch | null {
  const shameBatches = batches.filter((batch) => batch.primaryMoment !== null);
  return [...(shameBatches.length > 0 ? shameBatches : batches)].sort(
    (left, right) => left.qualityScore - right.qualityScore
  )[0] ?? null;
}

function getPreserveStatus(
  batch: Pick<ProfileBatch, "preservedOnchain" | "preserveTxHash">
): "none" | "pending" | "confirmed" {
  if (batch.preservedOnchain) {
    return "confirmed";
  }
  if (batch.preserveTxHash) {
    return "pending";
  }
  return "none";
}

export async function getPublicChateauProfile(
  prisma: ApiPrismaClient,
  walletAddress: string
): Promise<PublicChateauProfile> {
  const normalizedWallet = normalizeWalletAddress(walletAddress);
  const user = await prisma.user.findUnique({
    where: { walletAddress: normalizedWallet }
  });

  if (!user) {
    throw createHttpError(404, "Chateau profile not found");
  }

  const batches = await prisma.wineBatch.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  });
  const profileBatches = batches as ProfileBatch[];
  const genesisBatches = profileBatches.filter(
    (batch) => batch.seasonKey === "GENESIS_HARVEST"
  );
  const preservedVintagesCount = profileBatches.filter(
    (batch) => batch.preservedOnchain
  ).length;
  const pendingPreserveCount = profileBatches.filter(
    (batch) => getPreserveStatus(batch) === "pending"
  ).length;
  const bestWine = selectBestWine(profileBatches);
  const worstShame = selectWorstShame(profileBatches);

  return {
    walletAddress: normalizedWallet,
    shortWallet: shortWallet(normalizedWallet),
    basedWinemaker: user.baseProfileLinked || preservedVintagesCount > 0,
    genesisHarvest: {
      totalBatches: genesisBatches.length,
      premium: genesisBatches.filter((batch) => batch.qualityLevel === "PREMIUM")
        .length,
      grandCru: genesisBatches.filter((batch) => batch.qualityLevel === "GRAND_CRU")
        .length,
      legendary: genesisBatches.filter((batch) => batch.qualityLevel === "LEGENDARY")
        .length,
      almostLegendaryFumbles: genesisBatches.filter(
        (batch) => batch.primaryMoment === "almost_legendary"
      ).length
    },
    bestWine: bestWine
      ? {
          batchId: bestWine.id,
          labelName: getLabelName(bestWine.label),
          qualityLevel: mapQuality(bestWine.qualityLevel),
          score: bestWine.qualityScore
        }
      : null,
    worstShame: worstShame
      ? {
          batchId: worstShame.id,
          moment: worstShame.primaryMoment,
          score: worstShame.qualityScore
        }
      : null,
    preservedVintagesCount,
    pendingPreserveCount,
    publicCellar: profileBatches.slice(0, 10).map((batch) => ({
      batchId: batch.id,
      labelName: getLabelName(batch.label),
      qualityLevel: mapQuality(batch.qualityLevel),
      score: batch.qualityScore,
      preservedOnchain: batch.preservedOnchain,
      preserveStatus: getPreserveStatus(batch),
      primaryMoment: batch.primaryMoment
    }))
  };
}
