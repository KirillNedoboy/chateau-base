export type VineStateKey = "low_yield" | "balanced" | "overcropped";

export type PlotStatus = "empty" | "planted" | "ready_to_harvest";

export type ShopItemKey =
  | "vine"
  | "screw_cap"
  | "cork"
  | "steel_tank_unlock"
  | "old_oak_barrel_unlock"
  | "new_oak_barrel_unlock"
  | "new_plot";

export const HARVESTED_GRAPE_ITEM_KEY = "grape" as const;

export type HarvestedGrapeItemKey = typeof HARVESTED_GRAPE_ITEM_KEY;

export type InventoryItemKey = ShopItemKey | HarvestedGrapeItemKey;

export type EquipmentUnlockKey =
  | "steel_tank"
  | "old_oak_barrel"
  | "new_oak_barrel";

export type InventoryItem = {
  id: string;
  userId: string;
  itemKey: InventoryItemKey;
  quantity: number;
};

export type InventorySnapshot = {
  items: InventoryItem[];
};

export type Inventory = InventorySnapshot;

export type Vine = {
  id: string;
  userId: string;
  plotId: string;
  harvestCount: number;
  state: VineStateKey;
  plantedAt: string;
  readyAt: string;
  lastHarvestedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VineyardPlot = {
  id: string;
  userId: string;
  index: number;
  status: PlotStatus;
  vineId: string | null;
  createdAt: string;
  updatedAt: string;
};
