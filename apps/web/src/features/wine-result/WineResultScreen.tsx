import type { PreserveConfirmResponse, WineCraftResponse } from "../../lib/api";
import { PreserveOnBasePanel } from "../../components/wallet/PreserveOnBasePanel";
import { formatKey } from "../game-ui/viewModels";
import {
  formatMoment,
  getWineResultSections,
  shouldShowPreserveAction
} from "./viewModel";

type WineResultScreenProps = {
  result: WineCraftResponse;
  userId: string;
  onClose: () => void;
  onRunItBack: () => void;
  onSharePlaceholder: (mode: "classy" | "degen") => void;
  onPreserveSubmitted?: (confirmation: PreserveConfirmResponse) => void;
};

export function WineResultScreen({
  result,
  userId,
  onClose,
  onRunItBack,
  onSharePlaceholder,
  onPreserveSubmitted
}: WineResultScreenProps) {
  const sections = getWineResultSections(result);

  return (
    <section className="result-screen" role="dialog" aria-labelledby="wine-result-title">
      <div className="result-hero">
        <p className="section-label">Wine Result</p>
        <h2 id="wine-result-title">{formatKey(result.qualityLevel)}</h2>
        <p className="result-score">Quality Score: {result.qualityScore}/100</p>
        <p className="result-score">Bottles: {result.bottleCount}</p>
      </div>

      <section className="label-panel" aria-label="Wine label">
        <p className="section-label">Label</p>
        <h3>{result.label.name}</h3>
        <p>{result.label.subtitle}</p>
        <span className="status-pill">{formatKey(result.label.frame)}</span>
      </section>

      <div className="result-section-grid">
        {sections.map((section) => (
          <section className="mini-panel" key={section.title}>
            <p className="section-label">{section.title}</p>
            <ul className="plain-list">
              {section.values.map((value) => (
                <li key={value}>{value}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mini-panel">
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
        <section className="mini-panel">
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

      <div className="action-row">
        <button type="button" onClick={() => onSharePlaceholder("classy")}>
          Classy Flex
        </button>
        <button type="button" onClick={() => onSharePlaceholder("degen")}>
          Degen Flex
        </button>
        <button type="button" onClick={onRunItBack}>
          Run It Back
        </button>
        <button type="button" className="secondary-button">
          Store in Cellar
        </button>
        <button type="button" className="secondary-button">
          Sell Wine
        </button>
        <button type="button" className="secondary-button" onClick={onClose}>
          Close
        </button>
      </div>
    </section>
  );
}
