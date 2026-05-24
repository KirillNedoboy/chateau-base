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

export type EquipmentUnlockKey =
  | "steel_tank"
  | "old_oak_barrel"
  | "new_oak_barrel";

export type Inventory = {
  userId: string;
  grapes: number;
  vines: number;
  screwCaps: number;
  corks: number;
  unlockedEquipment: EquipmentUnlockKey[];
  updatedAt: string;
};

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
