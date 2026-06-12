import type { FastifyInstance } from "fastify";

const DEFAULT_DEVELOPMENT_WEB_ORIGIN = "http://localhost:3000";
const ALLOWED_METHODS = "GET, POST, OPTIONS";
const DEFAULT_ALLOWED_HEADERS = "content-type";

function createHttpError(statusCode: number, message: string) {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

function normalizeOrigin(origin: string): string {
  try {
    const parsed = new URL(origin.trim());
    return parsed.origin;
  } catch {
    throw createHttpError(500, "WEB_ORIGIN must be a valid origin");
  }
}

function appendVaryOrigin(existing: unknown): string {
  if (typeof existing !== "string" || existing.length === 0) {
    return "Origin";
  }

  const values = existing.split(",").map((value) => value.trim().toLowerCase());
  return values.includes("origin") ? existing : `${existing}, Origin`;
}

export function resolveAllowedWebOrigin(env = process.env): string {
  const configured = env.WEB_ORIGIN?.trim();
  if (configured) {
    return normalizeOrigin(configured);
  }

  if (env.NODE_ENV === "production") {
    throw createHttpError(500, "WEB_ORIGIN is required in production");
  }

  return DEFAULT_DEVELOPMENT_WEB_ORIGIN;
}

export function registerCors(server: FastifyInstance): void {
  const allowedOrigin = resolveAllowedWebOrigin();

  server.addHook("onRequest", async (request, reply) => {
    const requestOrigin = request.headers.origin;
    if (!requestOrigin) {
      return;
    }

    if (requestOrigin !== allowedOrigin) {
      reply.code(403).send({
        message: "Origin is not allowed"
      });
      return reply;
    }

    reply.header("access-control-allow-origin", allowedOrigin);
    reply.header("vary", appendVaryOrigin(reply.getHeader("vary")));

    if (request.method !== "OPTIONS") {
      return;
    }

    const requestedHeaders = request.headers["access-control-request-headers"];
    reply.header("access-control-allow-methods", ALLOWED_METHODS);
    reply.header(
      "access-control-allow-headers",
      typeof requestedHeaders === "string"
        ? requestedHeaders
        : DEFAULT_ALLOWED_HEADERS
    );
    reply.header("access-control-max-age", "600");
    reply.code(204).send();
    return reply;
  });
}
