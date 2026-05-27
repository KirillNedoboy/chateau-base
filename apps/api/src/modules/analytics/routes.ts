import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { jsonValueSchema } from "../../plugins/zod.js";

const analyticsEventBodySchema = z.object({
  userId: z.string().min(1).nullable().optional(),
  sessionId: z.string().min(1).nullable().optional(),
  eventName: z.union([
    z.literal("session_started"),
    z.literal("tutorial_started"),
    z.literal("shop_opened"),
    z.literal("vine_bought"),
    z.literal("vine_planted"),
    z.literal("vine_harvested"),
    z.literal("winery_opened"),
    z.literal("production_preview_seen"),
    z.literal("production_started"),
    z.literal("wine_revealed"),
    z.literal("moment_triggered"),
    z.literal("result_shared"),
    z.literal("run_it_back_clicked"),
    z.literal("wine_sold"),
    z.literal("wallet_prompt_seen"),
    z.literal("wallet_connected"),
    z.literal("challenge_opened"),
    z.literal("challenge_started"),
    z.literal("challenge_completed"),
    z.literal("violence_mode_enabled")
  ]),
  payload: z.record(z.string(), jsonValueSchema)
});

export const registerAnalyticsRoutes: FastifyPluginAsync = async (server) => {
  server.post("/api/analytics/event", async (request) => {
    const body = server.parseWithZod(analyticsEventBodySchema, request.body);

    const createdEvent = await server.prisma.gameEvent.create({
      data: {
        userId: body.userId ?? null,
        sessionId: body.sessionId ?? null,
        name: body.eventName,
        payload: body.payload
      }
    });

    return {
      id: createdEvent.id,
      name: createdEvent.name,
      createdAt: createdEvent.createdAt.toISOString(),
      stored: true
    };
  });
};
