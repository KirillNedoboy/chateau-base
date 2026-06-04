import { describe, expect, it } from "vitest";
import {
  createWineryDraftKey,
  isWineryPreviewCurrent,
  shouldAllowCraftWithPreview,
  type WineryRecipeDraft
} from "./viewModel";

const baseDraft: WineryRecipeDraft = {
  grapeAmount: 7,
  productionVessel: "steel_tank",
  agingPlan: "no_aging",
  closureType: "screw_cap"
};

describe("Plan 013 winery preview view model", () => {
  it("invalidates preview when closure changes after preview", () => {
    const previewDraftKey = createWineryDraftKey(baseDraft);

    expect(
      isWineryPreviewCurrent(previewDraftKey, {
        ...baseDraft,
        closureType: "cork"
      })
    ).toBe(false);
  });

  it("invalidates preview when grape amount changes after preview", () => {
    const previewDraftKey = createWineryDraftKey(baseDraft);

    expect(
      isWineryPreviewCurrent(previewDraftKey, {
        ...baseDraft,
        grapeAmount: 8
      })
    ).toBe(false);
  });

  it("requires current canCraft preview before enabling craft", () => {
    const previewDraftKey = createWineryDraftKey(baseDraft);

    expect(shouldAllowCraftWithPreview(true, previewDraftKey, baseDraft)).toBe(true);
    expect(
      shouldAllowCraftWithPreview(true, previewDraftKey, {
        ...baseDraft,
        grapeAmount: 8
      })
    ).toBe(false);
    expect(shouldAllowCraftWithPreview(false, previewDraftKey, baseDraft)).toBe(false);
    expect(shouldAllowCraftWithPreview(true, null, baseDraft)).toBe(false);
  });
});
