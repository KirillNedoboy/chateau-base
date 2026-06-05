import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { withIdempotency } from "../idempotency/withIdempotency.js";
import { linkWalletToUser } from "./service.js";

const walletLinkBodySchema = z.object({
  userId: z.string().min(1),
  walletAddress: z.string().min(1),
  chainId: z.number().int().positive(),
  idempotencyKey: z.string().min(1)
});

export const registerWalletRoutes: FastifyPluginAsync = async (server) => {
  server.post("/api/wallet/link", async (request) => {
    const body = server.parseWithZod(walletLinkBodySchema, request.body);

    return withIdempotency({
      prisma: server.prisma,
      userId: body.userId,
      actionType: "wallet_link",
      idempotencyKey: body.idempotencyKey,
      requestPayload: {
        walletAddress: body.walletAddress,
        chainId: body.chainId
      },
      handler: async () =>
        linkWalletToUser({
          prisma: server.prisma,
          userId: body.userId,
          walletAddress: body.walletAddress,
          chainId: body.chainId
        })
    });
  });
};
