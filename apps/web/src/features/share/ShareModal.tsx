type ShareMode = "classy" | "degen";

type ShareModalProps = {
  mode: ShareMode;
  busy: boolean;
  error: string | null;
  message: string | null;
  shareUrl: string | null;
  onCreateShare: () => void;
  onClose: () => void;
};

export function ShareModal({
  mode,
  busy,
  error,
  message,
  shareUrl,
  onCreateShare,
  onClose
}: ShareModalProps) {
  return (
    <section className="panel modal-panel" role="dialog" aria-labelledby="share-title">
      <div className="panel-heading">
        <div>
          <p className="section-label">Share</p>
          <h2 id="share-title">{mode === "classy" ? "Classy Flex" : "Degen Flex"}</h2>
        </div>
        <button type="button" className="secondary-button" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="muted">
        Create a stable share link. The challenge is recorded when a friend opens it.
      </p>
      <div className="action-row">
        <button type="button" onClick={onCreateShare} disabled={busy}>
          {busy ? "Creating" : "Create Share Link"}
        </button>
        {shareUrl ? (
          <a className="share-link" href={shareUrl}>
            {shareUrl}
          </a>
        ) : null}
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}
    </section>
  );
}
