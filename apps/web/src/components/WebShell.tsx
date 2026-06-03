"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ApiError,
  type GameStateResponse,
  getGameState,
  getOrCreateAnonymousSessionId,
  startSession
} from "../lib/api";

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

function formatKey(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part[0] ? `${part[0].toUpperCase()}${part.slice(1)}` : part)
    .join(" ");
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
