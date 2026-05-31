import type { TutorialState } from "@chateau/shared";

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
  status: "EMPTY" | "PLANTED" | "READY_TO_HARVEST";
  vineId: string | null;
  createdAt: Date;
  updatedAt: Date;
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
  itemKey:
    | "GRAPE"
    | "VINE"
    | "SCREW_CAP"
    | "CORK"
    | "STEEL_TANK_UNLOCK"
    | "OLD_OAK_BARREL_UNLOCK"
    | "NEW_OAK_BARREL_UNLOCK"
    | "NEW_PLOT";
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
};

type TestVine = {
  id: string;
  userId: string;
  plotId: string;
  harvestCount: number;
  state: "LOW_YIELD" | "BALANCED" | "OVERCROPPED";
  plantedAt: Date;
  readyAt: Date;
  lastHarvestedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type TestWineBatch = {
  id: string;
  userId: string;
  preservedOnchain: boolean;
};

export type TestDbState = {
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

function createInitialTutorialState(): TutorialState {
  return {
    status: "not_started",
    currentStep: "session_started",
    completedSteps: ["session_started"],
    firstWineBatchId: null,
    firstWineRevealedAt: null,
    violenceModePromptedAt: null,
    updatedAt: new Date().toISOString()
  };
}

function applyNumericUpdate(
  current: number,
  update:
    | number
    | {
        increment?: number;
        decrement?: number;
      }
    | undefined
): number {
  if (typeof update === "number") {
    return update;
  }
  if (!update) {
    return current;
  }
  return current + (update.increment ?? 0) - (update.decrement ?? 0);
}

export function createTestPrisma() {
  // Warning: this helper does not emulate real Prisma transaction rollback
  // or database isolation/concurrency semantics. It is only an in-memory
  // stub for deterministic unit tests of route/service logic.
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
    $transaction: async <T>(handler: (tx: typeof prismaLike) => Promise<T>) =>
      handler(prismaLike),
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
      },
      update: async ({
        where,
        data
      }: {
        where: { id: string };
        data: {
          grapeBalance?:
            | number
            | {
                increment?: number;
                decrement?: number;
              };
          tutorialState?: JsonValue;
          updatedAt?: Date;
        };
      }) => {
        const user = state.users.find((entry) => entry.id === where.id);
        if (!user) {
          throw new Error("User not found");
        }
        user.grapeBalance = applyNumericUpdate(user.grapeBalance, data.grapeBalance);
        if (data.tutorialState !== undefined) {
          user.tutorialState = data.tutorialState;
        }
        user.updatedAt = data.updatedAt ?? new Date();
        return user;
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
          const now = new Date();
          state.plots.push({
            id: nextId("plot"),
            userId: entry.userId,
            index: entry.index,
            status: "EMPTY",
            vineId: null,
            createdAt: now,
            updatedAt: now
          });
          inserted += 1;
        }
        return { count: inserted };
      },
      findFirst: async ({
        where
      }: {
        where: { userId?: string; index?: number; id?: string };
      }) =>
        state.plots.find(
          (plot) =>
            (where.userId === undefined || plot.userId === where.userId) &&
            (where.index === undefined || plot.index === where.index) &&
            (where.id === undefined || plot.id === where.id)
        ) ?? null,
      findMany: async ({
        where
      }: {
        where: { userId: string };
        orderBy?: { index: "asc" | "desc" };
      }) =>
        state.plots
          .filter((plot) => plot.userId === where.userId)
          .sort((left, right) => left.index - right.index),
      update: async ({
        where,
        data
      }: {
        where: { id: string };
        data: {
          status?: "EMPTY" | "PLANTED" | "READY_TO_HARVEST";
          vineId?: string | null;
        };
      }) => {
        const plot = state.plots.find((entry) => entry.id === where.id);
        if (!plot) {
          throw new Error("Plot not found");
        }
        if (data.status !== undefined) {
          plot.status = data.status;
        }
        if (data.vineId !== undefined) {
          plot.vineId = data.vineId;
        }
        plot.updatedAt = new Date();
        return plot;
      },
      create: async ({
        data
      }: {
        data: {
          userId: string;
          index: number;
          status?: "EMPTY" | "PLANTED" | "READY_TO_HARVEST";
          vineId?: string | null;
        };
      }) => {
        const duplicate = state.plots.some(
          (plot) => plot.userId === data.userId && plot.index === data.index
        );
        if (duplicate) {
          const error = new Error("Unique constraint violation") as Error & {
            code?: string;
          };
          error.code = "P2002";
          throw error;
        }
        const now = new Date();
        const plot: TestPlot = {
          id: nextId("plot"),
          userId: data.userId,
          index: data.index,
          status: data.status ?? "EMPTY",
          vineId: data.vineId ?? null,
          createdAt: now,
          updatedAt: now
        };
        state.plots.push(plot);
        return plot;
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
        orderBy?: { startsAt: "desc" | "asc" };
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
      findFirst: async ({
        where
      }: {
        where: {
          userId?: string;
          itemKey?:
            | "GRAPE"
            | "VINE"
            | "SCREW_CAP"
            | "CORK"
            | "STEEL_TANK_UNLOCK"
            | "OLD_OAK_BARREL_UNLOCK"
            | "NEW_OAK_BARREL_UNLOCK"
            | "NEW_PLOT";
        };
      }) =>
        state.inventories.find(
          (entry) =>
            (where.userId === undefined || entry.userId === where.userId) &&
            (where.itemKey === undefined || entry.itemKey === where.itemKey)
        ) ?? null,
      upsert: async ({
        where,
        update,
        create
      }: {
        where: {
          userId_itemKey: {
            userId: string;
            itemKey:
              | "GRAPE"
              | "VINE"
              | "SCREW_CAP"
              | "CORK"
              | "STEEL_TANK_UNLOCK"
              | "OLD_OAK_BARREL_UNLOCK"
              | "NEW_OAK_BARREL_UNLOCK"
              | "NEW_PLOT";
          };
        };
        update: {
          quantity?:
            | number
            | {
                increment?: number;
                decrement?: number;
              };
        };
        create: {
          userId: string;
          itemKey:
            | "GRAPE"
            | "VINE"
            | "SCREW_CAP"
            | "CORK"
            | "STEEL_TANK_UNLOCK"
            | "OLD_OAK_BARREL_UNLOCK"
            | "NEW_OAK_BARREL_UNLOCK"
            | "NEW_PLOT";
          quantity: number;
        };
      }) => {
        const existing = state.inventories.find(
          (entry) =>
            entry.userId === where.userId_itemKey.userId &&
            entry.itemKey === where.userId_itemKey.itemKey
        );
        if (existing) {
          existing.quantity = applyNumericUpdate(existing.quantity, update.quantity);
          existing.updatedAt = new Date();
          return existing;
        }
        const now = new Date();
        const createdEntry: TestInventory = {
          id: nextId("inventory"),
          userId: create.userId,
          itemKey: create.itemKey,
          quantity: create.quantity,
          createdAt: now,
          updatedAt: now
        };
        state.inventories.push(createdEntry);
        return createdEntry;
      },
      update: async ({
        where,
        data
      }: {
        where: { id: string };
        data: {
          quantity:
            | number
            | {
                increment?: number;
                decrement?: number;
              };
        };
      }) => {
        const entry = state.inventories.find((inventory) => inventory.id === where.id);
        if (!entry) {
          throw new Error("Inventory not found");
        }
        entry.quantity = applyNumericUpdate(entry.quantity, data.quantity);
        entry.updatedAt = new Date();
        return entry;
      }
    },
    vine: {
      count: async ({ where }: { where: { userId: string } }) =>
        state.vines.filter((entry) => entry.userId === where.userId).length,
      findFirst: async ({
        where
      }: {
        where: { userId?: string; plotId?: string; id?: string };
      }) =>
        state.vines.find(
          (vine) =>
            (where.userId === undefined || vine.userId === where.userId) &&
            (where.plotId === undefined || vine.plotId === where.plotId) &&
            (where.id === undefined || vine.id === where.id)
        ) ?? null,
      create: async ({
        data
      }: {
        data: {
          userId: string;
          plotId: string;
          harvestCount: number;
          state: "LOW_YIELD" | "BALANCED" | "OVERCROPPED";
          plantedAt: Date;
          readyAt: Date;
          lastHarvestedAt?: Date | null;
        };
      }) => {
        const now = new Date();
        const vine: TestVine = {
          id: nextId("vine"),
          userId: data.userId,
          plotId: data.plotId,
          harvestCount: data.harvestCount,
          state: data.state,
          plantedAt: data.plantedAt,
          readyAt: data.readyAt,
          lastHarvestedAt: data.lastHarvestedAt ?? null,
          createdAt: now,
          updatedAt: now
        };
        state.vines.push(vine);
        return vine;
      },
      update: async ({
        where,
        data
      }: {
        where: { id: string };
        data: {
          harvestCount?: number;
          state?: "LOW_YIELD" | "BALANCED" | "OVERCROPPED";
          plantedAt?: Date;
          readyAt?: Date;
          lastHarvestedAt?: Date | null;
        };
      }) => {
        const vine = state.vines.find((entry) => entry.id === where.id);
        if (!vine) {
          throw new Error("Vine not found");
        }
        if (data.harvestCount !== undefined) {
          vine.harvestCount = data.harvestCount;
        }
        if (data.state !== undefined) {
          vine.state = data.state;
        }
        if (data.plantedAt !== undefined) {
          vine.plantedAt = data.plantedAt;
        }
        if (data.readyAt !== undefined) {
          vine.readyAt = data.readyAt;
        }
        if (data.lastHarvestedAt !== undefined) {
          vine.lastHarvestedAt = data.lastHarvestedAt;
        }
        vine.updatedAt = new Date();
        return vine;
      }
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
    state,
    createInitialTutorialState
  };
}
