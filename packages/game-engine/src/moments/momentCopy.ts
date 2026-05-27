import type { GameMoment } from "@chateau/shared";

export type MomentCopy = {
  title: string;
  summary: string;
};

export const MOMENT_COPY: Record<GameMoment, MomentCopy> = {
  first_wine: {
    title: "First Wine",
    summary: "The player's first completed bottle."
  },
  first_premium: {
    title: "First Premium",
    summary: "The player's first Premium result."
  },
  first_grand_cru: {
    title: "First Grand Cru",
    summary: "The player's first Grand Cru result."
  },
  first_legendary: {
    title: "First Legendary",
    summary: "The player's first Legendary result."
  },
  almost_legendary: {
    title: "Almost Legendary",
    summary: "A Legendary raw result was capped below Legendary."
  },
  rng_rugged: {
    title: "RNG Rugged",
    summary: "A strong setup was dragged down by negative random factor."
  },
  corkfather: {
    title: "The Corkfather",
    summary: "The player's first Grand Cru or better with Cork."
  },
  screw_cap_criminal: {
    title: "Screw Cap Criminal",
    summary: "A Screw Cap choice limited the bottle's upside."
  },
  paper_hands: {
    title: "Paper Hands",
    summary: "A rare result was not stored in the cellar."
  },
  gas_station_vintage: {
    title: "Gas Station Vintage",
    summary: "Steel Tank, No Aging, and Screw Cap produced a shame setup."
  },
  based_vintage: {
    title: "Based Vintage",
    summary: "A Base-linked cellar save met the Based Vintage setup."
  },
  risk_free_peasant: {
    title: "Risk-Free Peasant",
    summary: "Repeated safe choices crossed the coward threshold."
  }
};
