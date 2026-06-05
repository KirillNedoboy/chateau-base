import { randomUUID } from "node:crypto";
import type {
  ShareMode,
  ShareObject,
  ShareObjectType,
  WineQualityLevel
} from "@chateau/shared";
import { Prisma } from "@prisma/client";
import type { ApiPrismaClient } from "../../plugins/prisma.js";
import type { JsonValue } from "../../plugins/zod.js";

const SHARE_TYPE_TO_DB = {
  wine_result: "WINE_RESULT",
  fumble: "FUMBLE",
  achievement: "ACHIEVEMENT",
  challenge: "CHALLENGE",
  coward_meter: "COWARD_METER",
  corkfather: "CORKFATHER",
  legendary: "LEGENDARY"
} as const satisfies Record<ShareObjectType, string>;

const DB_SHARE_TYPE_TO_APP = {
  WINE_RESULT: "wine_result",
  FUMBLE: "fumble",
  ACHIEVEMENT: "achievement",
  CHALLENGE: "challenge",
  COWARD_METER: "coward_meter",
  CORKFATHER: "corkfather",
  LEGENDARY: "legendary"
} as const satisfies Record<string, ShareObjectType>;

const SHARE_MODE_TO_DB = {
  classy: "CLASSY",
  degen: "DEGEN"
} as const satisfies Record<ShareMode, string>;

const DB_SHARE_MODE_TO_APP = {
  CLASSY: "classy",
  DEGEN: "degen"
} as const satisfies Record<string, ShareMode>;

const BATCH_REQUIRED_TYPES = new Set<ShareObjectType>([
  "wine_result",
  "fumble",
  "challenge",
  "corkfather",
  "legendary"
]);

const BATCHLESS_SAFE_TYPES = new Set<ShareObjectType>([
  "achievement",
  "coward_meter"
]);

const DB_QUALITY_TO_APP = {
  COMMON: "common",
  GOOD: "good",
  PREMIUM: "premium",
  GRAND_CRU: "grand_cru",
  LEGENDARY: "legendary"
} as const satisfies Record<string, WineQualityLevel>;

const DB_ENUM_TO_APP = {
  STEEL_TANK: "steel_tank",
  OLD_OAK_BARREL: "old_oak_barrel",
  NEW_OAK_BARREL: "new_oak_barrel",
  NO_AGING: "no_aging",
  SHORT_OLD_OAK_AGING: "short_old_oak_aging",
  NEW_OAK_AGING: "new_oak_aging",
  NEW_TO_OLD_OAK_AGING: "new_to_old_oak_aging",
  SCREW_CAP: "screw_cap",
  CORK: "cork",
  LOW_YIELD: "low_yield",
  BALANCED: "balanced",
  OVERCROPPED: "overcropped"
} as const satisfies Record<string, string>;

type ShareCreateInput = {
  prisma: ApiPrismaClient;
  userId: string;
  batchId: string | null;
  type: ShareObjectType;
  mode: ShareMode;
  payload: Record<string, JsonValue>;
};

export type ApiShareObject = Omit<ShareObject, "payload"> & {
  payload: Record<string, JsonValue>;
};

function createHttpError(statusCode: number, message: string) {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

function hasOwnKey<T extends object>(object: T, key: PropertyKey): key is keyof T {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function toJsonValue(input: unknown): JsonValue {
  if (
    typeof input === "string" ||
    typeof input === "number" ||
    typeof input === "boolean" ||
    input === null
  ) {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map((entry) => toJsonValue(entry));
  }
  if (typeof input === "object" && input !== null) {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [key, toJsonValue(value)])
    );
  }
  return null;
}

function mapDbEnum(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  if (hasOwnKey(DB_ENUM_TO_APP, value)) {
    return DB_ENUM_TO_APP[value];
  }
  return value.toLowerCase();
}

function mapQuality(value: unknown): WineQualityLevel {
  if (typeof value === "string" && hasOwnKey(DB_QUALITY_TO_APP, value)) {
    return DB_QUALITY_TO_APP[value];
  }
  return "common";
}

