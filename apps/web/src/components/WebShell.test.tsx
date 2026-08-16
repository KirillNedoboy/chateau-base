import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("WebShell source", () => {
  it("wires generated bottom navigation icons into the app frame", () => {
    const source = readFileSync(new URL("./WebShell.tsx", import.meta.url), "utf8");

    expect(source).toContain("BOTTOM_NAV_ICON_ASSET_PATH");
    expect(source).toContain("--bottom-nav-icons");
    expect(source).toContain('className="bottom-nav-icon"');
    expect(source).toContain('shortLabel: "Bag"');
    expect(source).toContain('shortLabel: "Cellar"');
  });

  it("wires generated quick-action icons into disabled MVP shortcuts", () => {
    const source = readFileSync(new URL("./WebShell.tsx", import.meta.url), "utf8");

    expect(source).toContain("QUICK_ACTION_ICON_ASSET_PATH");
    expect(source).toContain("--quick-action-icons");
    expect(source).toContain('className="quick-action-icon"');
  });
});
