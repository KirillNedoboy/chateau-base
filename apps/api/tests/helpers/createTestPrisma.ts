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
  seasonId: string;
  seasonKey: "GENESIS_HARVEST";
  gameConfigVersion: string;
  batchHash: string;
  metadataUri: string | null;
  onchainEligible: boolean;
  preservedOnchain: boolean;
  preserveTxHash: string | null;
  preserveChainId: number | null;
  preservedAt: Date | null;
  qualityLevel: "COMMON" | "GOOD" | "PREMIUM" | "GRAND_CRU" | "LEGENDARY";
  qualityScore: number;
  rawQualityScore: number;
  rawQualityLevel: "COMMON" | "GOOD" | "PREMIUM" | "GRAND_CRU" | "LEGENDARY";
  capApplied: boolean;
  capAppliedLevel: "COMMON" | "GOOD" | "PREMIUM" | "GRAND_CRU" | "LEGENDARY" | null;
  capCause: string | null;
  productionVessel: "STEEL_TANK" | "OLD_OAK_BARREL" | "NEW_OAK_BARREL";
  agingPlan:
    | "NO_AGING"
    | "SHORT_OLD_OAK_AGING"
    | "NEW_OAK_AGING"
    | "NEW_TO_OLD_OAK_AGING";
  closureType: "SCREW_CAP" | "CORK";
  vineState: "LOW_YIELD" | "BALANCED" | "OVERCROPPED";
  grapeAmount: number;
  bottleCount: number;
  profile: JsonValue | null;
  styleTags: JsonValue | null;
  label: JsonValue | null;
  moments: JsonValue | null;
  primaryMoment: string | null;
  verdict: JsonValue | null;
  nftReadyMetadata: JsonValue | null;
  recipe: JsonValue | null;
  salePrice: number | null;
  status: "REVEALED" | "STORED" | "SOLD";
  createdAt: Date;
  soldAt: Date | null;
  storedAt: Date | null;
  updatedAt: Date;
};

