import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  BOTTOM_NAV_ICON_ASSET_PATH,
  INTERACTION_ZONES,
  MAP_ART_ASSET_PATH,
  MAP_HEIGHT,
  MAP_WIDTH,
  MAP_PROMPT_Y,
  PLAYER_SPRITE_ASSET_PATH,
  QUICK_ACTION_ICON_ASSET_PATH,
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

  it("uses a tall mobile-first reference scene instead of a short schematic map", () => {
    expect(MAP_WIDTH).toBe(720);
    expect(MAP_HEIGHT).toBeGreaterThanOrEqual(960);
  });

  it("orders landmarks like the reference chateau scene", () => {
    const getZone = (id: (typeof REQUIRED_INTERACTION_ZONE_IDS)[number]) => {
      const zone = INTERACTION_ZONES.find((candidate) => candidate.id === id);
      expect(zone).toBeDefined();
      return zone!;
    };

    const zonesById = {
      chateau: getZone("chateau"),
      cellar: getZone("cellar"),
      production: getZone("production"),
      plot_1: getZone("plot_1"),
      plot_2: getZone("plot_2"),
      plot_3: getZone("plot_3"),
      shop: getZone("shop"),
      market: getZone("market")
    };

    expect(zonesById.chateau.y).toBeLessThan(zonesById.cellar.y);
    expect(zonesById.chateau.y).toBeLessThan(zonesById.production.y);
    expect(zonesById.cellar.y).toBeLessThan(zonesById.plot_1.y);
    expect(zonesById.production.y).toBeLessThan(zonesById.plot_2.y);
    expect(zonesById.plot_1.y).toBeLessThan(zonesById.shop.y);
    expect(zonesById.plot_3.y).toBeLessThan(zonesById.market.y);
    expect(zonesById.shop.y).toBeGreaterThan(MAP_HEIGHT * 0.72);
    expect(zonesById.market.y).toBeGreaterThan(MAP_HEIGHT * 0.72);
  });

  it("uses a project-local bitmap-ready map art asset behind interaction zones", () => {
    expect(MAP_ART_ASSET_PATH).toBe("/game/art/chateau-map-painterly.png");
    expect(MAP_ART_ASSET_PATH).not.toContain("reference-pass");
    expect(
      existsSync(join(process.cwd(), "public", MAP_ART_ASSET_PATH.slice(1)))
    ).toBe(true);
  });

  it("uses a project-local transparent player sprite instead of a debug circle", () => {
    expect(PLAYER_SPRITE_ASSET_PATH).toBe("/game/art/player-winemaker.png");
    expect(
      existsSync(join(process.cwd(), "public", PLAYER_SPRITE_ASSET_PATH.slice(1)))
    ).toBe(true);
  });

  it("uses a generated bottom navigation icon strip instead of placeholder squares", () => {
    expect(BOTTOM_NAV_ICON_ASSET_PATH).toBe("/game/art/bottom-nav-icons.png");
    expect(
      existsSync(join(process.cwd(), "public", BOTTOM_NAV_ICON_ASSET_PATH.slice(1)))
    ).toBe(true);
  });

  it("uses a generated quick-action icon strip instead of text-only buttons", () => {
    expect(QUICK_ACTION_ICON_ASSET_PATH).toBe("/game/art/quick-action-icons.png");
    expect(
      existsSync(join(process.cwd(), "public", QUICK_ACTION_ICON_ASSET_PATH.slice(1)))
    ).toBe(true);
  });
});
