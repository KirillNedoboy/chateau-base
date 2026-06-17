import type { WineCraftResponse } from "../../lib/api";
import { describe, expect, it } from "vitest";
import {
  claimSellWineIntent,
  getQualityPresentation,
  getVisibleWineSellUiState,
  getWineSellActionView,
  getWineSellUiStateForBatch,
  getWineProfileRows,
  getWineResultSections,
  releaseSellWineIntent,
  setWineSellUiStateForIntent,
  setWineSellUiStateForBatch,
  shouldShowPreserveAction,
  type SellWineIntentTracker
} from "./viewModel";

describe("Plan 013 wine result view model", () => {
  const baseResult: WineCraftResponse = {
      id: "batch_1",
      userId: "user_1",
      seasonId: "season_1",
      seasonKey: "genesis_harvest",
      gameConfigVersion: "mvp-0.1.0",
      grapeAmount: 7,
      bottleCount: 3,
      vineState: "low_yield",
      productionVessel: "steel_tank",
      agingPlan: "no_aging",
      closureType: "screw_cap",
      rawQualityScore: 60,
      rawQualityLevel: "premium",
      qualityScore: 45,
      qualityLevel: "good",
      capApplied: true,
      capCause: "no_aging",
      profile: {
        acidity: 54,
        body: 45,
        tannin: 30,
        aroma: 58,
        complexity: 44,
        balance: 52
      },
      styleTags: ["low_yield", "steel_tank"],
      label: {
        name: "Chateau Base",
        subtitle: "Genesis Harvest",
        frame: "basic",
        icon: "bottle"
      },
      moments: ["first_wine"],
      primaryMoment: "first_wine",
      verdict: {
        quality: "Acceptable.",
        style: "Tutorial energy."
      },
      salePrice: 200,
      batchHash: "hash_1",
      metadataUri: "chateau://metadata/hash_1",
      onchainEligible: false,
      preservedOnchain: false,
      nftReadyMetadata: {
        name: "Chateau Base",
        description: "Good wine",
        imageUrl: null,
        attributes: {}
      }
    };

  it("exposes required result sections from the craft response", () => {
    const sections = getWineResultSections(baseResult);

    expect(sections).toContainEqual({
      title: "Wine DNA",
      values: ["Acidity 54", "Body 45", "Tannin 30", "Aroma 58", "Complexity 44", "Balance 52"]
    });
    expect(sections).toContainEqual({
      title: "Production",
      values: ["Steel Tank", "No Aging", "Screw Cap", "7 grapes"]
    });
    expect(sections).toContainEqual({
      title: "Moments",
      values: ["First Wine"]
    });
  });

  it("shows Preserve on Base action only for backend eligible results", () => {
    expect(
      shouldShowPreserveAction({
        ...baseResult,
        onchainEligible: true
      })
    ).toBe(true);
    expect(
      shouldShowPreserveAction({
        ...baseResult,
        onchainEligible: false
      })
    ).toBe(false);
  });

  it("maps quality tiers to stable visual presentation tokens", () => {
    expect(getQualityPresentation("common")).toMatchObject({
      toneClassName: "quality-common",
      eyebrow: "Cellar Judgment"
    });
    expect(getQualityPresentation("legendary")).toMatchObject({
      toneClassName: "quality-legendary",
      eyebrow: "Cellar Judgment"
    });
  });

  it("orders Wine DNA profile rows for meter rendering", () => {
    expect(getWineProfileRows(baseResult.profile)).toEqual([
      { label: "Acidity", value: 54 },
      { label: "Body", value: 45 },
      { label: "Tannin", value: 30 },
      { label: "Aroma", value: 58 },
      { label: "Complexity", value: 44 },
      { label: "Balance", value: 52 }
    ]);
  });

  it("returns disabled sell button state while sell is busy", () => {
    const action = getWineSellActionView({
      busy: true,
      error: null,
      message: null,
      sold: false
    });

    expect(action.buttonDisabled).toBe(true);
    expect(action.buttonLabel).toBe("Selling...");
    expect(action.resultActionsDisabled).toBe(true);
  });

  it("returns visible sell error state for the result screen", () => {
    const action = getWineSellActionView({
      busy: false,
      error: "WineBatch is already sold",
      message: null,
      sold: false
    });

    expect(action.error).toBe("WineBatch is already sold");
    expect(action.message).toBeNull();
    expect(action.buttonDisabled).toBe(false);
  });

  it("returns sold state and disables the sell button after successful sell", () => {
    const action = getWineSellActionView({
      busy: false,
      error: null,
      message: "Sold wine for 230 GRAPE. Balance: 650.",
      sold: true
    });

    expect(action.message).toBe("Sold wine for 230 GRAPE. Balance: 650.");
    expect(action.buttonDisabled).toBe(true);
    expect(action.buttonLabel).toBe("Sold");
  });

  it("claims one in-flight sell intent for rapid duplicate clicks", () => {
    const tracker: SellWineIntentTracker = { byBatchId: {} };
    const createdKeys: string[] = [];
    const createKey = () => {
      const key = `sell_key_${createdKeys.length + 1}`;
      createdKeys.push(key);
      return key;
    };

    const first = claimSellWineIntent(tracker, "batch_1", createKey);
    const duplicate = claimSellWineIntent(tracker, "batch_1", createKey);

    expect(first).toEqual({
      batchId: "batch_1",
      idempotencyKey: "sell_key_1"
    });
    expect(duplicate).toBeNull();
    expect(createdKeys).toEqual(["sell_key_1"]);

    releaseSellWineIntent(tracker, first!);
    const retryAfterRelease = claimSellWineIntent(tracker, "batch_1", createKey);

    expect(retryAfterRelease).toEqual({
      batchId: "batch_1",
      idempotencyKey: "sell_key_2"
    });
  });

  it("keeps a resolved sell for batch A from marking batch B sold", () => {
    const batchAIntent = {
      batchId: "batch_a",
      idempotencyKey: "sell_key_a"
    };
    let sellStateByBatch = setWineSellUiStateForIntent({}, batchAIntent, {
      busy: true,
      error: null,
      message: null,
      sold: false
    });

    const visibleBeforeResolution = getWineSellActionView(
      getVisibleWineSellUiState(sellStateByBatch, "batch_b")
    );

    sellStateByBatch = setWineSellUiStateForIntent(sellStateByBatch, batchAIntent, {
      busy: false,
      error: null,
      message: "Sold wine for 230 GRAPE. Balance: 730.",
      sold: true
    });

    const batchBAction = getWineSellActionView(
      getVisibleWineSellUiState(sellStateByBatch, "batch_b")
    );

    expect(visibleBeforeResolution.buttonDisabled).toBe(false);
    expect(visibleBeforeResolution.buttonLabel).toBe("Sell Wine");
    expect(batchBAction.buttonDisabled).toBe(false);
    expect(batchBAction.buttonLabel).toBe("Sell Wine");
    expect(batchBAction.message).toBeNull();
  });

  it("scopes a completed sell response to the initiating batch", () => {
    const batchAIntent = {
      batchId: "batch_a",
      idempotencyKey: "sell_key_a"
    };
    const batchBIntent = {
      batchId: "batch_b",
      idempotencyKey: "sell_key_b"
    };
    let sellStateByBatch = setWineSellUiStateForIntent({}, batchAIntent, {
      busy: true,
      error: null,
      message: null,
      sold: false
    });

    sellStateByBatch = setWineSellUiStateForIntent(sellStateByBatch, batchBIntent, {
      busy: false,
      error: null,
      message: null,
      sold: false
    });
    sellStateByBatch = setWineSellUiStateForIntent(sellStateByBatch, batchAIntent, {
      busy: false,
      error: null,
      message: "Sold wine for 230 GRAPE. Balance: 730.",
      sold: true
    });

    const batchAAction = getWineSellActionView(
      getVisibleWineSellUiState(sellStateByBatch, "batch_a")
    );
    const batchBAction = getWineSellActionView(
      getVisibleWineSellUiState(sellStateByBatch, "batch_b")
    );

    expect(batchAAction.buttonDisabled).toBe(true);
    expect(batchAAction.buttonLabel).toBe("Sold");
    expect(batchAAction.message).toBe("Sold wine for 230 GRAPE. Balance: 730.");
    expect(batchBAction.buttonDisabled).toBe(false);
    expect(batchBAction.buttonLabel).toBe("Sell Wine");
    expect(batchBAction.message).toBeNull();
  });

  it("scopes a failed sell response to the initiating batch", () => {
    const batchAIntent = {
      batchId: "batch_a",
      idempotencyKey: "sell_key_a"
    };
    let sellStateByBatch = setWineSellUiStateForIntent({}, batchAIntent, {
      busy: true,
      error: null,
      message: null,
      sold: false
    });

    sellStateByBatch = setWineSellUiStateForIntent(sellStateByBatch, batchAIntent, {
      busy: false,
      error: "WineBatch is already sold",
      message: null,
      sold: false
    });

    const batchBAction = getWineSellActionView(
      getVisibleWineSellUiState(sellStateByBatch, "batch_b")
    );

    expect(batchBAction.error).toBeNull();
    expect(batchBAction.buttonDisabled).toBe(false);
    expect(batchBAction.buttonLabel).toBe("Sell Wine");
  });

  it("applies sell busy state only to the matching batch", () => {
    const sellStateByBatch = setWineSellUiStateForBatch({}, "batch_a", {
      busy: true,
      error: null,
      message: null,
      sold: false
    });

    expect(
      getWineSellActionView(getWineSellUiStateForBatch(sellStateByBatch, "batch_a"))
        .buttonDisabled
    ).toBe(true);
    expect(
      getWineSellActionView(getWineSellUiStateForBatch(sellStateByBatch, "batch_b"))
        .buttonDisabled
    ).toBe(false);
  });

  it("does not let sold state for batch A disable batch B", () => {
    const sellStateByBatch = setWineSellUiStateForBatch({}, "batch_a", {
      busy: false,
      error: null,
      message: "Sold wine for 230 GRAPE. Balance: 730.",
      sold: true
    });

    const batchBAction = getWineSellActionView(
      getWineSellUiStateForBatch(sellStateByBatch, "batch_b")
    );

    expect(batchBAction.buttonDisabled).toBe(false);
    expect(batchBAction.buttonLabel).toBe("Sell Wine");
    expect(batchBAction.message).toBeNull();
  });

  it("does not show batch A sell error on batch B", () => {
    const sellStateByBatch = setWineSellUiStateForBatch({}, "batch_a", {
      busy: false,
      error: "WineBatch is already sold",
      message: null,
      sold: false
    });

    const batchBAction = getWineSellActionView(
      getWineSellUiStateForBatch(sellStateByBatch, "batch_b")
    );

    expect(batchBAction.error).toBeNull();
    expect(batchBAction.buttonDisabled).toBe(false);
  });

  it("allows independent in-flight sell intents for different batches", () => {
    const tracker: SellWineIntentTracker = { byBatchId: {} };
    const createdKeys: string[] = [];
    const createKey = () => {
      const key = `sell_key_${createdKeys.length + 1}`;
      createdKeys.push(key);
      return key;
    };

    const first = claimSellWineIntent(tracker, "batch_a", createKey);
    const duplicateA = claimSellWineIntent(tracker, "batch_a", createKey);
    const firstB = claimSellWineIntent(tracker, "batch_b", createKey);

    expect(first).toEqual({
      batchId: "batch_a",
      idempotencyKey: "sell_key_1"
    });
    expect(duplicateA).toBeNull();
    expect(firstB).toEqual({
      batchId: "batch_b",
      idempotencyKey: "sell_key_2"
    });
    expect(createdKeys).toEqual(["sell_key_1", "sell_key_2"]);
  });
});
