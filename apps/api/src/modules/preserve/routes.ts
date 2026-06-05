import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { withIdempotency } from "../idempotency/withIdempotency.js";
import { confirmPreserve, preparePreserve } from "./service.js";

const preservePrepareBodySchema = z.object({
  userId: z.string().min(1),
  batchId: z.string().min(1),
  chainId: z.number().int().positive()
});

const preserveConfirmBodySchema = preservePrepareBodySchema.extend({
  txHash: z.string().min(1),
  idempotencyKey: z.string().min(1)
});

export const registerPreserveRoutes: FastifyPluginAsync = async (server) => {
  server.post("/api/preserve/prepare", async (request) => {
    const body = server.parseWithZod(preservePrepareBodySchema, request.body);

    return preparePreserve({
      prisma: server.prisma,
      userId: body.userId,
      batchId: body.batchId,
      chainId: body.chainId
    });
  });

  server.post("/api/preserve/confirm", async (request) => {
    const body = server.parseWithZod(preserveConfirmBodySchema, request.body);

    return withIdempotency({
      prisma: server.prisma,
      userId: body.userId,
      actionType: "preserve_confirm",
      idempotencyKey: body.idempotencyKey,
      requestPayload: {
        batchId: body.batchId,
        chainId: body.chainId,
        txHash: body.txHash
      },
      handler: async () =>
        confirmPreserve({
          prisma: server.prisma,
          userId: body.userId,
          batchId: body.batchId,
          chainId: body.chainId,
          txHash: body.txHash
        })
    });
  });
};