function formatKey(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

function serializeShareObject(share: {
  id: string;
  userId: string;
  batchId: string | null;
  type: string;
  mode: string;
  title: string;
  subtitle: string;
  body: string;
  imageUrl: string | null;
  deeplinkUrl: string;
  payload: unknown;
  createdAt: Date;
}): ApiShareObject {
  const type = hasOwnKey(DB_SHARE_TYPE_TO_APP, share.type)
    ? DB_SHARE_TYPE_TO_APP[share.type]
    : "wine_result";
  const mode = hasOwnKey(DB_SHARE_MODE_TO_APP, share.mode)
    ? DB_SHARE_MODE_TO_APP[share.mode]
    : "classy";

  return {
    id: share.id,
    userId: share.userId,
    batchId: share.batchId,
    type,
    mode,
    title: share.title,
    subtitle: share.subtitle,
    body: share.body,
    imageUrl: share.imageUrl,
    deeplinkUrl: share.deeplinkUrl,
    payload: toJsonValue(share.payload) as Record<string, JsonValue>,
    createdAt: share.createdAt.toISOString()
  };
}

function buildBatchPayload(batch: {
  id: string;
  userId: string;
  seasonKey: string;
  qualityLevel: string;
  qualityScore: number;
  rawQualityScore: number;
  rawQualityLevel: string;
  capApplied: boolean;
  capAppliedLevel: string | null;
  capCause: string | null;
  productionVessel: string;
  agingPlan: string;
  closureType: string;
  vineState: string;
  grapeAmount: number;
  bottleCount: number;
  profile: unknown;
  styleTags: unknown;
  label: unknown;
  moments: unknown;
  primaryMoment: string | null;
  verdict: unknown;
  salePrice: number | null;
  onchainEligible: boolean;
}) {
  return {
    batchId: batch.id,
    producerUserId: batch.userId,
    seasonKey: mapDbEnum(batch.seasonKey),
    qualityLevel: mapQuality(batch.qualityLevel),
    qualityScore: batch.qualityScore,
    rawQualityScore: batch.rawQualityScore,
    rawQualityLevel: mapQuality(batch.rawQualityLevel),
    capApplied: batch.capApplied,
    capAppliedLevel: batch.capAppliedLevel
      ? mapQuality(batch.capAppliedLevel)
      : null,
    capCause: batch.capCause,
    productionVessel: mapDbEnum(batch.productionVessel),
    agingPlan: mapDbEnum(batch.agingPlan),
    closureType: mapDbEnum(batch.closureType),
    vineState: mapDbEnum(batch.vineState),
    grapeAmount: batch.grapeAmount,
    bottleCount: batch.bottleCount,
    profile: toJsonValue(batch.profile),
    styleTags: toJsonValue(batch.styleTags),
    label: toJsonValue(batch.label),
    moments: toJsonValue(batch.moments),
    primaryMoment: batch.primaryMoment,
    verdict: toJsonValue(batch.verdict),
    salePrice: batch.salePrice,
    onchainEligible: batch.onchainEligible
  } satisfies Record<string, JsonValue>;
}

function getLabelName(label: JsonValue): string {
  if (typeof label === "object" && label !== null && !Array.isArray(label)) {
    const maybeName = label.name;
    if (typeof maybeName === "string") {
      return maybeName;
    }
  }
  return "Chateau Base Vintage";
}

function getQualityVerdict(verdict: JsonValue): string {
  if (typeof verdict === "object" && verdict !== null && !Array.isArray(verdict)) {
    const maybeQuality = verdict.quality;
    if (typeof maybeQuality === "string") {
      return maybeQuality;
    }
  }
  return "Beat this vintage.";
}

function buildShareCopy(
  type: ShareObjectType,
  mode: ShareMode,
  payload: Record<string, JsonValue>
) {
  const qualityLevel =
    typeof payload.qualityLevel === "string" ? payload.qualityLevel : type;
  const score = typeof payload.qualityScore === "number" ? payload.qualityScore : null;
  const bottleCount =
    typeof payload.bottleCount === "number" ? payload.bottleCount : null;
  const labelName = getLabelName(payload.label ?? null);
  const scoreLine = score === null ? "" : `${score}/100`;
  const bottleLine = bottleCount === null ? "" : `${bottleCount} bottles`;

  if (mode === "degen") {
    return {
      title: `${formatKey(qualityLevel)} posted`,
      subtitle: [scoreLine, bottleLine].filter(Boolean).join(" / "),
      body: getQualityVerdict(payload.verdict ?? null)
    };
  }

  return {
    title: labelName,
    subtitle: formatKey(qualityLevel),
    body: [scoreLine, bottleLine, "Craft your first vintage"].filter(Boolean).join(" / ")
  };
}

export async function createShareObject({
  prisma,
  userId,
  batchId,
  type,
  mode,
  payload
}: ShareCreateInput): Promise<ApiShareObject> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    let resolvedBatchPayload: Record<string, JsonValue>;
    let resolvedBatchId: string | null = batchId;

    if (batchId) {
      const batch = await tx.wineBatch.findUnique({
        where: { id: batchId }
      });

      if (!batch || batch.userId !== userId) {
        throw createHttpError(404, "WineBatch not found");
      }

      resolvedBatchPayload = buildBatchPayload(batch);
    } else {
      if (!BATCHLESS_SAFE_TYPES.has(type) || BATCH_REQUIRED_TYPES.has(type)) {
        throw createHttpError(400, "Share type requires a WineBatch");
      }
      resolvedBatchId = null;
      resolvedBatchPayload = {
        ...payload,
        type
      };
    }

    const shareId = randomUUID();
    const deeplinkUrl = `/s/${shareId}`;
    const copy = buildShareCopy(type, mode, resolvedBatchPayload);
    const created = await tx.shareObject.create({
      data: {
        id: shareId,
        userId,
        batchId: resolvedBatchId,
        type: SHARE_TYPE_TO_DB[type],
        mode: SHARE_MODE_TO_DB[mode],
        title: copy.title,
        subtitle: copy.subtitle,
        body: copy.body,
        imageUrl: null,
        deeplinkUrl,
        payload: resolvedBatchPayload as Prisma.InputJsonObject
      }
    });

    await tx.gameEvent.create({
      data: {
        userId,
        sessionId: null,
        name: "result_shared",
        payload: {
          shareId: created.id,
          batchId: resolvedBatchId,
          type,
          mode
        }
      }
    });

    return serializeShareObject(created);
  });
}

export async function getShareObject(
  prisma: ApiPrismaClient,
  shareId: string
): Promise<ApiShareObject> {
  const share = await prisma.shareObject.findUnique({
    where: { id: shareId }
  });

  if (!share) {
    throw createHttpError(404, "ShareObject not found");
  }

  return serializeShareObject(share);
}
