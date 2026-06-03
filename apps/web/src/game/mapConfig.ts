export const MAP_WIDTH = 720;
export const MAP_HEIGHT = 480;

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

export type InteractionZone = {
  id: InteractionZoneId;
  label: string;
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
    prompt: "Press E or Interact at the Chateau",
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
    prompt: "Press E or Interact at the Cellar",
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
    prompt: "Press E or Interact at Production",
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
    prompt: "Press E or Interact at Plot 1",
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
    prompt: "Press E or Interact at Plot 2",
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
    prompt: "Press E or Interact at Plot 3",
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
    prompt: "Press E or Interact at the Shop",
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
    prompt: "Press E or Interact at the Market",
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
    prompt: "Press E or Interact near the Ghost Sommelier",
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
