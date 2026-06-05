import type { ShareObject } from "@chateau/shared";
import { formatKey } from "../game-ui/viewModels";

type ShareCardProps = {
  share: ShareObject;
};

function readString(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === "string" ? value : null;
}

function readNumber(payload: Record<string, unknown>, key: string): number | null {
  const value = payload[key];
  return typeof value === "number" ? value : null;
}

function readStringArray(payload: Record<string, unknown>, key: string): string[] {
  const value = payload[key];
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === "string");
}

export function ShareCard({ share }: ShareCardProps) {
  const qualityLevel = readString(share.payload, "qualityLevel");
  const qualityScore = readNumber(share.payload, "qualityScore");
  const bottleCount = readNumber(share.payload, "bottleCount");
  const productionVessel = readString(share.payload, "productionVessel");
  const agingPlan = readString(share.payload, "agingPlan");
  const closureType = readString(share.payload, "closureType");
  const styleTags = readStringArray(share.payload, "styleTags");
  const primaryMoment = readString(share.payload, "primaryMoment");

  return (
    <article className="share-card" aria-labelledby="share-card-title">
      <p className="section-label">Chateau Base Share</p>
      <h1 id="share-card-title">{share.title}</h1>
      <p className="hero-copy">{share.subtitle}</p>
      <p className="prompt-text">{share.body}</p>

      <dl className="summary-list">
        {qualityLevel ? (
          <div>
            <dt>Quality</dt>
            <dd>{formatKey(qualityLevel)}</dd>
          </div>
        ) : null}
        {qualityScore !== null ? (
          <div>
            <dt>Score</dt>
            <dd>{qualityScore}/100</dd>
          </div>
        ) : null}
        {bottleCount !== null ? (
          <div>
            <dt>Bottles</dt>
            <dd>{bottleCount}</dd>
          </div>
        ) : null}
        <div>
          <dt>Mode</dt>
          <dd>{formatKey(share.mode)}</dd>
        </div>
      </dl>

      <section className="mini-panel">
        <p className="section-label">Production</p>
        <ul className="plain-list">
          {[productionVessel, agingPlan, closureType]
            .filter((value): value is string => value !== null)
            .map((value) => (
              <li key={value}>{formatKey(value)}</li>
            ))}
        </ul>
      </section>

      {styleTags.length > 0 || primaryMoment ? (
        <section className="mini-panel">
          <p className="section-label">Signals</p>
          <ul className="plain-list">
            {primaryMoment ? <li>{formatKey(primaryMoment)}</li> : null}
            {styleTags.map((tag) => (
              <li key={tag}>{formatKey(tag)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="action-row">
        <a className="button-link" href="/">
          Craft your first vintage
        </a>
        <a className="button-link secondary-link" href="/">
          Beat this vintage
        </a>
      </div>
    </article>
  );
}
