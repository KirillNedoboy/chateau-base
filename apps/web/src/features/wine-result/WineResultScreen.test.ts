import { describe, expect, it } from "vitest";
import { getWineResultSections } from "./viewModel";

describe("Plan 013 wine result view model", () => {
  it("exposes required result sections from the craft response", () => {
    const sections = getWineResultSections({
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
    });

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
});
