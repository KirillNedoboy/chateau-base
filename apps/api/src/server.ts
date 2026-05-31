import Fastify from "fastify";
import type { FastifyLoggerOptions, FastifyServerOptions } from "fastify";
import { registerAnalyticsRoutes } from "./modules/analytics/routes.js";
import { registerGameStateRoutes } from "./modules/game-state/routes.js";
import { registerSessionRoutes } from "./modules/session/routes.js";
import { registerShopRoutes } from "./modules/shop/routes.js";
import { registerVineRoutes } from "./modules/vines/routes.js";
import { registerPrisma, type ApiPrismaClient } from "./plugins/prisma.js";
import { registerZodValidation } from "./plugins/zod.js";

export type BuildServerOptions = {
  logger?: FastifyLoggerOptions | boolean;
  prisma?: ApiPrismaClient;
};

export function buildServer(options: BuildServerOptions = {}) {
  const fastifyOptions: FastifyServerOptions = {
    logger: options.logger ?? true
  };
  const server = Fastify({
    ...fastifyOptions
  });

  registerPrisma(server, {
    prisma: options.prisma
  });
  registerZodValidation(server);
  server.register(registerSessionRoutes);
  server.register(registerGameStateRoutes);
  server.register(registerAnalyticsRoutes);
  server.register(registerShopRoutes);
  server.register(registerVineRoutes);

  server.get("/health", async () => ({
    ok: true,
    service: "chateau-api"
  }));

  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const host = process.env.API_HOST ?? "127.0.0.1";
  const port = Number(process.env.API_PORT ?? 4000);
  const server = buildServer();

  await server.listen({ host, port });
}
