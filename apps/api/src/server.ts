import Fastify from "fastify";

export function buildServer() {
  const server = Fastify({
    logger: true
  });

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
