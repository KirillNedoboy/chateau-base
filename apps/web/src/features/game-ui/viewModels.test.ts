import { describe, expect, it } from "vitest";
import {
  SHOP_ITEMS,
  getInventoryQuantity,
  getPlotStatusCopy,
  getTutorialLine
} from "./viewModels";

describe("Plan 013 game UI view models", () => {
  it("lists every buyable MVP shop item without duplicate keys", () => {
    expect(SHOP_ITEMS.map((item) => item.key)).toEqual([
      "vine",
      "screw_cap",
      "cork",
      "steel_tank_unlock",
      "old_oak_barrel_unlock",
      "new_oak_barrel_unlock",
      "new_plot"
    ]);
    expect(new Set(SHOP_ITEMS.map((item) => item.key)).size).toBe(SHOP_ITEMS.length);
  });

  it("reads inventory quantities by backend item key", () => {
    expect(
      getInventoryQuantity(
        [
          { itemKey: "vine", quantity: 2 },
          { itemKey: "grape", quantity: 7 }
        ],
        "grape"
      )
    ).toBe(7);
    expect(getInventoryQuantity([], "cork")).toBe(0);
  });

  it("does not infer plot-specific readiness from aggregate vine count", () => {
    expect(getPlotStatusCopy("plot_1", 3)).toBe("Backend will validate plot state.");
    expect(getPlotStatusCopy("plot_2", 3)).toBe("Backend will validate plot state.");
    expect(getPlotStatusCopy("plot_2", 1)).toBe("Locked plot");
  });

  it("keeps Ghost Sommelier tutorial copy short", () => {
    expect(getTutorialLine("vine_bought")).toBe("Plant the vine, genius.");
    expect(getTutorialLine("wine_revealed").length).toBeLessThanOrEqual(80);
  });
});
