import { useMemo, useState } from "react";
import type {
  AgingPlanKey,
  ClosureTypeKey,
  ProductionVesselKey
} from "@chateau/shared";
import type { GameStateResponse, WineryPreviewResponse } from "../../lib/api";
import { formatKey, getInventoryQuantity } from "../game-ui/viewModels";
import {
  isWineryPreviewCurrent,
  shouldAllowCraftWithPreview,
  type DraftBoundWineryPreview,
  type WineryRecipeDraft
} from "./viewModel";

type WineryModalProps = {
  userId: string;
  gameState: GameStateResponse;
  preview: DraftBoundWineryPreview | null;
  busy: boolean;
  error: string | null;
  message: string | null;
  onPreview: (recipe: WineryRecipeDraft) => void;
  onCraft: (recipe: WineryRecipeDraft) => void;
  onClose: () => void;
};

const PRODUCTION_VESSELS: readonly ProductionVesselKey[] = [
  "steel_tank",
  "old_oak_barrel",
  "new_oak_barrel"
];

const AGING_PLANS: readonly AgingPlanKey[] = [
  "no_aging",
  "short_old_oak_aging",
  "new_oak_aging",
  "new_to_old_oak_aging"
];

const CLOSURE_TYPES: readonly ClosureTypeKey[] = ["screw_cap", "cork"];

function missingResourceLines(preview: WineryPreviewResponse): string[] {
  const lines: string[] = [];
  if (preview.missingResources.grapes) {
    lines.push(`${preview.missingResources.grapes} grapes`);
  }
  if (preview.missingResources.screwCaps) {
    lines.push(`${preview.missingResources.screwCaps} screw caps`);
  }
  if (preview.missingResources.corks) {
    lines.push(`${preview.missingResources.corks} corks`);
  }
  for (const unlock of preview.requiredUnlocks) {
    lines.push(formatKey(unlock));
  }
  return lines;
}

export function WineryModal({
  userId,
  gameState,
  preview,
  busy,
  error,
  message,
  onPreview,
  onCraft,
  onClose
}: WineryModalProps) {
  const grapeInventory = getInventoryQuantity(gameState.inventory.items, "grape");
  const [grapeAmount, setGrapeAmount] = useState(Math.max(1, Math.min(7, grapeInventory || 1)));
  const [productionVessel, setProductionVessel] =
    useState<ProductionVesselKey>("steel_tank");
  const [agingPlan, setAgingPlan] = useState<AgingPlanKey>("no_aging");
  const [closureType, setClosureType] = useState<ClosureTypeKey>("screw_cap");

  const draft = useMemo<WineryRecipeDraft>(
    () => ({
      grapeAmount,
      productionVessel,
      agingPlan,
      closureType
    }),
    [agingPlan, closureType, grapeAmount, productionVessel]
  );
  const previewIsCurrent = isWineryPreviewCurrent(preview?.draftKey ?? null, draft);
  const currentPreview = previewIsCurrent ? preview?.result ?? null : null;
  const missingLines = currentPreview ? missingResourceLines(currentPreview) : [];
  const canCraftCurrentPreview = shouldAllowCraftWithPreview(
    currentPreview?.canCraft ?? false,
    preview?.draftKey ?? null,
    draft
  );

  return (
    <section className="panel modal-panel" role="dialog" aria-labelledby="winery-title">
      <div className="panel-heading">
        <div>
          <p className="section-label">Winery</p>
          <h2 id="winery-title">Craft Wine</h2>
        </div>
        <button type="button" className="secondary-button" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="muted">Harvested grapes available: {grapeInventory}</p>

      <div className="form-grid">
        <label>
          Grape amount
          <input
            min={1}
            step={1}
            type="number"
            value={grapeAmount}
            onChange={(event) => {
              setGrapeAmount(Math.max(1, Number(event.target.value) || 1));
            }}
          />
        </label>
        <label>
          Production vessel
          <select
            value={productionVessel}
            onChange={(event) => {
              setProductionVessel(event.target.value as ProductionVesselKey);
            }}
          >
            {PRODUCTION_VESSELS.map((option) => (
              <option key={option} value={option}>
                {formatKey(option)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Aging plan
          <select
            value={agingPlan}
            onChange={(event) => {
              setAgingPlan(event.target.value as AgingPlanKey);
            }}
          >
            {AGING_PLANS.map((option) => (
              <option key={option} value={option}>
                {formatKey(option)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Closure
          <select
            value={closureType}
            onChange={(event) => {
              setClosureType(event.target.value as ClosureTypeKey);
            }}
          >
            {CLOSURE_TYPES.map((option) => (
              <option key={option} value={option}>
                {formatKey(option)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}

      {currentPreview ? (
        <section className="mini-panel">
          <div className="panel-heading">
            <p className="section-label">Backend Preview</p>
            <span className="status-pill">
              {currentPreview.canCraft ? "Can craft" : "Blocked"}
            </span>
          </div>
          <dl className="summary-list compact-summary">
            <div>
              <dt>Bottles</dt>
              <dd>{currentPreview.estimatedBottleCount}</dd>
            </div>
            <div>
              <dt>Max quality</dt>
              <dd>{formatKey(currentPreview.maxPossibleQualityLevel)}</dd>
            </div>
          </dl>
          {missingLines.length > 0 ? (
            <p className="form-error">Missing: {missingLines.join(", ")}</p>
          ) : null}
        </section>
      ) : null}

      {preview && !previewIsCurrent ? (
        <p className="form-error">Recipe changed. Preview again before crafting.</p>
      ) : null}

      <div className="action-row">
        <button type="button" disabled={busy} onClick={() => onPreview(draft)}>
          Preview
        </button>
        <button type="button" disabled={busy || !canCraftCurrentPreview} onClick={() => onCraft(draft)}>
          Craft Wine
        </button>
      </div>
      <span className="sr-only">Recipe user: {userId}</span>
    </section>
  );
}
