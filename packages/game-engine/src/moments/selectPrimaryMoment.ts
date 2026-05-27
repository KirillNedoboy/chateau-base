import type { GameMoment } from "@chateau/shared";

export const MOMENT_PRIORITY: readonly GameMoment[] = [
  "first_legendary",
  "almost_legendary",
  "rng_rugged",
  "corkfather",
  "first_grand_cru",
  "first_premium",
  "screw_cap_criminal",
  "gas_station_vintage",
  "based_vintage",
  "risk_free_peasant",
  "first_wine"
];

export function selectPrimaryMoment(moments: readonly GameMoment[]): GameMoment | null {
  for (const moment of MOMENT_PRIORITY) {
    if (moments.includes(moment)) {
      return moment;
    }
  }

  return null;
}
