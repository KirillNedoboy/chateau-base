import type { TutorialState } from "@chateau/shared";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const gameStateQuerySchema = z.object({
  userId: z.string().min(1)
});

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
  return parsed.data;
}

export const registerGameStateRoutes: FastifyPluginAsync = async (server) => {
  server.get("/api/game/state", async (request) => {
    const query = server.parseWithZod(gameStateQuerySchema, request.query);

    const user = await server.prisma.user.findUnique({
      where: { id: query.userId }
    });

    if (!user) {
      const error = new Error("User not found") as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    const [plotCount, vineCount, inventoryItems, cellar, activeSeason, preservedCount] =
      await Promise.all([
        server.prisma.plot.count({
          where: { userId: user.id }
        }),
        server.prisma.vine.count({
          where: { userId: user.id }
        }),
        server.prisma.inventory.findMany({
          where: { userId: user.id },
          select: {
            itemKey: true,
            quantity: true
          }
        }),
        server.prisma.cellar.findUnique({
          where: { userId: user.id }
        }),
        server.prisma.season.findFirst({
          where: { isActive: true },
          orderBy: { startsAt: "desc" }
        }),
        server.prisma.wineBatch.count({
          where: {
            userId: user.id,
            preservedOnchain: true
          }
        })
      ]);

    const mappedActiveSeason = activeSeason
      ? {
          id: activeSeason.id,
          key: activeSeason.key.toLowerCase(),
          name: activeSeason.name,
          startsAt: activeSeason.startsAt.toISOString(),
          endsAt: activeSeason.endsAt?.toISOString() ?? null,
          isActive: activeSeason.isActive
        }
      : null;

    return {
      user: {
        id: user.id,
        grapeBalance: user.grapeBalance,
        chateauLevel: mapChateauLevel(user.chateauLevel),
        tutorialState: resolveTutorialState(user.tutorialState)
      },
      activeSeason: mappedActiveSeason,
      plots: {
        total: plotCount
      },
      vines: {
        total: vineCount
      },
      inventory: {
        items: inventoryItems.map((entry) => ({
          itemKey: entry.itemKey.toLowerCase(),
          quantity: entry.quantity
        }))
      },
      cellar: cellar
        ? {
            usedSlots: cellar.usedSlots,
            maxSlots: cellar.maxSlots
          }
        : null,
      preserve: {
        walletLinked: user.walletAddress !== null,
        baseProfileLinked: user.baseProfileLinked,
        preservedBatchCount: preservedCount
      }
    };
  });
};
