import type {
  AgingPlanKey,
  ClosureTypeKey,
  GameMoment,
  ProductionVesselKey,
  Season,
  ShopItemKey,
  TutorialState,
  VineStateKey,
  WineLabel,
  WineMetadata,
  WineProfile,
  WineQualityLevel,
  WineStyleTag,
  WineVerdict
} from "@chateau/shared";

export const ANONYMOUS_SESSION_STORAGE_KEY = "chateau_anonymous_session_id";

type FetchLike = typeof fetch;

type ApiClientOptions = {
  apiBaseUrl?: string;
  fetchImpl?: FetchLike;
};

type AnonymousIdCrypto = {
  randomUUID?: () => string;
  getRandomValues?: (array: Uint8Array) => Uint8Array;
};

export type SessionStartInput =
  | {
      telegramUserId: string;
      anonymousSessionId?: never;
    }
  | {
      telegramUserId?: never;
      anonymousSessionId: string;
    };

export type ChateauUserSummary = {
  id: string;
  telegramUserId?: string | null;
  walletAddress?: string | null;
  chainId?: number | null;
  baseProfileLinked?: boolean;
  grapeBalance: number;
  chateauLevel: 1 | 2 | 3;
  tutorialState: TutorialState;
  sommelierViolenceEnabled?: boolean;
  cowardMeter?: number;
};

export type InventoryItemSummary = {
  itemKey: string;
  quantity: number;
};

export type SessionStartResponse = {
  user: ChateauUserSummary;
  activeSeason: Season | null;
};

export type GameStateResponse = {
  user: Pick<
    ChateauUserSummary,
    "id" | "grapeBalance" | "chateauLevel" | "tutorialState"
  >;
  activeSeason: Season | null;
  plots: {
    total: number;
  };
  vines: {
    total: number;
  };
  inventory: {
    items: InventoryItemSummary[];
  };
  cellar: {
    usedSlots: number;
    maxSlots: number;
  } | null;
  preserve: {
    walletLinked: boolean;
    baseProfileLinked: boolean;
    preservedBatchCount: number;
  };
};

export type IdempotentMutationInput = {
  userId: string;
  idempotencyKey: string;
};

export type ShopBuyInput = IdempotentMutationInput & {
  itemKey: ShopItemKey;
  quantity: number;
};

export type ShopBuyResponse = {
  userId: string;
  itemKey: ShopItemKey;
  quantity: number;
  totalCost: number;
  grapeBalance: number;
};

export type VineMutationInput = IdempotentMutationInput & {
  plotId: string;
};

export type PlantVineResponse = {
  plotId: string;
  remainingVines: number;
  vine: {
    id: string;
    plotId: string;
    harvestCount: number;
    state: VineStateKey;
    plantedAt: string;
    readyAt: string;
  };
};

export type HarvestVineResponse = {
  plotId: string;
  grapesAdded: number;
  inventoryItemKey: "grape";
  grapeInventoryQuantity: number;
  grapeBalance: number;
  vine: {
    id: string;
    plotId: string;
    harvestCount: number;
    state: VineStateKey;
    plantedAt: string;
    readyAt: string;
    lastHarvestedAt: string | null;
  };
};

export type WineryRecipeInput = {
  userId: string;
  grapeAmount: number;
  productionVessel: ProductionVesselKey;
  agingPlan: AgingPlanKey;
  closureType: ClosureTypeKey;
};

export type WineryPreviewResponse = {
  canCraft: boolean;
  missingResources: {
    grapes?: number;
    screwCaps?: number;
    corks?: number;
  };
  requiredUnlocks: string[];
  estimatedBottleCount: number;
  applicableCaps: string[];
  maxPossibleQualityLevel: WineQualityLevel;
};

export type WineryCraftInput = WineryRecipeInput & {
  idempotencyKey: string;
};

export type WineCraftResponse = {
  id: string;
  userId: string;
  seasonId: string;
  seasonKey: string;
  gameConfigVersion: string;
  grapeAmount: number;
  bottleCount: number;
  vineState: VineStateKey;
  productionVessel: ProductionVesselKey;
  agingPlan: AgingPlanKey;
  closureType: ClosureTypeKey;
  rawQualityScore: number;
  rawQualityLevel: WineQualityLevel;
  qualityScore: number;
  qualityLevel: WineQualityLevel;
  capApplied: boolean;
  capCause: string | null;
  profile: WineProfile;
  styleTags: WineStyleTag[];
  label: WineLabel;
  moments: GameMoment[];
  primaryMoment: GameMoment | null;
  verdict: WineVerdict;
  salePrice: number;
  batchHash: string;
  metadataUri: string;
  onchainEligible: boolean;
  preservedOnchain: false;
  nftReadyMetadata: WineMetadata;
};

