export { DEFAULT_GAME_CONFIG } from "./config/index.js";
export type { CoreWineEngineConfig } from "./config/defaultGameConfig.js";
export * from "./moments/index.js";
export * from "./vine/index.js";
export * from "./wine/index.js";

export const gameEnginePackage = {
  name: "@chateau/game-engine",
  scope: "bootstrap"
} as const;
