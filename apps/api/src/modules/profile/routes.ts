import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { getPublicChateauProfile } from "./service.js";

const profileParamsSchema = z.object({
  walletAddress: z.string().min(1)
});

export const registerProfileRoutes: FastifyPluginAsync = async (server) => {
  server.get("/api/chateau/:walletAddress", async (request) => {
    const params = server.parseWithZod(profileParamsSchema, request.params);
    return getPublicChateauProfile(server.prisma, params.walletAddress);
  });
};
