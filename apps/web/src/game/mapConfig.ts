export const MAP_WIDTH = 720;
export const MAP_HEIGHT = 480;
export const MAP_PROMPT_Y = MAP_HEIGHT - 220;

export const PLAYER_START = {
  x: 360,
  y: 250
} as const;

export const REQUIRED_INTERACTION_ZONE_IDS = [
  "chateau",
  "cellar",
  "production",
  "plot_1",
  "plot_2",
  "plot_3",
  "shop",
  "market",
  "ghost_sommelier"
] as const;

export type InteractionZoneId = (typeof REQUIRED_INTERACTION_ZONE_IDS)[number];

export type InteractionZoneKind =
  | "chateau"
  | "cellar"
  | "production"
  | "plot"
  | "shop"
  | "market"
  | "ghost";

export type InteractionZone = {
  id: InteractionZoneId;
  label: string;
  shortLabel: string;
  kind: InteractionZoneKind;
  prompt: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: number;
  stroke: number;
};

export type InteractionCopy = {
  title: string;
  body: string;
};

export const INTERACTION_ZONES: readonly InteractionZone[] = [
  {
    id: "chateau",
    label: "Chateau",
    shortLabel: "CHATEAU",
    kind: "chateau",
    prompt: "Press E or tap Interact at the Chateau",
    x: 360,
    y: 72,
    width: 250,
    height: 70,
    fill: 0xd9c6a3,
    stroke: 0x7b5d36
  },
  {
    id: "cellar",
    label: "Cellar",
    shortLabel: "CELLAR",
    kind: "cellar",
    prompt: "Press E or tap Interact at the Cellar",
    x: 245,
    y: 170,
    width: 130,
    height: 58,
    fill: 0x9c6b4a,
    stroke: 0x5f3928
  },
  {
    id: "production",
    label: "Production",
    shortLabel: "WINERY",
    kind: "production",
    prompt: "Press E or tap Interact to craft wine",
    x: 475,
    y: 170,
    width: 150,
    height: 58,
    fill: 0xaab7a0,
    stroke: 0x566a4f
  },
  {
    id: "plot_1",
    label: "Plot 1",
    shortLabel: "PLOT 1",
    kind: "plot",
    prompt: "Press E or tap Interact at Plot 1",
    x: 150,
    y: 278,
    width: 115,
    height: 66,
    fill: 0x7f9f63,
    stroke: 0x4c683d
  },
  {
    id: "plot_2",
    label: "Plot 2",
    shortLabel: "PLOT 2",
    kind: "plot",
    prompt: "Press E or tap Interact at Plot 2",
    x: 300,
    y: 278,
    width: 115,
    height: 66,
    fill: 0x7f9f63,
    stroke: 0x4c683d
  },
  {
    id: "plot_3",
    label: "Plot 3",
    shortLabel: "PLOT 3",
    kind: "plot",
    prompt: "Press E or tap Interact at Plot 3",
    x: 450,
    y: 278,
    width: 115,
    height: 66,
    fill: 0x7f9f63,
    stroke: 0x4c683d
  },
  {
    id: "shop",
    label: "Shop",
    shortLabel: "SHOP",
    kind: "shop",
    prompt: "Press E or tap Interact at the Shop",
    x: 245,
    y: 390,
    width: 130,
    height: 58,
    fill: 0xc7a35d,
    stroke: 0x735a28
  },
  {
    id: "market",
    label: "Market",
    shortLabel: "MARKET",
    kind: "market",
    prompt: "Press E or tap Interact at the Market",
    x: 475,
    y: 390,
    width: 150,
    height: 58,
    fill: 0xb97861,
    stroke: 0x754337
  },
  {
    id: "ghost_sommelier",
    label: "Ghost Sommelier",
    shortLabel: "GHOST",
    kind: "ghost",
    prompt: "Press E or tap Interact near the Ghost Sommelier",
    x: 610,
    y: 252,
    width: 92,
    height: 92,
    fill: 0xded9ef,
    stroke: 0x7b6fa0
  }
] as const;

const INTERACTION_COPY: Record<InteractionZoneId, InteractionCopy> = {
  chateau: {
    title: "Chateau",
    body: "Placeholder: chateau overview opens here later."
  },
  cellar: {
    title: "Cellar",
    body: "Placeholder: cellar list opens here later."
  },
  production: {
    title: "Production",
    body: "Placeholder: winery production opens here later."
  },
  plot_1: {
    title: "Plot 1",
    body: "Placeholder: plot interaction opens here later."
  },
  plot_2: {
    title: "Plot 2",
    body: "Placeholder: plot interaction opens here later."
  },
  plot_3: {
    title: "Plot 3",
    body: "Placeholder: plot interaction opens here later."
  },
  shop: {
    title: "Shop",
    body: "Placeholder: shop UI opens here later."
  },
  market: {
    title: "Market",
    body: "Placeholder: market UI opens here later."
  },
  ghost_sommelier: {
    title: "Ghost Sommelier",
    body: "Placeholder: tutorial and verdict prompts open here later."
  }
};

export function getInteractionCopy(zoneId: InteractionZoneId): InteractionCopy {
  return INTERACTION_COPY[zoneId];
}
