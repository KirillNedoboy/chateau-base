type MarketModalProps = {
  onClose: () => void;
};

export function MarketModal({ onClose }: MarketModalProps) {
  return (
    <section className="panel modal-panel" role="dialog" aria-labelledby="market-title">
      <div className="panel-heading">
        <div>
          <p className="section-label">Market</p>
          <h2 id="market-title">Sell Wine</h2>
        </div>
        <button type="button" className="secondary-button" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="muted">
        Sell from a revealed wine result. Market wine listing is still a follow-up.
      </p>
    </section>
  );
}
