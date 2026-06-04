import type { GameStateResponse } from "../../lib/api";

type CellarModalProps = {
  gameState: GameStateResponse;
  onClose: () => void;
};

export function CellarModal({ gameState, onClose }: CellarModalProps) {
  return (
    <section className="panel modal-panel" role="dialog" aria-labelledby="cellar-title">
      <div className="panel-heading">
        <div>
          <p className="section-label">Cellar</p>
          <h2 id="cellar-title">Stored Bottles</h2>
        </div>
        <button type="button" className="secondary-button" onClick={onClose}>
          Close
        </button>
      </div>
      {gameState.cellar ? (
        <p className="prompt-text">
          Slots: {gameState.cellar.usedSlots}/{gameState.cellar.maxSlots}
        </p>
      ) : (
        <p className="muted">Cellar is not initialized yet.</p>
      )}
      <p className="muted">Wine list endpoints are not wired in this plan.</p>
    </section>
  );
}
