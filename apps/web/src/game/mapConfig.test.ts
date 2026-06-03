import { describe, expect, it } from "vitest";
import {
  INTERACTION_ZONES,
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
});