export class ApiError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function resolveApiBaseUrl(apiBaseUrl = process.env.NEXT_PUBLIC_CHATEAU_API_BASE_URL) {
  return (apiBaseUrl ?? "").replace(/\/+$/, "");
}

function buildApiUrl(path: string, apiBaseUrl?: string): string {
  return `${resolveApiBaseUrl(apiBaseUrl)}${path}`;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as unknown;
    if (
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
    ) {
      return payload.message;
    }
    if (
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
    ) {
      return payload.error;
    }
  } catch {
    // Fall through to status text when response body is not JSON.
  }

  return response.statusText || `API request failed with status ${response.status}`;
}

async function requestJson<TResponse>(
  path: string,
  init: RequestInit,
  options: ApiClientOptions = {}
): Promise<TResponse> {
  const fetchImpl = options.fetchImpl ?? fetch;

  let response: Response;
  try {
    response = await fetchImpl(buildApiUrl(path, options.apiBaseUrl), {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init.headers ?? {})
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network request failed";
    throw new ApiError(message, null);
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  return (await response.json()) as TResponse;
}

function createAnonymousSessionId(cryptoProvider: AnonymousIdCrypto): string {
  if (typeof cryptoProvider.randomUUID === "function") {
    return cryptoProvider.randomUUID();
  }

  if (typeof cryptoProvider.getRandomValues === "function") {
    const bytes = cryptoProvider.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  throw new ApiError("Secure browser crypto is unavailable", null);
}

export function createClientIdempotencyKey(
  cryptoProvider: AnonymousIdCrypto = globalThis.crypto
): string {
  return createAnonymousSessionId(cryptoProvider);
}

export function getOrCreateAnonymousSessionId(
  storage: Pick<Storage, "getItem" | "setItem">,
  cryptoProvider: AnonymousIdCrypto = globalThis.crypto
): string {
  const existing = storage.getItem(ANONYMOUS_SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const created = createAnonymousSessionId(cryptoProvider);
  storage.setItem(ANONYMOUS_SESSION_STORAGE_KEY, created);
  return created;
}

export async function startSession(
  input: SessionStartInput,
  options: ApiClientOptions = {}
): Promise<SessionStartResponse> {
  return requestJson<SessionStartResponse>(
    "/api/session/start",
    {
      method: "POST",
      body: JSON.stringify(input)
    },
    options
  );
}

export async function getGameState(
  userId: string,
  options: ApiClientOptions = {}
): Promise<GameStateResponse> {
  return requestJson<GameStateResponse>(
    `/api/game/state?userId=${encodeURIComponent(userId)}`,
    {
      method: "GET"
    },
    options
  );
}

export async function buyShopItem(
  input: ShopBuyInput,
  options: ApiClientOptions = {}
): Promise<ShopBuyResponse> {
  return requestJson<ShopBuyResponse>(
    "/api/shop/buy",
    {
      method: "POST",
      body: JSON.stringify(input)
    },
    options
  );
}

export async function plantVine(
  input: VineMutationInput,
  options: ApiClientOptions = {}
): Promise<PlantVineResponse> {
  return requestJson<PlantVineResponse>(
    "/api/vines/plant",
    {
      method: "POST",
      body: JSON.stringify(input)
    },
    options
  );
}

export async function harvestVine(
  input: VineMutationInput,
  options: ApiClientOptions = {}
): Promise<HarvestVineResponse> {
  return requestJson<HarvestVineResponse>(
    "/api/vines/harvest",
    {
      method: "POST",
      body: JSON.stringify(input)
    },
    options
  );
}

export async function previewWinery(
  input: WineryRecipeInput,
  options: ApiClientOptions = {}
): Promise<WineryPreviewResponse> {
  return requestJson<WineryPreviewResponse>(
    "/api/winery/preview",
    {
      method: "POST",
      body: JSON.stringify(input)
    },
    options
  );
}

export async function craftWine(
  input: WineryCraftInput,
  options: ApiClientOptions = {}
): Promise<WineCraftResponse> {
  return requestJson<WineCraftResponse>(
    "/api/winery/craft",
    {
      method: "POST",
      body: JSON.stringify(input)
    },
    options
  );
}
