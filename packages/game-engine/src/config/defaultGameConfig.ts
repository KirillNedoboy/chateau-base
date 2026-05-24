import type {
  AgingPlanKey,
  ClosureTypeKey,
  GameConfig,
  ProductionVesselKey,
  VineStateKey
} from "@chateau/shared";

export type CoreWineEngineConfig = GameConfig & {
  vineStates: Record<
    VineStateKey,
    {
      yieldMultiplier: number;
      grapeQualityBonus: number;
    }
  >;
  qualityBonuses: {
    vessel: Record<ProductionVesselKey, number>;
    aging: Record<AgingPlanKey, number>;
    closure: Record<ClosureTypeKey, number>;
  };
};

export const DEFAULT_GAME_CONFIG = {
  version: "mvp-0.1.0",
  startingGrapeBalance: 500,
  shopPrices: {
    vine: 80,
    screw_cap: 5,
    cork: 25,
    steel_tank_unlock: 120,
    old_oak_barrel_unlock: 220,
    new_oak_barrel_unlock: 350,
    new_plot: 300
  },
  growthTimers: {
    tutorialVineSeconds: 45,
    earlyVineSeconds: 90
  },
  productionTimers: {
    tutorialWineSeconds: 30,
    earlyWineSeconds: 60
  },
  baseGrapeYield: 10,
  quality: {
    baseGrapeQuality: 40,
    randomMin: -10,
    randomMax: 10,
    thresholds: {
      common: [0, 25],
      good: [26, 45],
      premium: [46, 65],
      grand_cru: [66, 85],
      legendary: [86, 100]
    }
  },
  sale: {
    baseTierValue: {
      common: 30,
      good: 80,
      premium: 160,
      grand_cru: 350,
      legendary: 900
    },
    scoreMultiplier: 2,
    bottleMultiplier: 10
  },
  caps: {
    chateauLevel: {
      1: "premium",
      2: "grand_cru",
      3: "legendary"
    },
    vessel: {
      steel_tank: "premium",
      old_oak_barrel: "grand_cru",
      new_oak_barrel: "legendary"
    },
    aging: {
      no_aging: "good",
      short_old_oak_aging: "grand_cru",
      new_oak_aging: "grand_cru",
      new_to_old_oak_aging: "legendary"
    },
    closure: {
      screw_cap: "premium",
      cork: "legendary"
    }
  },
  vineStates: {
    low_yield: {
      yieldMultiplier: 0.7,
      grapeQualityBonus: 20
    },
    balanced: {
      yieldMultiplier: 1,
      grapeQualityBonus: 10
    },
    overcropped: {
      yieldMultiplier: 1.4,
      grapeQualityBonus: -10
    }
  },
  qualityBonuses: {
    vessel: {
      steel_tank: 0,
      old_oak_barrel: 8,
      new_oak_barrel: 12
    },
    aging: {
      no_aging: 0,
      short_old_oak_aging: 10,
      new_oak_aging: 15,
      new_to_old_oak_aging: 25
    },
    closure: {
      screw_cap: 0,
      cork: 3
    }
  }
} as const satisfies CoreWineEngineConfig;
