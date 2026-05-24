import { describe, expect, it } from "vitest";
import { gameEnginePackage } from "../src/index.js";

describe("game engine package bootstrap", () => {
  it("exposes package identity without gameplay rules", () => {
    expect(gameEnginePackage).toEqual({
      name: "@chateau/game-engine",
      scope: "bootstrap"
    });
  });
});
