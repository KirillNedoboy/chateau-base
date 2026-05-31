import { describe, expect, it } from "vitest";
import { HARVESTED_GRAPE_ITEM_KEY } from "../src/index.js";
import type {
  HarvestedGrapeItemKey,
  Inventory,
  InventoryItem,
  InventoryItemKey,
  InventorySnapshot
} from "../src/index.js";

describe("shared vine inventory contracts", () => {
  it("exports the canonical harvested grape inventory key", () => {
    const harvestedKey: HarvestedGrapeItemKey = HARVESTED_GRAPE_ITEM_KEY;
    const itemKey: InventoryItemKey = harvestedKey;
    const item: InventoryItem = {
      id: "inventory_1",
      userId: "user_1",
      itemKey,
      quantity: 7
    };
    const snapshot: InventorySnapshot = {
      items: [item]
    };
    const inventory: Inventory = snapshot;

    expect(HARVESTED_GRAPE_ITEM_KEY).toBe("grape");
    expect(inventory.items[0]).toEqual(item);
  });
});
