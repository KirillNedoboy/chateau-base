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
      <section className="state-banner">
        <p className="section-label">Flex Link</p>
        <p className="prompt-text">
          Create a stable share link. Challenge attribution starts when a friend opens it.
        </p>
      </section>
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
      {error ? <p className="state-banner form-error">{error}</p> : null}
      {message ? <p className="state-banner form-success">{message}</p> : null}
    </section>
  );
}
