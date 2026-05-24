export type GameMoment =
  | "first_wine"
  | "first_premium"
  | "first_grand_cru"
  | "first_legendary"
  | "almost_legendary"
  | "rng_rugged"
  | "corkfather"
  | "screw_cap_criminal"
  | "paper_hands"
  | "gas_station_vintage"
  | "based_vintage"
  | "risk_free_peasant";

export type GameMomentRecord = {
  moment: GameMoment;
  batchId: string | null;
  userId: string;
  createdAt: string;
  payload: Record<string, unknown>;
};
