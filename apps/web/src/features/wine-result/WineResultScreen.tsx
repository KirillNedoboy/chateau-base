import type { PreserveConfirmResponse, WineCraftResponse } from "../../lib/api";
import { PreserveOnBasePanel } from "../../components/wallet/PreserveOnBasePanel";
import { formatKey } from "../game-ui/viewModels";
import {
  formatMoment,
  getQualityPresentation,
  getWineProfileRows,
  getWineSellActionView,
  getWineResultSections,
  shouldShowPreserveAction,
  type WineSellUiState
} from "./viewModel";

type WineResultScreenProps = {
  result: WineCraftResponse;
  userId: string;
  sellState: WineSellUiState;
  onClose: () => void;
  onRunItBack: () => void;
  onSell: () => void;
  onSharePlaceholder: (mode: "classy" | "degen") => void;
  onPreserveSubmitted?: (confirmation: PreserveConfirmResponse) => void;
};

export function WineResultScreen({
  result,
  userId,
  sellState,
  onClose,
  onRunItBack,
  onSell,
  onSharePlaceholder,
  onPreserveSubmitted
}: WineResultScreenProps) {
  const sections = getWineResultSections(result);
  const sellAction = getWineSellActionView(sellState);
  const qualityPresentation = getQualityPresentation(result.qualityLevel);
  const profileRows = getWineProfileRows(result.profile);
  const styleSection = sections.find((section) => section.title === "Style Tags");
  const productionSection = sections.find((section) => section.title === "Production");
  const momentsSection = sections.find((section) => section.title === "Moments");

  return (
    <section
      className={`result-screen ${qualityPresentation.toneClassName}`}
      role="dialog"
      aria-labelledby="wine-result-title"
    >
      <div className="result-hero">
        <div>
          <p className="section-label">{qualityPresentation.eyebrow}</p>
          <h2 id="wine-result-title">{formatKey(result.qualityLevel)}</h2>
          <p className="result-score">{qualityPresentation.summary}</p>
        </div>
        <div className="result-metrics" aria-label="Wine result metrics">
          <article>
            <span>Score</span>
            <strong>{result.qualityScore}/100</strong>
          </article>
          <article>
            <span>Bottles</span>
            <strong>{result.bottleCount}</strong>
          </article>
          {result.capApplied ? (
            <article>
              <span>Cap</span>
              <strong>{result.capCause ? formatKey(result.capCause) : "Applied"}</strong>
            </article>
          ) : null}
        </div>
      </div>

      <section
        className={`label-panel wine-label-card label-frame-${result.label.frame}`}
        aria-label="Wine label"
      >
        <p className="section-label">Label</p>
        <h3>{result.label.name}</h3>
        <p>{result.label.subtitle}</p>
        <div className="label-footer">
          <span className="status-pill">{formatKey(result.label.frame)}</span>
          <span>{result.label.icon}</span>
        </div>
      </section>

      <section className="mini-panel dna-panel">
        <p className="section-label">Wine DNA</p>
        <div className="dna-list">
          {profileRows.map((row) => (
            <div className="dna-row" key={row.label}>
              <div>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
              <div className="dna-meter" aria-hidden="true">
                <span style={{ width: `${row.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="result-section-grid">
        {styleSection ? (
          <section className="mini-panel">
            <p className="section-label">{styleSection.title}</p>
            <div className="tag-list">
              {styleSection.values.map((value) => (
                <span className="tag-chip" key={value}>
                  {value}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {productionSection ? (
          <section className="mini-panel production-receipt">
            <p className="section-label">{productionSection.title}</p>
            <ul className="plain-list">
              {productionSection.values.map((value) => (
                <li key={value}>{value}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {momentsSection ? (
          <section className="mini-panel">
            <p className="section-label">{momentsSection.title}</p>
            <div className="tag-list">
              {momentsSection.values.map((value) => (
                <span className="tag-chip tag-chip-gold" key={value}>
                  {value}
                </span>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <section className="mini-panel verdict-panel">
        <p className="section-label">Verdicts</p>
        <p className="prompt-text">{result.verdict.quality}</p>
        <p className="muted">{result.verdict.style}</p>
      </section>

      <section className="mini-panel result-economy">
        <div>
          <p className="section-label">Estimated Value</p>
          <strong>{result.salePrice} GRAPE</strong>
        </div>
        <span className="status-pill">
          {result.onchainEligible ? "Onchain eligible" : "Not preserve eligible"}
        </span>
      </section>

      {result.primaryMoment ? (
        <section className="mini-panel moment-panel">
          <p className="section-label">Primary Moment</p>
          <p className="prompt-text">{formatMoment(result.primaryMoment)}</p>
        </section>
      ) : null}

      {shouldShowPreserveAction(result) ? (
        <PreserveOnBasePanel
          userId={userId}
          result={result}
          onPreserveSubmitted={onPreserveSubmitted}
        />
      ) : null}

      {sellAction.message || sellAction.error ? (
        <section className="mini-panel state-banner">
          <p className="section-label">Market</p>
          {sellAction.message ? (
            <p className="muted" role="status">
              {sellAction.message}
            </p>
          ) : null}
          {sellAction.error ? (
            <p className="error-text" role="alert">
              {sellAction.error}
            </p>
          ) : null}
        </section>
      ) : null}

      <div className="result-actions">
        <div className="action-row action-row-primary" aria-label="Share actions">
          <button type="button" onClick={() => onSharePlaceholder("classy")}>
            Classy Flex
          </button>
          <button type="button" onClick={() => onSharePlaceholder("degen")}>
            Degen Flex
          </button>
        </div>
        <div className="action-row" aria-label="Wine actions">
          <button
            type="button"
            onClick={onSell}
            disabled={sellAction.buttonDisabled}
            aria-busy={sellState.busy}
          >
            {sellAction.buttonLabel}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onRunItBack}
            disabled={sellAction.resultActionsDisabled}
          >
            Run It Back
          </button>
          <button type="button" className="secondary-button">
            Store in Cellar
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={sellAction.resultActionsDisabled}
          >
            Close
          </button>
        </div>
      </div>
    </section>
  );
}
