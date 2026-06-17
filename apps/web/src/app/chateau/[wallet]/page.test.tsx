import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("ChateauProfilePage source", () => {
  it("renders an explicit wallet heading hook for mobile overflow control", () => {
    const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

    expect(source).toContain('className="wallet-heading"');
  });
});
