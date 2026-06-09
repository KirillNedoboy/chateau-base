import { DEFAULT_GAME_CONFIG } from "@chateau/game-engine";
import type { TutorialState } from "@chateau/shared";
import type { Prisma } from "@prisma/client";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const RESERVED_ANON_PREFIX = "anon:";
const NO_CONTROL_CHARS_REGEX = /^[^\u0000-\u001F\u007F]+$/;

const sessionStartBodySchema = z.object({
  telegramUserId: z
    .string()
    .min(1)
    .refine((value) => !value.startsWith(RESERVED_ANON_PREFIX), {
      message: "telegramUserId cannot use reserved anon: prefix"
    })
    .nullable()
    .optional(),
  anonymousSessionId: z
    .string()
    .min(1)
    .regex(NO_CONTROL_CHARS_REGEX, {
      message: "anonymousSessionId cannot contain control characters"
    })
    .nullable()
    .optional()
}).refine(
  (value) =>
    (value.telegramUserId ?? null) !== null ||
    (value.anonymousSessionId ?? null) !== null,
  {
    message: "telegramUserId or anonymousSessionId is required"
  }
);

const tutorialStateSchema = z.object({
  status: z.union([
    z.literal("not_started"),
    z.literal("in_progress"),
    z.literal("completed")
  ]),
  currentStep: z
    .union([
      z.literal("session_started"),
      z.literal("shop_opened"),
      z.literal("vine_bought"),
      z.literal("vine_planted"),
      z.literal("vine_harvested"),
      z.literal("winery_opened"),
      z.literal("production_started"),
      z.literal("wine_revealed"),
      z.literal("wallet_prompt_seen")
    ])
    .nullable(),
  completedSteps: z.array(
    z.union([
      z.literal("session_started"),
      z.literal("shop_opened"),
      z.literal("vine_bought"),
      z.literal("vine_planted"),
      z.literal("vine_harvested"),
      z.literal("winery_opened"),
      z.literal("production_started"),
      z.literal("wine_revealed"),
      z.literal("wallet_prompt_seen")
    ])
  ),
  firstWineBatchId: z.string().nullable(),
  firstWineRevealedAt: z.string().nullable(),
  violenceModePromptedAt: z.string().nullable(),
  updatedAt: z.string()
});

function createInitialTutorialState(): TutorialState {
  return {
    status: "not_started",
    currentStep: "session_started",
    completedSteps: ["session_started"],
    firstWineBatchId: null,
    firstWineRevealedAt: null,
    violenceModePromptedAt: null,
    updatedAt: new Date().toISOString()
  };
}

function mapChateauLevel(level: "LEVEL_1" | "LEVEL_2" | "LEVEL_3"): 1 | 2 | 3 {
  if (level === "LEVEL_1") {
    return 1;
  }
  if (level === "LEVEL_2") {
    return 2;
  }
  return 3;
}

function resolveTutorialState(input: unknown): TutorialState {
  const parsed = tutorialStateSchema.safeParse(input);
  if (!parsed.success) {
    return createInitialTutorialState();
  }
  return parsed.data;
}

function isUniqueConstraintError(error: unknown): error is { code: string } {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const maybeCode = (error as { code?: unknown }).code;
  return typeof maybeCode === "string" && maybeCode === "P2002";
}

export const registerSessionRoutes: FastifyPluginAsync = async (server) => {
  server.post("/api/session/start", async (request) => {
    const body = server.parseWithZod(sessionStartBodySchema, request.body);
    const telegramUserId = body.telegramUserId ?? null;
    const anonymousSessionId = body.anonymousSessionId ?? null;
    const sessionUserKey =
      telegramUserId ??
      (anonymousSessionId ? `${RESERVED_ANON_PREFIX}${anonymousSessionId}` : null);

    if (sessionUserKey === null) {
      const error = new Error("telegramUserId or anonymousSessionId is required") as
        Error & { statusCode: number };
      error.statusCode = 400;
      throw error;
    }

    let user;
    try {
      user = await server.prisma.user.upsert({
        where: {
          telegramUserId: sessionUserKey
        },
        update: {},
        create: {
          telegramUserId: sessionUserKey,
          grapeBalance: DEFAULT_GAME_CONFIG.startingGrapeBalance,
          tutorialState:
            createInitialTutorialState() as unknown as Prisma.InputJsonValue
        }
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      const recovered = await server.prisma.user.findUnique({
        where: {
          telegramUserId: sessionUserKey
        }
      });
      if (!recovered) {
        throw error;
      }
      user = recovered;
    }

    await server.prisma.plot.createMany({
      data: [1, 2, 3].map((plotIndex) => ({
        userId: user.id,
        index: plotIndex
      })),
      skipDuplicates: true
    });

    await server.prisma.cellar.upsert({
      where: { userId: user.id },
      update: {
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        usedSlots: 0,
        maxSlots: 10
      }
    });

    await server.prisma.inventory.upsert({
      where: {
        userId_itemKey: {
          userId: user.id,
          itemKey: "SCREW_CAP"
        }
      },
      update: {},
      create: {
        userId: user.id,
        itemKey: "SCREW_CAP",
        quantity: 1
      }
    });

    const activeSeason = await server.prisma.season.findFirst({
      where: { isActive: true },
      orderBy: { startsAt: "desc" }
    });

    await server.prisma.gameEvent.create({
      data: {
        userId: user.id,
        sessionId: anonymousSessionId,
        name: "session_started",
        payload: {
          userId: user.id,
          telegramUserId,
          anonymousSessionId
        }
      }
    });

    return {
      user: {
        id: user.id,
        telegramUserId:
          user.telegramUserId &&
          user.telegramUserId.startsWith(RESERVED_ANON_PREFIX)
            ? null
            : user.telegramUserId,
        walletAddress: user.walletAddress,
        chainId: user.chainId,
        baseProfileLinked: user.baseProfileLinked,
        grapeBalance: user.grapeBalance,
        chateauLevel: mapChateauLevel(user.chateauLevel),
        tutorialState: resolveTutorialState(user.tutorialState),
        sommelierViolenceEnabled: user.sommelierViolenceEnabled,
        cowardMeter: user.cowardMeter
      },
      activeSeason: activeSeason
        ? {
            id: activeSeason.id,
            key: activeSeason.key.toLowerCase(),
            name: activeSeason.name,
            startsAt: activeSeason.startsAt.toISOString(),
            endsAt: activeSeason.endsAt?.toISOString() ?? null,
            isActive: activeSeason.isActive
          }
        : null
    };
  });
};
