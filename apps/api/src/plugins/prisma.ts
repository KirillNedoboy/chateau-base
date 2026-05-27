import { prisma as defaultPrisma } from "@chateau/db";
import type { FastifyInstance } from "fastify";

export type ApiPrismaClient = typeof defaultPrisma;

export type PrismaPluginOptions = {
  prisma?: ApiPrismaClient;
};

declare module "fastify" {
  interface FastifyInstance {
    prisma: ApiPrismaClient;
  }
}

export function registerPrisma(
  server: FastifyInstance,
  options: PrismaPluginOptions = {}
): void {
  const prismaClient = options.prisma ?? defaultPrisma;
  server.decorate("prisma", prismaClient);

  if (options.prisma) {
    return;
  }

  server.addHook("onClose", async () => {
    await defaultPrisma.$disconnect();
  });
}
