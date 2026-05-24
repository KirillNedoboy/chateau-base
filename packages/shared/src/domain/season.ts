export type SeasonKey =
  | "genesis_harvest"
  | "tuscany"
  | "bordeaux"
  | "napa"
  | "georgia_qvevri"
  | "champagne";

export type Season = {
  id: string;
  key: SeasonKey;
  name: string;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
};
