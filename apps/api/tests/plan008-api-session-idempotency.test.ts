import { beforeEach, describe, expect, it } from "vitest";
import { buildServer } from "../src/server.js";
import { withIdempotency } from "../src/modules/idempotency/withIdempotency.js";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

type TestUser = {
  id: string;
  telegramUserId: string | null;
  walletAddress: string | null;
  chainId: number | null;
  baseProfileLinked: boolean;
  grapeBalance: number;
  chateauLevel: "LEVEL_1" | "LEVEL_2" | "LEVEL_3";
  tutorialState: JsonValue | null;
  sommelierViolenceEnabled: boolean;
  cowardMeter: number;
  createdAt: Date;
  updatedAt: Date;
};

type TestSeason = {
  id: string;
  key: "GENESIS_HARVEST";
  name: string;
  startsAt: Date;
  endsAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type TestGameEvent = {
  id: string;
  userId: string | null;
  sessionId: string | null;
  name: string;
  payload: JsonValue;
  createdAt: Date;
};

type TestGameActionLog = {
  id: string;
  userId: string;
  actionType: string;
  idempotencyKey: string;
  requestPayload: JsonValue;
  responsePayload: JsonValue | null;
  createdAt: Date;
};

type TestPlot = {
  id: string;
  userId: string;
  index: number;
};

type TestCellar = {
  id: string;
  userId: string;
  usedSlots: number;
  maxSlots: number;
};

type TestInventory = {
  id: string;
  userId: string;
  itemKey: string;
  quantity: number;
};

type TestVine = {
  id: string;
  userId: string;
};

type TestWineBatch = {
  id: string;
  userId: string;
  preservedOnchain: boolean;
};

type TestDbState = {
  users: TestUser[];
  seasons: TestSeason[];
  gameEvents: TestGameEvent[];
  gameActionLogs: TestGameActionLog[];
  plots: TestPlot[];
  cellars: TestCellar[];
  inventories: TestInventory[];
  vines: TestVine[];
  wineBatches: TestWineBatch[];
};

function createTestPrisma() {
  // In-memory stub for deterministic unit tests.
  // It does not fully model real DB concurrency, transaction isolation, or locking behavior.
  const state: TestDbState = {
    users: [],
    seasons: [
      {
        id: "season_genesis",
        key: "GENESIS_HARVEST",
        name: "Genesis Harvest",
        startsAt: new Date("2026-01-01T00:00:00.000Z"),
        endsAt: null,
        isActive: true,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z")
      }
    ],
    gameEvents: [],
    gameActionLogs: [],
    plots: [],
    cellars: [],
    inventories: [],
    vines: [],
    wineBatches: []
  };

  let idCounter = 0;
  const nextId = (prefix: string) => `${prefix}_${++idCounter}`;

  const prismaLike = {
    user: {
      findUnique: async ({
        where
      }: {
        where: { id?: string; telegramUserId?: string | null };
      }) => {
        if (typeof where.id === "string") {
          return state.users.find((user) => user.id === where.id) ?? null;
        }
        if (typeof where.telegramUserId === "string") {
          return (
            state.users.find(
              (user) => user.telegramUserId === where.telegramUserId
            ) ?? null
          );
        }
        return null;
      },
      create: async ({
        data
      }: {
        data: {
          telegramUserId: string | null;
          grapeBalance: number;
          tutorialState: JsonValue;
        };
      }) => {
        const now = new Date();
        const user: TestUser = {
          id: nextId("user"),
          telegramUserId: data.telegramUserId,
          walletAddress: null,
          chainId: null,
          baseProfileLinked: false,
          grapeBalance: data.grapeBalance,
          chateauLevel: "LEVEL_1",
          tutorialState: data.tutorialState,
          sommelierViolenceEnabled: false,
          cowardMeter: 0,
          createdAt: now,
          updatedAt: now
        };
        state.users.push(user);
        return user;
      },
      upsert: async ({
        where,
        update,
        create
      }: {
        where: { telegramUserId: string };
        update: Partial<{
          grapeBalance: number;
          tutorialState: JsonValue;
          updatedAt: Date;
        }>;
        create: {
          telegramUserId: string;
          grapeBalance: number;
          tutorialState: JsonValue;
        };
      }) => {
        const existing = state.users.find(
          (user) => user.telegramUserId === where.telegramUserId
        );
        if (existing) {
          if (typeof update.grapeBalance === "number") {
            existing.grapeBalance = update.grapeBalance;
          }
          if (update.tutorialState !== undefined) {
            existing.tutorialState = update.tutorialState;
          }
          existing.updatedAt = update.updatedAt ?? new Date();
          return existing;
        }
        const now = new Date();
        const createdUser: TestUser = {
          id: nextId("user"),
          telegramUserId: create.telegramUserId,
          walletAddress: null,
          chainId: null,
          baseProfileLinked: false,
          grapeBalance: create.grapeBalance,
          chateauLevel: "LEVEL_1",
          tutorialState: create.tutorialState,
          sommelierViolenceEnabled: false,
          cowardMeter: 0,
          createdAt: now,
          updatedAt: now
        };
        state.users.push(createdUser);
        return createdUser;
      }
    },
    plot: {
      count: async ({ where }: { where: { userId: string } }) =>
        state.plots.filter((plot) => plot.userId === where.userId).length,
      createMany: async ({
        data,
        skipDuplicates
      }: {
        data: Array<{ userId: string; index: number }>;
        skipDuplicates?: boolean;
      }) => {
        let inserted = 0;
        for (const entry of data) {
          const duplicate = state.plots.some(
            (plot) => plot.userId === entry.userId && plot.index === entry.index
          );
          if (duplicate) {
            if (skipDuplicates) {
              continue;
            }
            const error = new Error("Unique constraint violation") as Error & {
              code?: string;
            };
            error.code = "P2002";
            throw error;
          }
          state.plots.push({
            id: nextId("plot"),
            userId: entry.userId,
            index: entry.index
          });
          inserted += 1;
        }
        return { count: inserted };
      }
    },
    cellar: {
      upsert: async ({
        where,
        create
      }: {
        where: { userId: string };
        update: { updatedAt: Date };
        create: { userId: string; usedSlots: number; maxSlots: number };
      }) => {
        const existing = state.cellars.find(
          (cellar) => cellar.userId === where.userId
        );
        if (existing) {
          return existing;
        }
        const created: TestCellar = {
          id: nextId("cellar"),
          userId: create.userId,
          usedSlots: create.usedSlots,
          maxSlots: create.maxSlots
        };
        state.cellars.push(created);
        return created;
      },
      findUnique: async ({ where }: { where: { userId: string } }) =>
        state.cellars.find((cellar) => cellar.userId === where.userId) ?? null
    },
    season: {
      findFirst: async ({
        where
      }: {
        where?: { isActive?: boolean };
      } = {}) => {
        if (where?.isActive === true) {
          return state.seasons.find((season) => season.isActive) ?? null;
        }
        return state.seasons[0] ?? null;
      }
    },
    inventory: {
      findMany: async ({ where }: { where: { userId: string } }) =>
        state.inventories
          .filter((entry) => entry.userId === where.userId)
          .map(({ itemKey, quantity }) => ({ itemKey, quantity })),
      upsert: async ({
        where,
        create
      }: {
        where: {
          userId_itemKey: {
            userId: string;
            itemKey: string;
          };
        };
        update: Record<string, never>;
        create: {
          userId: string;
          itemKey: string;
          quantity: number;
        };
      }) => {
        const existing = state.inventories.find(
          (entry) =>
            entry.userId === where.userId_itemKey.userId &&
            entry.itemKey === where.userId_itemKey.itemKey
        );
        if (existing) {
          return existing;
        }
        const created: TestInventory = {
          id: nextId("inventory"),
          userId: create.userId,
          itemKey: create.itemKey,
          quantity: create.quantity
        };
        state.inventories.push(created);
        return created;
      }
    },
    vine: {
      count: async ({ where }: { where: { userId: string } }) =>
        state.vines.filter((entry) => entry.userId === where.userId).length
    },
    wineBatch: {
      count: async ({
        where
      }: {
        where: { userId: string; preservedOnchain?: boolean };
      }) =>
        state.wineBatches.filter(
          (entry) =>
            entry.userId === where.userId &&
            (where.preservedOnchain === undefined ||
              entry.preservedOnchain === where.preservedOnchain)
        ).length
    },
    gameEvent: {
      create: async ({
        data
      }: {
        data: {
          userId: string | null;
          sessionId: string | null;
          name: string;
          payload: JsonValue;
        };
      }) => {
        const event: TestGameEvent = {
          id: nextId("event"),
          userId: data.userId,
          sessionId: data.sessionId,
          name: data.name,
          payload: data.payload,
          createdAt: new Date()
        };
        state.gameEvents.push(event);
        return event;
      }
    },
    gameActionLog: {
      findUnique: async ({
        where
      }: {
        where: {
          userId_actionType_idempotencyKey: {
            userId: string;
            actionType: string;
            idempotencyKey: string;
          };
        };
      }) =>
        state.gameActionLogs.find(
          (log) =>
            log.userId === where.userId_actionType_idempotencyKey.userId &&
            log.actionType === where.userId_actionType_idempotencyKey.actionType &&
            log.idempotencyKey ===
              where.userId_actionType_idempotencyKey.idempotencyKey
        ) ?? null,
      create: async ({
        data
      }: {
        data: {
          userId: string;
          actionType: string;
          idempotencyKey: string;
          requestPayload: JsonValue;
          responsePayload: JsonValue | null;
        };
      }) => {
        const duplicate = state.gameActionLogs.find(
          (log) =>
            log.userId === data.userId &&
            log.actionType === data.actionType &&
            log.idempotencyKey === data.idempotencyKey
        );
        if (duplicate) {
          const error = new Error("Unique constraint violation") as Error & {
            code?: string;
          };
          error.code = "P2002";
          throw error;
        }
        const log: TestGameActionLog = {
          id: nextId("action"),
          userId: data.userId,
          actionType: data.actionType,
          idempotencyKey: data.idempotencyKey,
          requestPayload: data.requestPayload,
          responsePayload: data.responsePayload,
          createdAt: new Date()
        };
        state.gameActionLogs.push(log);
        return log;
      },
      update: async ({
        where,
        data
      }: {
        where: { id: string };
        data: { responsePayload: JsonValue | null };
      }) => {
        const found = state.gameActionLogs.find((log) => log.id === where.id);
        if (!found) {
          throw new Error("GameActionLog not found");
        }
        found.responsePayload = data.responsePayload;
        return found;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const index = state.gameActionLogs.findIndex((log) => log.id === where.id);
        if (index === -1) {
          const error = new Error("Record not found") as Error & { code?: string };
          error.code = "P2025";
          throw error;
        }
        const [removed] = state.gameActionLogs.splice(index, 1);
        return removed;
      }
    }
  };

  return {
    prismaLike: prismaLike as unknown,
    state
  };
}

describe("Plan 008 API foundation", () => {
  let state: TestDbState;
  let prismaLike: unknown;

  beforeEach(() => {
    const testDb = createTestPrisma();
    state = testDb.state;
    prismaLike = testDb.prismaLike;
  });

  it("session start creates user with starting 500 GRAPE", async () => {
    const server = buildServer({
      logger: false,
      prisma: prismaLike
    });

    const response = await server.inject({
      method: "POST",
      url: "/api/session/start",
      payload: {
        telegramUserId: "tg_001"
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.user.grapeBalance).toBe(500);
    expect(body.user.telegramUserId).toBe("tg_001");
    expect(state.gameEvents.some((event) => event.name === "session_started")).toBe(
      true
    );
    await server.close();
  });

  it("repeated session start with same telegramUserId returns same user", async () => {
    const server = buildServer({
      logger: false,
      prisma: prismaLike
    });

    const first = await server.inject({
      method: "POST",
      url: "/api/session/start",
      payload: {
        telegramUserId: "tg_repeat"
      }
    });
    const second = await server.inject({
      method: "POST",
      url: "/api/session/start",
      payload: {
        telegramUserId: "tg_repeat"
      }
    });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(second.json().user.id).toBe(first.json().user.id);
    expect(state.plots).toHaveLength(3);
    expect(state.cellars).toHaveLength(1);
    await server.close();
  });

  it("rejects invalid /api/session/start body via zod validation", async () => {
    const server = buildServer({
      logger: false,
      prisma: prismaLike
    });

    const response = await server.inject({
      method: "POST",
      url: "/api/session/start",
      payload: {}
    });

    expect(response.statusCode).toBe(400);
    await server.close();
  });

  it("rejects telegramUserId with reserved anon prefix", async () => {
    const server = buildServer({
      logger: false,
      prisma: prismaLike
    });

    const response = await server.inject({
      method: "POST",
      url: "/api/session/start",
      payload: {
        telegramUserId: "anon:xyz"
      }
    });

    expect(response.statusCode).toBe(400);
    await server.close();
  });

  it("accepts anonymousSessionId and creates deterministic anonymous identity", async () => {
    const server = buildServer({
      logger: false,
      prisma: prismaLike
    });

    const response = await server.inject({
      method: "POST",
      url: "/api/session/start",
      payload: {
        anonymousSessionId: "xyz"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().user.telegramUserId).toBeNull();
    expect(state.users[0]?.telegramUserId).toBe("anon:xyz");
    await server.close();
  });

  it("separates telegram and anonymous identities even with same numeric value", async () => {
    const server = buildServer({
      logger: false,
      prisma: prismaLike
    });

    const telegramStart = await server.inject({
      method: "POST",
      url: "/api/session/start",
      payload: {
        telegramUserId: "12345"
      }
    });

    const anonymousStart = await server.inject({
      method: "POST",
      url: "/api/session/start",
      payload: {
        anonymousSessionId: "12345"
      }
    });

    expect(telegramStart.statusCode).toBe(200);
    expect(anonymousStart.statusCode).toBe(200);
    expect(telegramStart.json().user.id).not.toBe(anonymousStart.json().user.id);
    expect(state.users.map((user) => user.telegramUserId)).toEqual(
      expect.arrayContaining(["12345", "anon:12345"])
    );
    await server.close();
  });

  it("game state returns active Genesis Harvest season", async () => {
    const server = buildServer({
      logger: false,
      prisma: prismaLike
    });

    const sessionResponse = await server.inject({
      method: "POST",
      url: "/api/session/start",
      payload: {
        telegramUserId: "tg_state"
      }
    });
    const userId = sessionResponse.json().user.id as string;

    const response = await server.inject({
      method: "GET",
      url: `/api/game/state?userId=${userId}`
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.activeSeason.key).toBe("genesis_harvest");
    expect(body.activeSeason.name).toBe("Genesis Harvest");
    await server.close();
  });

  it("analytics event endpoint stores payload as GameEvent", async () => {
    const server = buildServer({
      logger: false,
      prisma: prismaLike
    });

    const sessionResponse = await server.inject({
      method: "POST",
      url: "/api/session/start",
      payload: {
        telegramUserId: "tg_analytics"
      }
    });
    const userId = sessionResponse.json().user.id as string;

    const response = await server.inject({
      method: "POST",
      url: "/api/analytics/event",
      payload: {
        userId,
        eventName: "shop_opened",
        payload: {
          screen: "shop",
          step: 1
        }
      }
    });

    expect(response.statusCode).toBe(200);
    expect(
      state.gameEvents.some(
        (event) =>
          event.userId === userId &&
          event.name === "shop_opened" &&
          (event.payload as { screen?: string }).screen === "shop"
      )
    ).toBe(true);
    await server.close();
  });

  it("rejects invalid /api/analytics/event body via zod validation", async () => {
    const server = buildServer({
      logger: false,
      prisma: prismaLike
    });

    const response = await server.inject({
      method: "POST",
      url: "/api/analytics/event",
      payload: {
        eventName: "invalid_event_name",
        payload: "not_an_object"
      }
    });

    expect(response.statusCode).toBe(400);
    await server.close();
  });

  it("withIdempotency returns stored response and does not execute handler twice", async () => {
    let executionCount = 0;

    const first = await withIdempotency({
      prisma: prismaLike,
      userId: "user_1",
      actionType: "session_start",
      idempotencyKey: "idem_001",
      requestPayload: { source: "test" },
      handler: async () => {
        executionCount += 1;
        return { ok: true, attempt: executionCount };
      }
    });

    const second = await withIdempotency({
      prisma: prismaLike,
      userId: "user_1",
      actionType: "session_start",
      idempotencyKey: "idem_001",
      requestPayload: { source: "test" },
      handler: async () => {
        executionCount += 1;
        return { ok: true, attempt: executionCount };
      }
    });

    expect(first).toEqual({ ok: true, attempt: 1 });
    expect(second).toEqual({ ok: true, attempt: 1 });
    expect(executionCount).toBe(1);
    expect(state.gameActionLogs).toHaveLength(1);
    expect(state.gameActionLogs[0]?.requestPayload).toEqual({ source: "test" });
    expect(state.gameActionLogs[0]?.responsePayload).toEqual({
      __chateauIdempotencyResult: true,
      data: {
        ok: true,
        attempt: 1
      }
    });
  });

  it("withIdempotency deletes pending log and allows retry after handler failure", async () => {
    let executionCount = 0;

    await expect(
      withIdempotency({
        prisma: prismaLike,
        userId: "user_retry",
        actionType: "session_start",
        idempotencyKey: "idem_retry_001",
        requestPayload: { source: "retry-test" },
        handler: async () => {
          executionCount += 1;
          throw new Error("transient failure");
        }
      })
    ).rejects.toThrow("transient failure");

    expect(state.gameActionLogs).toHaveLength(0);

    const retried = await withIdempotency({
      prisma: prismaLike,
      userId: "user_retry",
      actionType: "session_start",
      idempotencyKey: "idem_retry_001",
      requestPayload: { source: "retry-test" },
      handler: async () => {
        executionCount += 1;
        return { ok: true, attempt: executionCount };
      }
    });

    expect(retried).toEqual({ ok: true, attempt: 2 });
    expect(state.gameActionLogs).toHaveLength(1);
  });

  it("withIdempotency returns payload that matches legacy pending marker content", async () => {
    let executionCount = 0;
    const markerLikePayload = { __idempotencyStatus: "pending" } as const;

    const first = await withIdempotency({
      prisma: prismaLike,
      userId: "user_marker",
      actionType: "session_start",
      idempotencyKey: "idem_marker_001",
      requestPayload: { source: "marker-test" },
      handler: async () => {
        executionCount += 1;
        return markerLikePayload;
      }
    });

    const second = await withIdempotency({
      prisma: prismaLike,
      userId: "user_marker",
      actionType: "session_start",
      idempotencyKey: "idem_marker_001",
      requestPayload: { source: "marker-test" },
      handler: async () => {
        executionCount += 1;
        return { unexpected: true };
      }
    });

    expect(first).toEqual(markerLikePayload);
    expect(second).toEqual(markerLikePayload);
    expect(executionCount).toBe(1);
  });
});
