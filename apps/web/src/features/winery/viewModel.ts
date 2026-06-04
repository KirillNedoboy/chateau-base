import type { WineryPreviewResponse, WineryRecipeInput } from "../../lib/api";

export type WineryRecipeDraft = Omit<WineryRecipeInput, "userId">;

export type DraftBoundWineryPreview = {
  draftKey: string;
  result: WineryPreviewResponse;
};

export function createWineryDraftKey(draft: WineryRecipeDraft): string {
  return [
    draft.grapeAmount,
    draft.productionVessel,
    draft.agingPlan,
    draft.closureType
  ].join("|");
}

export function isWineryPreviewCurrent(
  previewDraftKey: string | null,
  currentDraft: WineryRecipeDraft
): boolean {
  return previewDraftKey === createWineryDraftKey(currentDraft);
}

export function shouldAllowCraftWithPreview(
  canCraft: boolean,
  previewDraftKey: string | null,
  currentDraft: WineryRecipeDraft
): boolean {
  return canCraft && isWineryPreviewCurrent(previewDraftKey, currentDraft);
}