type TestRecipeHistory = {
  id: string;
  userId: string;
  productionVessel: "STEEL_TANK" | "OLD_OAK_BARREL" | "NEW_OAK_BARREL";
  agingPlan:
    | "NO_AGING"
    | "SHORT_OLD_OAK_AGING"
    | "NEW_OAK_AGING"
    | "NEW_TO_OLD_OAK_AGING";
  closureType: "SCREW_CAP" | "CORK";
  vineState: "LOW_YIELD" | "BALANCED" | "OVERCROPPED";
  timesUsed: number;
  bestScore: number;
  bestQualityLevel: "COMMON" | "GOOD" | "PREMIUM" | "GRAND_CRU" | "LEGENDARY";
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type TestOnchainEvent = {
  id: string;
  userId: string;
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
  recipeHistory: TestRecipeHistory[];
  onchainEvents: TestOnchainEvent[];
  beforeNextInventoryUpdateMany?: (() => void) | null;
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
    wineBatches: [],
    recipeHistory: [],
    onchainEvents: [],
    beforeNextInventoryUpdateMany: null
  };

  let idCounter = 0;
  const nextId = (prefix: string) => `${prefix}_${++idCounter}`;

  const prismaLike = {
    $transaction: async <T>(handler: (tx: typeof prismaLike) => Promise<T>) => {
      const snapshot = {
        users: structuredClone(state.users),
        seasons: structuredClone(state.seasons),
        gameEvents: structuredClone(state.gameEvents),
        gameActionLogs: structuredClone(state.gameActionLogs),
        plots: structuredClone(state.plots),
        cellars: structuredClone(state.cellars),
        inventories: structuredClone(state.inventories),
        vines: structuredClone(state.vines),
        wineBatches: structuredClone(state.wineBatches),
        recipeHistory: structuredClone(state.recipeHistory),
        onchainEvents: structuredClone(state.onchainEvents)
      };

      try {
        return await handler(prismaLike);
      } catch (error) {
        state.users = snapshot.users;
        state.seasons = snapshot.seasons;
        state.gameEvents = snapshot.gameEvents;
        state.gameActionLogs = snapshot.gameActionLogs;
        state.plots = snapshot.plots;
        state.cellars = snapshot.cellars;
        state.inventories = snapshot.inventories;
        state.vines = snapshot.vines;
        state.wineBatches = snapshot.wineBatches;
        state.recipeHistory = snapshot.recipeHistory;
        state.onchainEvents = snapshot.onchainEvents;
        throw error;
      }
    },
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
      },
      updateMany: async ({
        where,
        data
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
          quantity?: { gte?: number };
        };
        data: {
          quantity:
            | number
            | {
                increment?: number;
                decrement?: number;
              };
        };
      }) => {
        const beforeHook = state.beforeNextInventoryUpdateMany;
        state.beforeNextInventoryUpdateMany = null;
        beforeHook?.();

        const matching = state.inventories.filter(
          (entry) =>
            (where.userId === undefined || entry.userId === where.userId) &&
            (where.itemKey === undefined || entry.itemKey === where.itemKey) &&
            (where.quantity?.gte === undefined || entry.quantity >= where.quantity.gte)
        );

        for (const entry of matching) {
          entry.quantity = applyNumericUpdate(entry.quantity, data.quantity);
          entry.updatedAt = new Date();
        }

        return { count: matching.length };
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
        ).length,
      findMany: async ({ where }: { where: { userId: string } }) =>
        state.wineBatches.filter((entry) => entry.userId === where.userId),
      create: async ({
        data
      }: {
        data: {
          id?: string;
          userId: string;
          seasonId: string;
          seasonKey: "GENESIS_HARVEST";
          gameConfigVersion: string;
          batchHash: string;
          metadataUri?: string | null;
          onchainEligible?: boolean;
          preservedOnchain?: boolean;
          qualityLevel: "COMMON" | "GOOD" | "PREMIUM" | "GRAND_CRU" | "LEGENDARY";
          qualityScore: number;
          rawQualityScore: number;
          rawQualityLevel: "COMMON" | "GOOD" | "PREMIUM" | "GRAND_CRU" | "LEGENDARY";
          capApplied?: boolean;
          capAppliedLevel?:
            | "COMMON"
            | "GOOD"
            | "PREMIUM"
            | "GRAND_CRU"
            | "LEGENDARY"
            | null;
          capCause?: string | null;
          productionVessel: "STEEL_TANK" | "OLD_OAK_BARREL" | "NEW_OAK_BARREL";
          agingPlan:
            | "NO_AGING"
            | "SHORT_OLD_OAK_AGING"
            | "NEW_OAK_AGING"
            | "NEW_TO_OLD_OAK_AGING";
          closureType: "SCREW_CAP" | "CORK";
          vineState: "LOW_YIELD" | "BALANCED" | "OVERCROPPED";
          grapeAmount: number;
          bottleCount: number;
          profile?: JsonValue | null;
          styleTags?: JsonValue | null;
          label?: JsonValue | null;
          moments?: JsonValue | null;
          primaryMoment?: string | null;
          verdict?: JsonValue | null;
          nftReadyMetadata?: JsonValue | null;
          recipe?: JsonValue | null;
          salePrice?: number | null;
        };
      }) => {
        const duplicate = state.wineBatches.find(
          (entry) => entry.batchHash === data.batchHash
        );
        if (duplicate) {
          const error = new Error("Unique constraint violation") as Error & {
            code?: string;
          };
          error.code = "P2002";
          throw error;
        }
        const now = new Date();
        const batch: TestWineBatch = {
          id: data.id ?? nextId("wine_batch"),
          userId: data.userId,
          seasonId: data.seasonId,
          seasonKey: data.seasonKey,
          gameConfigVersion: data.gameConfigVersion,
          batchHash: data.batchHash,
          metadataUri: data.metadataUri ?? null,
          onchainEligible: data.onchainEligible ?? false,
          preservedOnchain: data.preservedOnchain ?? false,
          preserveTxHash: null,
          preserveChainId: null,
          preservedAt: null,
          qualityLevel: data.qualityLevel,
          qualityScore: data.qualityScore,
          rawQualityScore: data.rawQualityScore,
          rawQualityLevel: data.rawQualityLevel,
          capApplied: data.capApplied ?? false,
          capAppliedLevel: data.capAppliedLevel ?? null,
          capCause: data.capCause ?? null,
          productionVessel: data.productionVessel,
          agingPlan: data.agingPlan,
          closureType: data.closureType,
          vineState: data.vineState,
          grapeAmount: data.grapeAmount,
          bottleCount: data.bottleCount,
          profile: data.profile ?? null,
          styleTags: data.styleTags ?? null,
          label: data.label ?? null,
          moments: data.moments ?? null,
          primaryMoment: data.primaryMoment ?? null,
          verdict: data.verdict ?? null,
          nftReadyMetadata: data.nftReadyMetadata ?? null,
          recipe: data.recipe ?? null,
          salePrice: data.salePrice ?? null,
          status: "REVEALED",
          createdAt: now,
          soldAt: null,
          storedAt: null,
          updatedAt: now
        };
        state.wineBatches.push(batch);
        return batch;
      }
    },
    recipeHistory: {
      findUnique: async ({
        where
      }: {
        where: {
          userId_productionVessel_agingPlan_closureType_vineState: {
            userId: string;
            productionVessel: "STEEL_TANK" | "OLD_OAK_BARREL" | "NEW_OAK_BARREL";
            agingPlan:
              | "NO_AGING"
              | "SHORT_OLD_OAK_AGING"
              | "NEW_OAK_AGING"
              | "NEW_TO_OLD_OAK_AGING";
            closureType: "SCREW_CAP" | "CORK";
            vineState: "LOW_YIELD" | "BALANCED" | "OVERCROPPED";
          };
        };
      }) => {
        const unique = where.userId_productionVessel_agingPlan_closureType_vineState;
        return (
          state.recipeHistory.find(
            (entry) =>
              entry.userId === unique.userId &&
              entry.productionVessel === unique.productionVessel &&
              entry.agingPlan === unique.agingPlan &&
              entry.closureType === unique.closureType &&
              entry.vineState === unique.vineState
          ) ?? null
        );
      },
      update: async ({
        where,
        data
      }: {
        where: { id: string };
        data: {
          timesUsed?: { increment?: number };
          bestScore?: number;
          bestQualityLevel?: "COMMON" | "GOOD" | "PREMIUM" | "GRAND_CRU" | "LEGENDARY";
          lastUsedAt?: Date;
        };
      }) => {
        const existing = state.recipeHistory.find((entry) => entry.id === where.id);
        if (!existing) {
          throw new Error("RecipeHistory not found");
        }
        existing.timesUsed += data.timesUsed?.increment ?? 0;
        if (data.bestScore !== undefined) {
          existing.bestScore = data.bestScore;
        }
        if (data.bestQualityLevel !== undefined) {
          existing.bestQualityLevel = data.bestQualityLevel;
        }
        if (data.lastUsedAt !== undefined) {
          existing.lastUsedAt = data.lastUsedAt;
        }
        existing.updatedAt = new Date();
        return existing;
      },
      create: async ({
        data
      }: {
        data: {
          userId: string;
          productionVessel: "STEEL_TANK" | "OLD_OAK_BARREL" | "NEW_OAK_BARREL";
          agingPlan:
            | "NO_AGING"
            | "SHORT_OLD_OAK_AGING"
            | "NEW_OAK_AGING"
            | "NEW_TO_OLD_OAK_AGING";
          closureType: "SCREW_CAP" | "CORK";
          vineState: "LOW_YIELD" | "BALANCED" | "OVERCROPPED";
          timesUsed: number;
          bestScore: number;
          bestQualityLevel: "COMMON" | "GOOD" | "PREMIUM" | "GRAND_CRU" | "LEGENDARY";
          lastUsedAt: Date;
        };
      }) => {
        const now = new Date();
        const history: TestRecipeHistory = {
          id: nextId("recipe"),
          userId: data.userId,
          productionVessel: data.productionVessel,
          agingPlan: data.agingPlan,
          closureType: data.closureType,
          vineState: data.vineState,
          timesUsed: data.timesUsed,
          bestScore: data.bestScore,
          bestQualityLevel: data.bestQualityLevel,
          lastUsedAt: data.lastUsedAt,
          createdAt: now,
          updatedAt: now
        };
        state.recipeHistory.push(history);
        return history;
      },
      upsert: async ({
        where,
        update,
        create
      }: {
        where: {
          userId_productionVessel_agingPlan_closureType_vineState: {
            userId: string;
            productionVessel: "STEEL_TANK" | "OLD_OAK_BARREL" | "NEW_OAK_BARREL";
            agingPlan:
              | "NO_AGING"
              | "SHORT_OLD_OAK_AGING"
              | "NEW_OAK_AGING"
              | "NEW_TO_OLD_OAK_AGING";
            closureType: "SCREW_CAP" | "CORK";
            vineState: "LOW_YIELD" | "BALANCED" | "OVERCROPPED";
          };
        };
        update: {
          timesUsed?: { increment?: number };
          bestScore: number;
          bestQualityLevel: "COMMON" | "GOOD" | "PREMIUM" | "GRAND_CRU" | "LEGENDARY";
          lastUsedAt: Date;
        };
        create: {
          userId: string;
          productionVessel: "STEEL_TANK" | "OLD_OAK_BARREL" | "NEW_OAK_BARREL";
          agingPlan:
            | "NO_AGING"
            | "SHORT_OLD_OAK_AGING"
            | "NEW_OAK_AGING"
            | "NEW_TO_OLD_OAK_AGING";
          closureType: "SCREW_CAP" | "CORK";
          vineState: "LOW_YIELD" | "BALANCED" | "OVERCROPPED";
          timesUsed: number;
          bestScore: number;
          bestQualityLevel: "COMMON" | "GOOD" | "PREMIUM" | "GRAND_CRU" | "LEGENDARY";
          lastUsedAt: Date;
        };
      }) => {
        const unique = where.userId_productionVessel_agingPlan_closureType_vineState;
        const existing = state.recipeHistory.find(
          (entry) =>
            entry.userId === unique.userId &&
            entry.productionVessel === unique.productionVessel &&
            entry.agingPlan === unique.agingPlan &&
            entry.closureType === unique.closureType &&
            entry.vineState === unique.vineState
        );
        if (existing) {
          existing.timesUsed += update.timesUsed?.increment ?? 0;
          existing.bestScore = Math.max(existing.bestScore, update.bestScore);
          existing.bestQualityLevel = update.bestQualityLevel;
          existing.lastUsedAt = update.lastUsedAt;
          existing.updatedAt = new Date();
          return existing;
        }
        const now = new Date();
        const history: TestRecipeHistory = {
          id: nextId("recipe"),
          userId: create.userId,
          productionVessel: create.productionVessel,
          agingPlan: create.agingPlan,
          closureType: create.closureType,
          vineState: create.vineState,
          timesUsed: create.timesUsed,
          bestScore: create.bestScore,
          bestQualityLevel: create.bestQualityLevel,
          lastUsedAt: create.lastUsedAt,
          createdAt: now,
          updatedAt: now
        };
        state.recipeHistory.push(history);
        return history;
      }
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
