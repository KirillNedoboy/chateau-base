type ShareMode = "classy" | "degen";

type ShareModalProps = {
  mode: ShareMode;
  onClose: () => void;
};

export function ShareModal({ mode, onClose }: ShareModalProps) {
  return (
    <section className="panel modal-panel" role="dialog" aria-labelledby="share-title">
      <div className="panel-heading">
        <div>
          <p className="section-label">Share Placeholder</p>
          <h2 id="share-title">{mode === "classy" ? "Classy Flex" : "Degen Flex"}</h2>
        </div>
        <button type="button" className="secondary-button" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="muted">Share and challenge APIs are outside this plan.</p>
    </section>
  );
}
