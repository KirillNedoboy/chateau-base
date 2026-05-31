import type { ShopItemKey } from "@chateau/shared";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { withIdempotency } from "../idempotency/withIdempotency.js";
import { buyShopItem } from "./service.js";

const shopItemKeySchema = z.union([
  z.literal("vine"),
  z.literal("screw_cap"),
  z.literal("cork"),
  z.literal("steel_tank_unlock"),
  z.literal("old_oak_barrel_unlock"),
  z.literal("new_oak_barrel_unlock"),
  z.literal("new_plot")
]);

const shopBuyBodySchema = z.object({
  userId: z.string().min(1),
  itemKey: shopItemKeySchema,
  quantity: z.number().int().positive(),
  idempotencyKey: z.string().min(1)
});

export const registerShopRoutes: FastifyPluginAsync = async (server) => {
  server.post("/api/shop/buy", async (request) => {
    const body = server.parseWithZod(shopBuyBodySchema, request.body);

    return withIdempotency({
      prisma: server.prisma,
      userId: body.userId,
      actionType: "shop_buy",
      idempotencyKey: body.idempotencyKey,
      requestPayload: {
        itemKey: body.itemKey,
        quantity: body.quantity
      },
      handler: async () =>
        buyShopItem({
          prisma: server.prisma,
          userId: body.userId,
          itemKey: body.itemKey as ShopItemKey,
          quantity: body.quantity
        })
    });
  });
};
