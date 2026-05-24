import { describe, expect, it } from "vitest";
import {
  DEFAULT_GAME_CONFIG,
  applyQualityCaps,
  calculateBottleCount,
  calculateGrapeYield,
  calculateRawQualityScore,
  calculateVineState,
  calculateWineBatch,
  getQualityLevelFromScore
} from "../src/index.js";

describe("core vine calculations", () => {
  it("maps harvest counts to vine states", () => {
    expect(calculateVineState(1).key).toBe("low_yield");
    expect(calculateVineState(2).key).toBe("low_yield");
    expect(calculateVineState(3).key).toBe("balanced");
    expect(calculateVineState(4).key).toBe("balanced");
    expect(calculateVineState(5).key).toBe("overcropped");
  });

  it("calculates grape yield from config base yield and vine state", () => {
    expect(calculateGrapeYield(calculateVineState(1), DEFAULT_GAME_CONFIG)).toBe(7);
    expect(calculateGrapeYield(calculateVineState(3), DEFAULT_GAME_CONFIG)).toBe(10);
    expect(calculateGrapeYield(calculateVineState(5), DEFAULT_GAME_CONFIG)).toBe(14);
  });
});

describe("core wine calculations", () => {
  it("calculates bottle count from grape amount", () => {
    expect(calculateBottleCount(7)).toBe(3);
    expect(calculateBottleCount(10)).toBe(5);
    expect(calculateBottleCount(14)).toBe(7);
  });

  it("calculates raw quality score and quality level from score thresholds", () => {
    const rawScore = calculateRawQualityScore({
      vineState: calculateVineState(1),
      productionVessel: "new_oak_barrel",
      agingPlan: "new_to_old_oak_aging",
      closureType: "cork",
      randomFactor: -9,
      config: DEFAULT_GAME_CONFIG
    });

    expect(rawScore).toBe(91);
    expect(getQualityLevelFromScore(rawScore, DEFAULT_GAME_CONFIG)).toBe("legendary");
    expect(getQualityLevelFromScore(25, DEFAULT_GAME_CONFIG)).toBe("common");
    expect(getQualityLevelFromScore(26, DEFAULT_GAME_CONFIG)).toBe("good");
    expect(getQualityLevelFromScore(45, DEFAULT_GAME_CONFIG)).toBe("good");
    expect(getQualityLevelFromScore(46, DEFAULT_GAME_CONFIG)).toBe("premium");
    expect(getQualityLevelFromScore(65, DEFAULT_GAME_CONFIG)).toBe("premium");
    expect(getQualityLevelFromScore(66, DEFAULT_GAME_CONFIG)).toBe("grand_cru");
    expect(getQualityLevelFromScore(85, DEFAULT_GAME_CONFIG)).toBe("grand_cru");
    expect(getQualityLevelFromScore(86, DEFAULT_GAME_CONFIG)).toBe("legendary");
  });

  it("applies choice and chateau quality caps with cap metadata", () => {
    expect(
      applyQualityCaps(
        "legendary",
        {
          productionVessel: "new_oak_barrel",
          agingPlan: "new_to_old_oak_aging",
          closureType: "screw_cap"
        },
        3,
        DEFAULT_GAME_CONFIG
      )
    ).toEqual({
      rawQualityLevel: "legendary",
      finalQualityLevel: "premium",
      capApplied: true,
      capCause: "screw_cap"
    });

    expect(
      applyQualityCaps(
        "legendary",
        {
          productionVessel: "new_oak_barrel",
          agingPlan: "new_to_old_oak_aging",
          closureType: "cork"
        },
        1,
        DEFAULT_GAME_CONFIG
      ).finalQualityLevel
    ).toBe("premium");

    expect(
      applyQualityCaps(
        "legendary",
        {
          productionVessel: "new_oak_barrel",
          agingPlan: "new_to_old_oak_aging",
          closureType: "cork"
        },
        2,
        DEFAULT_GAME_CONFIG
      ).finalQualityLevel
    ).toBe("grand_cru");

    expect(
      applyQualityCaps(
        "legendary",
        {
          productionVessel: "new_oak_barrel",
          agingPlan: "new_to_old_oak_aging",
          closureType: "cork"
        },
        3,
        DEFAULT_GAME_CONFIG
      ).finalQualityLevel
    ).toBe("legendary");
  });

  it("calculates a core-only wine batch result without future-system placeholders", () => {
    const batch = calculateWineBatch(
      {
        chateauLevel: 3,
        harvestCount: 1,
        productionVessel: "new_oak_barrel",
        agingPlan: "new_to_old_oak_aging",
        closureType: "cork",
        randomFactor: -9
      },
      DEFAULT_GAME_CONFIG
    );

    expect(batch).toEqual({
      rawQualityScore: 91,
      rawQualityLevel: "legendary",
      finalQualityLevel: "legendary",
      capApplied: false,
      capCause: null,
      bottleCount: 3,
      grapeAmount: 7,
      vineState: "low_yield",
      productionVessel: "new_oak_barrel",
      agingPlan: "new_to_old_oak_aging",
      closureType: "cork",
      gameConfigVersion: DEFAULT_GAME_CONFIG.version
    });
    expect(batch.rawQualityScore).toBe(91);
    expect(batch.rawQualityLevel).toBe("legendary");
    expect(batch.finalQualityLevel).toBe("legendary");
    expect(batch.capApplied).toBe(false);
    expect(batch.capCause).toBeNull();
    expect(batch.grapeAmount).toBe(7);
    expect(batch.bottleCount).toBe(3);
    expect("profile" in batch).toBe(false);
    expect("styleTags" in batch).toBe(false);
    expect("label" in batch).toBe(false);
    expect("verdict" in batch).toBe(false);
    expect("salePrice" in batch).toBe(false);
    expect("moments" in batch).toBe(false);
    expect("nftReadyMetadata" in batch).toBe(false);
  });
});
