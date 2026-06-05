import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { completeChallenge, openChallenge, startChallenge } from "./service.js";

const challengeOpenBodySchema = z.object({
  shareId: z.string().min(1)
});

const challengeStartBodySchema = z.object({
  challengeId: z.string().min(1),
  invitedUserId: z.string().min(1)
});

const challengeCompleteBodySchema = z.object({
  challengeId: z.string().min(1),
  invitedUserId: z.string().min(1),
  invitedBatchId: z.string().min(1)
});

export const registerChallengeRoutes: FastifyPluginAsync = async (server) => {
  server.post("/api/challenge/open", async (request) => {
    const body = server.parseWithZod(challengeOpenBodySchema, request.body);

    return openChallenge(server.prisma, body.shareId);
  });

  server.post("/api/challenge/start", async (request) => {
    const body = server.parseWithZod(challengeStartBodySchema, request.body);

    return startChallenge({
      prisma: server.prisma,
      challengeId: body.challengeId,
      invitedUserId: body.invitedUserId
    });
  });

  server.post("/api/challenge/complete", async (request) => {
    const body = server.parseWithZod(challengeCompleteBodySchema, request.body);

    return completeChallenge({
      prisma: server.prisma,
      challengeId: body.challengeId,
      invitedUserId: body.invitedUserId,
      invitedBatchId: body.invitedBatchId
    });
  });
};
