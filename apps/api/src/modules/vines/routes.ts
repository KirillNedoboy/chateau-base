import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { withIdempotency } from "../idempotency/withIdempotency.js";
import { harvestVine, plantVine } from "./service.js";

const vineMutationBodySchema = z.object({
  userId: z.string().min(1),
  plotId: z.string().min(1),
  idempotencyKey: z.string().min(1)
});

export const registerVineRoutes: FastifyPluginAsync = async (server) => {
  server.post("/api/vines/plant", async (request) => {
    const body = server.parseWithZod(vineMutationBodySchema, request.body);

    return withIdempotency({
      prisma: server.prisma,
      userId: body.userId,
      actionType: "vine_plant",
      idempotencyKey: body.idempotencyKey,
      requestPayload: {
        plotId: body.plotId
      },
      handler: async () =>
        plantVine({
          prisma: server.prisma,
          userId: body.userId,
          plotId: body.plotId
        })
    });
  });

  server.post("/api/vines/harvest", async (request) => {
    const body = server.parseWithZod(vineMutationBodySchema, request.body);

    return withIdempotency({
      prisma: server.prisma,
      userId: body.userId,
      actionType: "vine_harvest",
      idempotencyKey: body.idempotencyKey,
      requestPayload: {
        plotId: body.plotId
      },
      handler: async () =>
        harvestVine({
          prisma: server.prisma,
          userId: body.userId,
          plotId: body.plotId
        })
    });
  });
};
