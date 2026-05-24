import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_CONFIG } from "../src/index.js";

describe("DEFAULT_GAME_CONFIG", () => {
  it("defines critical MVP economy constants", () => {
    expect(DEFAULT_GAME_CONFIG.startingGrapeBalance).toBe(500);
    expect(DEFAULT_GAME_CONFIG.shopPrices.vine).toBe(80);
    expect(DEFAULT_GAME_CONFIG.shopPrices.cork).toBe(25);
    expect(DEFAULT_GAME_CONFIG.baseGrapeYield).toBe(10);
  });

  it("defines MVP quality thresholds", () => {
    expect(DEFAULT_GAME_CONFIG.quality.thresholds).toEqual({
      common: [0, 25],
      good: [26, 45],
      premium: [46, 65],
      grand_cru: [66, 85],
      legendary: [86, 100]
    });
  });

  it("defines chateau level quality caps", () => {
    expect(DEFAULT_GAME_CONFIG.caps.chateauLevel[1]).toBe("premium");
    expect(DEFAULT_GAME_CONFIG.caps.chateauLevel[2]).toBe("grand_cru");
    expect(DEFAULT_GAME_CONFIG.caps.chateauLevel[3]).toBe("legendary");
  });

  it("defines production choice quality caps", () => {
    expect(DEFAULT_GAME_CONFIG.caps.vessel.steel_tank).toBe("premium");
    expect(DEFAULT_GAME_CONFIG.caps.closure.screw_cap).toBe("premium");
    expect(DEFAULT_GAME_CONFIG.caps.closure.cork).toBe("legendary");
  });
});
