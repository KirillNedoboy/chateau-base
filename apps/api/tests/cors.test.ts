import { afterEach, describe, expect, it } from "vitest";
import { buildServer } from "../src/server.js";

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
const ORIGINAL_WEB_ORIGIN = process.env.WEB_ORIGIN;

function restoreEnv() {
  if (ORIGINAL_NODE_ENV === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  }

  if (ORIGINAL_WEB_ORIGIN === undefined) {
    delete process.env.WEB_ORIGIN;
  } else {
    process.env.WEB_ORIGIN = ORIGINAL_WEB_ORIGIN;
  }
}

describe("API CORS", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("allows only the configured WEB_ORIGIN", async () => {
    process.env.NODE_ENV = "development";
    process.env.WEB_ORIGIN = "http://127.0.0.1:3000";
    const server = buildServer({ logger: false });

    try {
      const response = await server.inject({
        method: "GET",
        url: "/health",
        headers: {
          origin: "http://127.0.0.1:3000"
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://127.0.0.1:3000"
      );
      expect(response.headers.vary).toContain("Origin");
    } finally {
      await server.close();
    }
  });

  it("rejects cross-origin browser requests from unconfigured origins", async () => {
    process.env.NODE_ENV = "development";
    process.env.WEB_ORIGIN = "http://localhost:3000";
    const server = buildServer({ logger: false });

    try {
      const response = await server.inject({
        method: "POST",
        url: "/api/session/start",
        headers: {
          origin: "https://evil.example"
        },
        payload: {
          anonymousSessionId: "cors-rejected-origin"
        }
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().message).toBe("Origin is not allowed");
      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    } finally {
      await server.close();
    }
  });

  it("answers allowed preflight requests without a wildcard origin", async () => {
    process.env.NODE_ENV = "development";
    process.env.WEB_ORIGIN = "http://localhost:3000";
    const server = buildServer({ logger: false });

    try {
      const response = await server.inject({
        method: "OPTIONS",
        url: "/api/session/start",
        headers: {
          origin: "http://localhost:3000",
          "access-control-request-method": "POST",
          "access-control-request-headers": "content-type"
        }
      });

      expect(response.statusCode).toBe(204);
      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://localhost:3000"
      );
      expect(response.headers["access-control-allow-origin"]).not.toBe("*");
      expect(response.headers["access-control-allow-methods"]).toContain("POST");
      expect(response.headers["access-control-allow-headers"]).toContain(
        "content-type"
      );
    } finally {
      await server.close();
    }
  });

  it("fails clearly in production when WEB_ORIGIN is missing", () => {
    process.env.NODE_ENV = "production";
    delete process.env.WEB_ORIGIN;

    expect(() => buildServer({ logger: false })).toThrow(
      "WEB_ORIGIN is required in production"
    );
  });
});
