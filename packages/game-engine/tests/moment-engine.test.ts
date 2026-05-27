import { describe, expect, it } from "vitest";
import {
  MOMENT_COPY,
  detectMoments,
  selectPrimaryMoment
} from "../src/index.js";

const baseContext = {
  rawQualityScore: 60,
  rawQualityLevel: "premium",
  finalQualityLevel: "premium",
  capApplied: false,
  capCause: null,
  randomFactor: 0,
  choices: {
    productionVessel: "old_oak_barrel",
    agingPlan: "short_old_oak_aging",
    closureType: "cork"
  },
  vineState: "balanced",
  userHistory: {
    hasMadeWine: true,
    hasPremium: true,
    hasGrandCru: false,
    hasLegendary: false,
    firstGrandCruWithCork: false,
    repeatedSafeRuns: false
  },
  wallet: {
    walletLinked: false,
    baseProfileLinked: false
  },
  storedInCellar: false
} as const;

describe("Moment Engine", () => {
  it("detects almost legendary and screw cap criminal, with almost legendary primary", () => {
    const moments = detectMoments({
      ...baseContext,
      rawQualityScore: 91,
      rawQualityLevel: "legendary",
      finalQualityLevel: "premium",
      capApplied: true,
      capCause: "screw_cap",
      choices: {
        productionVessel: "new_oak_barrel",
        agingPlan: "new_to_old_oak_aging",
        closureType: "screw_cap"
      },
      vineState: "low_yield"
    });

    expect(moments).toEqual(["almost_legendary", "screw_cap_criminal"]);
    expect(selectPrimaryMoment(moments)).toBe("almost_legendary");
  });

  it("detects rng rugged only for legendary-eligible negative random Grand Cru", () => {
    expect(
      detectMoments({
        ...baseContext,
        rawQualityScore: 84,
        rawQualityLevel: "grand_cru",
        finalQualityLevel: "grand_cru",
        randomFactor: -9,
        choices: {
          productionVessel: "new_oak_barrel",
          agingPlan: "new_to_old_oak_aging",
          closureType: "cork"
        },
        vineState: "low_yield"
      })
    ).toContain("rng_rugged");

    expect(
      detectMoments({
        ...baseContext,
        rawQualityScore: 84,
        rawQualityLevel: "grand_cru",
        finalQualityLevel: "grand_cru",
        randomFactor: 4,
        choices: {
          productionVessel: "new_oak_barrel",
          agingPlan: "new_to_old_oak_aging",
          closureType: "cork"
        },
        vineState: "low_yield"
      })
    ).not.toContain("rng_rugged");
  });

  it("detects corkfather for first Grand Cru or better with cork", () => {
    expect(
      detectMoments({
        ...baseContext,
        finalQualityLevel: "grand_cru",
        choices: {
          productionVessel: "new_oak_barrel",
          agingPlan: "new_to_old_oak_aging",
          closureType: "cork"
        },
        userHistory: {
          ...baseContext.userHistory,
          firstGrandCruWithCork: true
        }
      })
    ).toContain("corkfather");
  });

  it("detects first wine and first tier achievements", () => {
    expect(
      detectMoments({
        ...baseContext,
        finalQualityLevel: "premium",
        userHistory: {
          ...baseContext.userHistory,
          hasMadeWine: false,
          hasPremium: false
        }
      })
    ).toEqual(["first_wine", "first_premium"]);

    expect(
      detectMoments({
        ...baseContext,
        finalQualityLevel: "grand_cru",
        userHistory: {
          ...baseContext.userHistory,
          hasGrandCru: false
        }
      })
    ).toContain("first_grand_cru");

    expect(
      detectMoments({
        ...baseContext,
        finalQualityLevel: "legendary",
        userHistory: {
          ...baseContext.userHistory,
          hasLegendary: false
        }
      })
    ).toContain("first_legendary");
  });

  it("detects based vintage only with wallet/base context and cellar storage", () => {
    const basedSetup = {
      ...baseContext,
      choices: {
        productionVessel: "new_oak_barrel",
        agingPlan: "new_to_old_oak_aging",
        closureType: "cork"
      },
      vineState: "low_yield",
      wallet: {
        walletLinked: true,
        baseProfileLinked: true
      },
      storedInCellar: true
    } as const;

    expect(detectMoments(basedSetup)).toContain("based_vintage");
    expect(
      detectMoments({
        ...basedSetup,
        wallet: {
          walletLinked: false,
          baseProfileLinked: true
        }
      })
    ).not.toContain("based_vintage");
  });

  it("detects risk free peasant only from repeated safe history", () => {
    expect(
      detectMoments({
        ...baseContext,
        choices: {
          productionVessel: "steel_tank",
          agingPlan: "no_aging",
          closureType: "screw_cap"
        },
        userHistory: {
          ...baseContext.userHistory,
          repeatedSafeRuns: false
        }
      })
    ).not.toContain("risk_free_peasant");

    expect(
      detectMoments({
        ...baseContext,
        choices: {
          productionVessel: "steel_tank",
          agingPlan: "no_aging",
          closureType: "screw_cap"
        },
        userHistory: {
          ...baseContext.userHistory,
          repeatedSafeRuns: true
        }
      })
    ).toContain("risk_free_peasant");
  });

  it("selects the highest-priority moment", () => {
    expect(
      selectPrimaryMoment([
        "first_wine",
        "screw_cap_criminal",
        "rng_rugged",
        "almost_legendary"
      ])
    ).toBe("almost_legendary");

    expect(selectPrimaryMoment([])).toBeNull();
  });

  it("exports copy metadata for every moment", () => {
    expect(Object.keys(MOMENT_COPY)).toEqual([
      "first_wine",
      "first_premium",
      "first_grand_cru",
      "first_legendary",
      "almost_legendary",
      "rng_rugged",
      "corkfather",
      "screw_cap_criminal",
      "paper_hands",
      "gas_station_vintage",
      "based_vintage",
      "risk_free_peasant"
    ]);
  });
});
