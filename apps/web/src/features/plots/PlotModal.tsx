import type { GameStateResponse } from "../../lib/api";
import {
  formatKey,
  getInventoryQuantity,
  getPlotStatusCopy,
  getPlotIndex
} from "../game-ui/viewModels";

type PlotModalProps = {
  plotId: string;
  gameState: GameStateResponse;
  busy: boolean;
  error: string | null;
  message: string | null;
  onPlant: () => void;
  onHarvest: () => void;
  onClose: () => void;
};

export function PlotModal({
  plotId,
  gameState,
  busy,
  error,
  message,
  onPlant,
  onHarvest,
  onClose
}: PlotModalProps) {
  const plotIndex = getPlotIndex(plotId);
  const unlocked = plotIndex >= 1 && plotIndex <= gameState.plots.total;
  const vineInventory = getInventoryQuantity(gameState.inventory.items, "vine");
  const statusCopy = getPlotStatusCopy(plotId, gameState.plots.total);

  return (
    <section className="panel modal-panel" role="dialog" aria-labelledby="plot-title">
      <div className="panel-heading">
        <div>
          <p className="section-label">Vineyard Plot</p>
          <h2 id="plot-title">{formatKey(plotId)}</h2>
        </div>
        <button type="button" className="secondary-button" onClick={onClose}>
          Close
        </button>
      </div>

      <dl className="summary-list compact-summary">
        <div>
          <dt>Status</dt>
          <dd>{statusCopy}</dd>
        </div>
        <div>
          <dt>Vines in bag</dt>
          <dd>{vineInventory}</dd>
        </div>
      </dl>
      <p className="muted">
        Plot occupancy and harvest readiness are checked by the backend on action.
      </p>

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}

      <div className="action-row">
        <button type="button" disabled={!unlocked || busy || vineInventory < 1} onClick={onPlant}>
          Plant Vine
        </button>
        <button type="button" disabled={!unlocked || busy} onClick={onHarvest}>
          Harvest Grapes
        </button>
      </div>
    </section>
  );
}
