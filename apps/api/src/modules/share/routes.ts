import type { ShareMode, ShareObjectType } from "@chateau/shared";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { jsonValueSchema } from "../../plugins/zod.js";
import { withIdempotency } from "../idempotency/withIdempotency.js";
import { createShareObject, getShareObject } from "./service.js";

const shareTypeSchema = z.union([
  z.literal("wine_result"),
  z.literal("fumble"),
  z.literal("achievement"),
  z.literal("challenge"),
  z.literal("coward_meter"),
  z.literal("corkfather"),
  z.literal("legendary")
]);

const shareModeSchema = z.union([z.literal("classy"), z.literal("degen")]);

const shareCreateBodySchema = z.object({
  userId: z.string().min(1),
  batchId: z.string().min(1).nullable().optional(),
  type: shareTypeSchema,
  mode: shareModeSchema,
  payload: z.record(z.string(), jsonValueSchema).optional().default({}),
  idempotencyKey: z.string().min(1)
});

const shareParamsSchema = z.object({
  shareId: z.string().min(1)
});

export const registerShareRoutes: FastifyPluginAsync = async (server) => {
  server.post("/api/share", async (request) => {
    const body = server.parseWithZod(shareCreateBodySchema, request.body);

    return withIdempotency({
      prisma: server.prisma,
      userId: body.userId,
      actionType: "share_create",
      idempotencyKey: body.idempotencyKey,
      requestPayload: {
        batchId: body.batchId ?? null,
        type: body.type,
        mode: body.mode,
        payload: body.payload
      },
      handler: async () =>
        createShareObject({
          prisma: server.prisma,
          userId: body.userId,
          batchId: body.batchId ?? null,
          type: body.type as ShareObjectType,
          mode: body.mode as ShareMode,
          payload: body.payload
        })
    });
  });

  server.get("/api/s/:shareId", async (request) => {
    const params = server.parseWithZod(shareParamsSchema, request.params);

    return getShareObject(server.prisma, params.shareId);
  });
};
