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
      <section className="state-banner empty-state">
        <p className="section-label">Market Desk</p>
        <p className="prompt-text">Sell from a revealed wine result.</p>
        <p className="muted">
          A full market listing is a later pass; this keeps sale behavior tied to the
          backend result payload.
        </p>
      </section>
    </section>
  );
}
