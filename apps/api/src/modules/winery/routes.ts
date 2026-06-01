import type {
  AgingPlanKey,
  ClosureTypeKey,
  ProductionVesselKey
} from "@chateau/shared";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { withIdempotency } from "../idempotency/withIdempotency.js";
import { craftWine, previewWinery } from "./service.js";

const productionVesselSchema = z.union([
  z.literal("steel_tank"),
  z.literal("old_oak_barrel"),
  z.literal("new_oak_barrel")
]);

const agingPlanSchema = z.union([
  z.literal("no_aging"),
  z.literal("short_old_oak_aging"),
  z.literal("new_oak_aging"),
  z.literal("new_to_old_oak_aging")
]);

const closureTypeSchema = z.union([z.literal("screw_cap"), z.literal("cork")]);

const wineryRecipeBodySchema = z.object({
  userId: z.string().min(1),
  grapeAmount: z.number().int().positive(),
  productionVessel: productionVesselSchema,
  agingPlan: agingPlanSchema,
  closureType: closureTypeSchema
});

const wineryCraftBodySchema = wineryRecipeBodySchema.extend({
  idempotencyKey: z.string().min(1)
});

export const registerWineryRoutes: FastifyPluginAsync = async (server) => {
  server.post("/api/winery/preview", async (request) => {
    const body = server.parseWithZod(wineryRecipeBodySchema, request.body);

    return previewWinery({
      prisma: server.prisma,
      userId: body.userId,
      grapeAmount: body.grapeAmount,
      productionVessel: body.productionVessel as ProductionVesselKey,
      agingPlan: body.agingPlan as AgingPlanKey,
      closureType: body.closureType as ClosureTypeKey
    });
  });

  server.post("/api/winery/craft", async (request) => {
    const body = server.parseWithZod(wineryCraftBodySchema, request.body);

    return withIdempotency({
      prisma: server.prisma,
      userId: body.userId,
      actionType: "winery_craft",
      idempotencyKey: body.idempotencyKey,
      requestPayload: {
        grapeAmount: body.grapeAmount,
        productionVessel: body.productionVessel,
        agingPlan: body.agingPlan,
        closureType: body.closureType
      },
      handler: async () =>
        craftWine({
          prisma: server.prisma,
          userId: body.userId,
          grapeAmount: body.grapeAmount,
          productionVessel: body.productionVessel as ProductionVesselKey,
          agingPlan: body.agingPlan as AgingPlanKey,
          closureType: body.closureType as ClosureTypeKey,
          idempotencyKey: body.idempotencyKey
        })
    });
  });
};
