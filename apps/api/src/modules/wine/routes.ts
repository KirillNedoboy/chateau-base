import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { withIdempotency } from "../idempotency/withIdempotency.js";
import { sellWine } from "./service.js";

const wineParamsSchema = z.object({
  batchId: z.string().min(1)
});

const sellWineBodySchema = z.object({
  userId: z.string().min(1),
  idempotencyKey: z.string().min(1)
});

export const registerWineRoutes: FastifyPluginAsync = async (server) => {
  server.post("/api/wine/:batchId/sell", async (request) => {
    const params = server.parseWithZod(wineParamsSchema, request.params);
    const body = server.parseWithZod(sellWineBodySchema, request.body);

    return withIdempotency({
      prisma: server.prisma,
      userId: body.userId,
      actionType: "wine_sell",
      idempotencyKey: body.idempotencyKey,
      requestPayload: {
        batchId: params.batchId
      },
      handler: async () =>
        sellWine({
          prisma: server.prisma,
          userId: body.userId,
          batchId: params.batchId
        })
    });
  });
};
