import { describe, expect, it } from "vitest";
import {
  DEFAULT_GAME_CONFIG,
  applyTutorialFirstWineRule,
  buildWineMetadata,
  calculateSalePrice,
  checkOnchainEligibility,
  createBatchHash,
  generateSommelierVerdict,
  generateStyleTags,
  generateStyleVerdict,
  generateWineLabel,
  generateWineProfile
} from "../src/index.js";

describe("full wine output helpers", () => {
  const premiumInput = {
    qualityLevel: "premium",
    rawQualityLevel: "premium",
    rawQualityScore: 62,
    qualityScore: 62,
    bottleCount: 3,
    grapeAmount: 7,
    vineState: "low_yield",
    productionVessel: "new_oak_barrel",
    agingPlan: "new_to_old_oak_aging",
    closureType: "cork",
    moments: ["first_premium"]
  } as const;

  it("generates deterministic DNA, tags, label, verdicts, sale price, metadata, and hash", () => {
    const profile = generateWineProfile(premiumInput);
    const styleTags = generateStyleTags({
      ...premiumInput,
      profile,
      primaryMoment: "first_premium"
    });
    const label = generateWineLabel({
      ...premiumInput,
      primaryMoment: "first_premium"
    });
    const sommelierVerdict = generateSommelierVerdict("premium");
    const styleVerdict = generateStyleVerdict({
      ...premiumInput,
      styleTags
    });
    const salePrice = calculateSalePrice(premiumInput, DEFAULT_GAME_CONFIG);
    const metadata = buildWineMetadata({
      ...premiumInput,
      profile,
      styleTags,
      label,
      primaryMoment: "first_premium",
      salePrice
    });
    const batchHash = createBatchHash({
      batchId: "batch_1",
      userId: "user_1",
      seasonKey: "genesis_harvest",
      gameConfigVersion: DEFAULT_GAME_CONFIG.version,
      grapeAmount: premiumInput.grapeAmount,
      bottleCount: premiumInput.bottleCount,
      productionVessel: premiumInput.productionVessel,
      agingPlan: premiumInput.agingPlan,
      closureType: premiumInput.closureType,
      vineState: premiumInput.vineState,
      rawQualityScore: premiumInput.rawQualityScore,
      qualityScore: premiumInput.qualityScore,
      rawQualityLevel: premiumInput.rawQualityLevel,
      qualityLevel: premiumInput.qualityLevel,
      capApplied: false,
      capCause: null,
      wineProfile: profile,
      styleTags,
      label,
      moments: premiumInput.moments,
      primaryMoment: "first_premium",
      sommelierVerdict,
      styleVerdict,
      salePrice,
      metadataUri: null
    });

    expect(profile).toEqual({
      acidity: 76,
      body: 79,
      tannin: 78,
      aroma: 82,
      complexity: 90,
      balance: 83
    });
    expect(styleTags).toEqual([
      "low_yield",
      "new_oak",
      "new_to_old_oak",
      "corked",
      "small_batch",
      "high_complexity"
    ]);
    expect(label).toEqual({
      name: "Chateau Base - Genesis Premium",
      subtitle: "Low Yield / 3 Bottles",
      frame: "silver",
      icon: "cork"
    });
    expect(sommelierVerdict).toContain("cooked");
    expect(styleVerdict).toContain("Dense");
    expect(salePrice).toBe(314);
    expect(metadata.attributes.qualityLevel).toBe("premium");
    expect(metadata.attributes.primaryMoment).toBe("first_premium");
    expect(batchHash).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("applies deterministic tutorial first-wine distribution without Common", () => {
    expect(
      applyTutorialFirstWineRule({
        qualityLevel: "common",
        tutorialSeed: "tutorial_good"
      })
    ).toBe("good");
    expect(
      applyTutorialFirstWineRule({
        qualityLevel: "common",
        tutorialSeed: "tutorial_premium_bucket_2"
      })
    ).not.toBe("common");
  });

  it("does not let idempotencyKey steer tutorial first-wine distribution", () => {
    const first = applyTutorialFirstWineRule({
      qualityLevel: "common",
      tutorialSeed: "user_1:genesis_harvest:tutorial-first-wine",
      idempotencyKey: "a"
    });
    const second = applyTutorialFirstWineRule({
      qualityLevel: "common",
      tutorialSeed: "user_1:genesis_harvest:tutorial-first-wine",
      idempotencyKey: "d"
    });

    expect(first).toBe(second);
    expect(first).not.toBe("common");
  });

  it("creates batchHash from meaningful payload, not idempotencyKey", () => {
    const profile = generateWineProfile(premiumInput);
    const styleTags = generateStyleTags({
      ...premiumInput,
      profile,
      primaryMoment: "first_premium"
    });
    const label = generateWineLabel({
      ...premiumInput,
      primaryMoment: "first_premium"
    });
    const salePrice = calculateSalePrice(premiumInput, DEFAULT_GAME_CONFIG);
    const basePayload = {
      batchId: "batch_1",
      userId: "user_1",
      seasonKey: "genesis_harvest",
      gameConfigVersion: DEFAULT_GAME_CONFIG.version,
      grapeAmount: premiumInput.grapeAmount,
      bottleCount: premiumInput.bottleCount,
      productionVessel: premiumInput.productionVessel,
      agingPlan: premiumInput.agingPlan,
      closureType: premiumInput.closureType,
      vineState: premiumInput.vineState,
      rawQualityScore: premiumInput.rawQualityScore,
      qualityScore: premiumInput.qualityScore,
      rawQualityLevel: premiumInput.rawQualityLevel,
      qualityLevel: premiumInput.qualityLevel,
      capApplied: false,
      capCause: null,
      wineProfile: profile,
      styleTags,
      label,
      moments: premiumInput.moments,
      primaryMoment: "first_premium",
      sommelierVerdict: generateSommelierVerdict(premiumInput.qualityLevel),
      styleVerdict: generateStyleVerdict({
        ...premiumInput,
        styleTags
      }),
      salePrice,
      metadataUri: null
    } as const;

    const firstPayload = {
      ...basePayload,
      idempotencyKey: "craft_001"
    };
    const secondPayload = {
      ...basePayload,
      idempotencyKey: "craft_002"
    };
    const changedMeaningfulPayloadInput = {
      ...basePayload,
      label: {
        ...basePayload.label,
        name: "Chateau Base - Genesis Premium Alt"
      },
      idempotencyKey: "craft_001"
    };
    const first = createBatchHash(firstPayload);
    const second = createBatchHash(secondPayload);
    const changedMeaningfulPayload = createBatchHash(changedMeaningfulPayloadInput);

    expect(first).toBe(second);
    expect(changedMeaningfulPayload).not.toBe(first);
  });

  it("uses backend batchId to distinguish identical meaningful batch payloads", () => {
    const profile = generateWineProfile(premiumInput);
    const styleTags = generateStyleTags({
      ...premiumInput,
      profile,
      primaryMoment: "first_premium"
    });
    const label = generateWineLabel({
      ...premiumInput,
      primaryMoment: "first_premium"
    });
    const salePrice = calculateSalePrice(premiumInput, DEFAULT_GAME_CONFIG);
    const basePayload = {
      userId: "user_1",
      seasonKey: "genesis_harvest",
      gameConfigVersion: DEFAULT_GAME_CONFIG.version,
      grapeAmount: premiumInput.grapeAmount,
      bottleCount: premiumInput.bottleCount,
      productionVessel: premiumInput.productionVessel,
      agingPlan: premiumInput.agingPlan,
      closureType: premiumInput.closureType,
      vineState: premiumInput.vineState,
      rawQualityScore: premiumInput.rawQualityScore,
      qualityScore: premiumInput.qualityScore,
      rawQualityLevel: premiumInput.rawQualityLevel,
      qualityLevel: premiumInput.qualityLevel,
      capApplied: false,
      capCause: null,
      wineProfile: profile,
      styleTags,
      label,
      moments: premiumInput.moments,
      primaryMoment: "first_premium",
      sommelierVerdict: generateSommelierVerdict(premiumInput.qualityLevel),
      styleVerdict: generateStyleVerdict({
        ...premiumInput,
        styleTags
      }),
      salePrice,
      metadataUri: null
    } as const;

    const first = createBatchHash({
      ...basePayload,
      batchId: "batch_1"
    });
    const second = createBatchHash({
      ...basePayload,
      batchId: "batch_2"
    });
    const recomputed = createBatchHash({
      ...basePayload,
      batchId: "batch_1"
    });

    expect(first).not.toBe(second);
    expect(first).toBe(recomputed);
  });

  it("marks Premium+ and meaningful moments eligible for preserve without transactions", () => {
    expect(
      checkOnchainEligibility({
        qualityLevel: "premium",
        moments: []
      })
    ).toBe(true);
    expect(
      checkOnchainEligibility({
        qualityLevel: "good",
        moments: ["first_wine"]
      })
    ).toBe(true);
    expect(
      checkOnchainEligibility({
        qualityLevel: "good",
        moments: []
      })
    ).toBe(false);
  });
});
