import { describe, expect, it } from "vitest";
import {
  INTERACTION_ZONES,
  MAP_HEIGHT,
  MAP_PROMPT_Y,
  REQUIRED_INTERACTION_ZONE_IDS,
  getInteractionCopy
} from "./mapConfig";

describe("Plan 012 map config", () => {
  it("defines every required interaction zone exactly once", () => {
    const zoneIds = INTERACTION_ZONES.map((zone) => zone.id);

    expect(zoneIds).toEqual(REQUIRED_INTERACTION_ZONE_IDS);
    expect(new Set(zoneIds).size).toBe(REQUIRED_INTERACTION_ZONE_IDS.length);
  });

  it("maps every zone to React placeholder copy", () => {
    for (const zone of INTERACTION_ZONES) {
      expect(getInteractionCopy(zone.id)).toMatchObject({
        title: zone.label
      });
      expect(getInteractionCopy(zone.id).body.length).toBeGreaterThan(0);
    }
  });

  it("adds presentation metadata for the polished map renderer", () => {
    expect(INTERACTION_ZONES.map((zone) => zone.kind)).toEqual([
      "chateau",
      "cellar",
      "production",
      "plot",
      "plot",
      "plot",
      "shop",
      "market",
      "ghost"
    ]);

    for (const zone of INTERACTION_ZONES) {
      expect(zone.shortLabel.length).toBeGreaterThan(0);
      expect(zone.prompt).toContain("Interact");
    }
  });

  it("keeps the canvas prompt above the mobile control safe area", () => {
    expect(MAP_PROMPT_Y).toBeLessThanOrEqual(MAP_HEIGHT - 200);
  });
});
