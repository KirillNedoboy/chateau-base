"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ShopItemKey } from "@chateau/shared";
import { type InteractionZoneId } from "../game/mapConfig";
import { CellarModal } from "../features/cellar/CellarModal";
import { formatKey, getTutorialLine } from "../features/game-ui/viewModels";
import { MarketModal } from "../features/market/MarketModal";
import { PlotModal } from "../features/plots/PlotModal";
import { ShareModal } from "../features/share/ShareModal";
import { ShopModal } from "../features/shop/ShopModal";
import { WineResultScreen } from "../features/wine-result/WineResultScreen";
import { WineryModal } from "../features/winery/WineryModal";
import {
  createWineryDraftKey,
  type DraftBoundWineryPreview
} from "../features/winery/viewModel";
import {
  ApiError,
  buyShopItem,
  craftWine,
  createClientIdempotencyKey,
  createShare,
  type GameStateResponse,
  getGameState,
  getOrCreateAnonymousSessionId,
  harvestVine,
  plantVine,
  previewWinery,
  startSession,
  type WineCraftResponse,
  type WineryRecipeInput
} from "../lib/api";

const PhaserMap = dynamic(
  () => import("./game/PhaserMap").then((module) => module.PhaserMap),
  {
    loading: () => (
      <section className="map-panel" aria-label="Chateau map loading">
        <div className="map-loading">Loading chateau map</div>
      </section>
    ),
    ssr: false
  }
);

type ShellLoadState =
  | {
      status: "idle" | "loading-session" | "loading-game-state";
      gameState: GameStateResponse | null;
      error: null;
    }
  | {
      status: "ready";
      gameState: GameStateResponse;
      error: null;
    }
  | {
      status: "error";
      gameState: GameStateResponse | null;
      error: string;
    };

type OperationState = {
  busy: boolean;
  error: string | null;
  message: string | null;
};

type ShareMode = "classy" | "degen";
type WineryRecipeDraft = Omit<WineryRecipeInput, "userId">;

const IDLE_OPERATION: OperationState = {
  busy: false,
  error: null,
  message: null
};

type TelegramWebApp = {
  initDataUnsafe?: {
    user?: {
      id?: number | string;
    };
  };
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

function getTelegramUserId(): string | null {
  const telegramUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  if (telegramUserId === undefined || telegramUserId === null) {
    return null;
  }

  return String(telegramUserId);
}

function shortId(id: string): string {
  if (id.length <= 12) {
    return id;
  }

  return `${id.slice(0, 6)}...${id.slice(-4)}`;
}

function tutorialPrompt(state: GameStateResponse["user"]["tutorialState"]): string {
  if (state.status === "completed") {
    return "First vintage complete. Wallet unlocks after first vintage.";
  }

  if (state.currentStep === "session_started") {
    return "Start by buying a vine when the shop opens.";
  }

  if (state.currentStep === "vine_bought") {
    return "Plant the vine, then wait for harvest.";
  }

  if (state.currentStep === "vine_harvested") {
    return "Walk to the winery and craft the first bottle.";
  }

  return "Follow the next cellar prompt as the game loop opens.";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.status === null ? `Network error: ${error.message}` : error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected app error";
}

function InventorySummary({ items }: { items: GameStateResponse["inventory"]["items"] }) {
  if (items.length === 0) {
    return <p className="muted">No inventory yet.</p>;
  }

  return (
    <ul className="inventory-list" aria-label="Inventory">
      {items.map((item) => (
        <li key={item.itemKey}>
          <span>{formatKey(item.itemKey)}</span>
          <strong>{item.quantity}</strong>
        </li>
      ))}
    </ul>
  );
}

function StatusPill({ children }: { children: React.ReactNode }) {
  return <span className="status-pill">{children}</span>;
}

export function WebShell() {
  const [state, setState] = useState<ShellLoadState>({
    status: "idle",
    gameState: null,
    error: null
  });
  const [activeZone, setActiveZone] = useState<InteractionZoneId | null>(null);
  const [operation, setOperation] = useState<OperationState>(IDLE_OPERATION);
  const [wineryPreviewResult, setWineryPreviewResult] =
    useState<DraftBoundWineryPreview | null>(null);
  const [wineResult, setWineResult] = useState<WineCraftResponse | null>(null);
  const [shareMode, setShareMode] = useState<ShareMode | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const loadShell = useCallback(async () => {
    setState((current) => ({
      status: "loading-session",
      gameState: current.gameState,
      error: null
    }));

    try {
      const telegramUserId = getTelegramUserId();
      const session = await startSession(
        telegramUserId
          ? { telegramUserId }
          : {
              anonymousSessionId: getOrCreateAnonymousSessionId(window.localStorage)
            }
      );

      setState({
        status: "loading-game-state",
        gameState: null,
        error: null
      });

      const gameState = await getGameState(session.user.id);
      setState({
        status: "ready",
        gameState,
        error: null
      });
    } catch (error) {
      setState((current) => ({
        status: "error",
        gameState: current.gameState,
        error: getErrorMessage(error)
      }));
    }
  }, []);

  useEffect(() => {
    void loadShell();
  }, [loadShell]);

  const gameState = state.gameState;
  const loadingLabel = useMemo(() => {
    if (state.status === "loading-session") {
      return "Loading session";
    }
    if (state.status === "loading-game-state") {
      return "Loading game state";
    }
    return null;
  }, [state.status]);

  const refreshGameState = useCallback(async (userId: string) => {
    const gameState = await getGameState(userId);
    setState({
      status: "ready",
      gameState,
      error: null
    });
    return gameState;
  }, []);

  const runMutation = useCallback(
    async (mutation: () => Promise<string>) => {
      setOperation({
        busy: true,
        error: null,
        message: null
      });

      try {
        const message = await mutation();
        setOperation({
          busy: false,
          error: null,
          message
        });
      } catch (error) {
        setOperation({
          busy: false,
          error: getErrorMessage(error),
          message: null
        });
      }
    },
    []
  );

  const handleMapInteract = useCallback((zoneId: InteractionZoneId) => {
    setActiveZone(zoneId);
    setOperation(IDLE_OPERATION);
  }, []);

  const closeInteraction = useCallback(() => {
    setActiveZone(null);
    setOperation(IDLE_OPERATION);
    setWineryPreviewResult(null);
  }, []);

  const currentUserId = gameState?.user.id ?? null;

  const handleBuyShopItem = useCallback(
    (itemKey: ShopItemKey) => {
      if (!currentUserId) {
        return;
      }

      void runMutation(async () => {
        const result = await buyShopItem({
          userId: currentUserId,
          itemKey,
          quantity: 1,
          idempotencyKey: createClientIdempotencyKey()
        });
        await refreshGameState(currentUserId);
        return `Bought ${formatKey(result.itemKey)}. Balance: ${result.grapeBalance} GRAPE.`;
      });
    },
    [currentUserId, refreshGameState, runMutation]
  );

  const handlePlantVine = useCallback(
    (plotId: string) => {
      if (!currentUserId) {
        return;
      }

      void runMutation(async () => {
        const result = await plantVine({
          userId: currentUserId,
          plotId,
          idempotencyKey: createClientIdempotencyKey()
        });
        await refreshGameState(currentUserId);
        return `Planted vine. Ready at ${new Date(result.vine.readyAt).toLocaleTimeString()}.`;
      });
    },
    [currentUserId, refreshGameState, runMutation]
  );

  const handleHarvestVine = useCallback(
    (plotId: string) => {
      if (!currentUserId) {
        return;
      }

      void runMutation(async () => {
        const result = await harvestVine({
          userId: currentUserId,
          plotId,
          idempotencyKey: createClientIdempotencyKey()
        });
        await refreshGameState(currentUserId);
        return `Harvested ${result.grapesAdded} grapes. Inventory: ${result.grapeInventoryQuantity}.`;
      });
    },
    [currentUserId, refreshGameState, runMutation]
  );

  const handlePreviewWinery = useCallback(
    (recipe: WineryRecipeDraft) => {
      if (!currentUserId) {
        return;
      }

      void runMutation(async () => {
        const preview = await previewWinery({
          userId: currentUserId,
          ...recipe
        });
        setWineryPreviewResult({
          draftKey: createWineryDraftKey(recipe),
          result: preview
        });
        return preview.canCraft ? "Preview ready. Recipe can craft." : "Preview blocked.";
      });
    },
    [currentUserId, runMutation]
  );

  const handleCraftWine = useCallback(
    (recipe: WineryRecipeDraft) => {
      if (!currentUserId) {
        return;
      }

      void runMutation(async () => {
        const result = await craftWine({
          userId: currentUserId,
          ...recipe,
          idempotencyKey: createClientIdempotencyKey()
        });
        setWineResult(result);
        setActiveZone(null);
        setWineryPreviewResult(null);
        await refreshGameState(currentUserId);
        return `Revealed ${formatKey(result.qualityLevel)}.`;
      });
    },
    [currentUserId, refreshGameState, runMutation]
  );

  const handleCreateShare = useCallback(
    (mode: ShareMode) => {
      if (!currentUserId || !wineResult) {
        return;
      }

      void runMutation(async () => {
        const share = await createShare({
          userId: currentUserId,
          batchId: wineResult.id,
          type: "wine_result",
          mode,
          idempotencyKey: createClientIdempotencyKey()
        });
        setShareUrl(share.deeplinkUrl);
        return "Share link created.";
      });
    },
    [currentUserId, runMutation, wineResult]
  );

  return (
    <main className="shell">
      <section className="hero-band" aria-labelledby="app-title">
        <div>
          <p className="eyebrow">Backend decides. Base preserves.</p>
          <h1 id="app-title">Chateau Base</h1>
          <p className="hero-copy">
            Make wine. Get judged. Flex the bottle. Stay based.
          </p>
        </div>
        <StatusPill>Wallet unlocks after first vintage</StatusPill>
      </section>

      <PhaserMap onInteract={handleMapInteract} />

      {wineResult ? (
        <WineResultScreen
          result={wineResult}
          userId={wineResult.userId}
          onClose={() => {
            setWineResult(null);
          }}
          onRunItBack={() => {
            setActiveZone("production");
          }}
          onSharePlaceholder={(mode) => {
            setShareMode(mode);
            setShareUrl(null);
            setOperation(IDLE_OPERATION);
          }}
          onPreserveSubmitted={(confirmation) => {
            setWineResult((current) =>
              current && current.id === wineResult.id
                ? {
                    ...current,
                    preservedOnchain: confirmation.preservedOnchain,
                    preserveTxHash: confirmation.preserveTxHash,
                    preserveChainId: confirmation.preserveChainId,
                    preservedAt: confirmation.preservedAt
                  }
                : current
            );
          }}
        />
      ) : null}

      {shareMode && wineResult ? (
        <ShareModal
          mode={shareMode}
          busy={operation.busy}
          error={operation.error}
          message={operation.message}
          shareUrl={shareUrl}
          onCreateShare={() => {
            handleCreateShare(shareMode);
          }}
          onClose={() => {
            setShareMode(null);
            setShareUrl(null);
            setOperation(IDLE_OPERATION);
          }}
        />
      ) : null}

      {activeZone && !gameState ? (
        <section className="panel interaction-panel" role="dialog">
          <div>
            <p className="section-label">Interaction</p>
            <h2>{formatKey(activeZone)}</h2>
            <p className="prompt-text">Game state is still loading.</p>
          </div>
          <button type="button" className="secondary-button" onClick={closeInteraction}>
            Close
          </button>
        </section>
      ) : null}

      {activeZone === "shop" && gameState ? (
        <ShopModal
          busy={operation.busy}
          error={operation.error}
          message={operation.message}
          onBuy={handleBuyShopItem}
          onClose={closeInteraction}
        />
      ) : null}

      {activeZone?.startsWith("plot_") && gameState ? (
        <PlotModal
          plotId={activeZone}
          gameState={gameState}
          busy={operation.busy}
          error={operation.error}
          message={operation.message}
          onPlant={() => {
            handlePlantVine(activeZone);
          }}
          onHarvest={() => {
            handleHarvestVine(activeZone);
          }}
          onClose={closeInteraction}
        />
      ) : null}

      {activeZone === "production" && gameState && currentUserId ? (
        <WineryModal
          userId={currentUserId}
          gameState={gameState}
          preview={wineryPreviewResult}
          busy={operation.busy}
          error={operation.error}
          message={operation.message}
          onPreview={handlePreviewWinery}
          onCraft={handleCraftWine}
          onClose={closeInteraction}
        />
      ) : null}

      {activeZone === "cellar" && gameState ? (
        <CellarModal gameState={gameState} onClose={closeInteraction} />
      ) : null}

      {activeZone === "market" ? <MarketModal onClose={closeInteraction} /> : null}

      {activeZone === "ghost_sommelier" && gameState ? (
        <section className="panel modal-panel" role="dialog" aria-labelledby="ghost-title">
          <div className="panel-heading">
            <div>
              <p className="section-label">Ghost Sommelier</p>
              <h2 id="ghost-title">Tutorial Prompt</h2>
            </div>
            <button type="button" className="secondary-button" onClick={closeInteraction}>
              Close
            </button>
          </div>
          <p className="prompt-text">
            {getTutorialLine(gameState.user.tutorialState.currentStep)}
          </p>
        </section>
      ) : null}

      {activeZone === "chateau" ? (
        <section className="panel modal-panel" role="dialog" aria-labelledby="chateau-title">
          <div className="panel-heading">
            <div>
              <p className="section-label">Chateau</p>
              <h2 id="chateau-title">Profile Placeholder</h2>
            </div>
            <button type="button" className="secondary-button" onClick={closeInteraction}>
              Close
            </button>
          </div>
          <p className="muted">Wallet profile UX is outside Plan 013.</p>
        </section>
      ) : null}

      {loadingLabel ? (
        <section className="panel" aria-live="polite">
          <p className="section-label">{loadingLabel}</p>
          <div className="loading-line" />
        </section>
      ) : null}

      {state.status === "error" ? (
        <section className="panel error-panel" role="alert">
          <p className="section-label">API error</p>
          <p>{state.error}</p>
          <button type="button" onClick={loadShell}>
            Retry
          </button>
        </section>
      ) : null}

      {gameState ? (
        <div className="dashboard-grid">
          <section className="panel summary-panel">
            <div className="panel-heading">
              <p className="section-label">Winemaker</p>
              <StatusPill>Level {gameState.user.chateauLevel}</StatusPill>
            </div>
            <dl className="summary-list">
              <div>
                <dt>User</dt>
                <dd>{shortId(gameState.user.id)}</dd>
              </div>
              <div>
                <dt>GRAPE</dt>
                <dd>{gameState.user.grapeBalance}</dd>
              </div>
              <div>
                <dt>Plots</dt>
                <dd>{gameState.plots.total}</dd>
              </div>
              <div>
                <dt>Vines</dt>
                <dd>{gameState.vines.total}</dd>
              </div>
            </dl>
          </section>

          <section className="panel">
            <p className="section-label">Active season</p>
            {gameState.activeSeason ? (
              <div className="season-block">
                <h2>{gameState.activeSeason.name}</h2>
                <p>{formatKey(gameState.activeSeason.key)}</p>
              </div>
            ) : (
              <p className="muted">No active season.</p>
            )}
          </section>

          <section className="panel">
            <div className="panel-heading">
              <p className="section-label">Tutorial</p>
              <StatusPill>{formatKey(gameState.user.tutorialState.status)}</StatusPill>
            </div>
            <p className="prompt-text">{tutorialPrompt(gameState.user.tutorialState)}</p>
            <p className="muted">
              Current step:{" "}
              {gameState.user.tutorialState.currentStep
                ? formatKey(gameState.user.tutorialState.currentStep)
                : "None"}
            </p>
          </section>

          <section className="panel">
            <p className="section-label">Inventory</p>
            <InventorySummary items={gameState.inventory.items} />
          </section>
        </div>
      ) : null}
    </main>
  );
}
