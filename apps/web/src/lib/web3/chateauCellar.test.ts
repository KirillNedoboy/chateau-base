import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  encodePreserveVintageCalldata,
  sendPreserveVintageTransaction
} from "./chateauCellar";

describe("Plan 015 ChateauCellar frontend helpers", () => {
  it("encodes preserveVintage calldata from backend preserve payload", () => {
    const calldata = encodePreserveVintageCalldata({
      contractAddress: "0x0000000000000000000000000000000000000000",
      chainId: 84532,
      batchId: "batch_1",
      batchHash:
        "0x1111111111111111111111111111111111111111111111111111111111111111",
      metadataUri: "chateau://metadata/1",
      qualityLevel: 4,
      primaryMoment: "almost_legendary",
      seasonKey: "genesis_harvest",
      score: 88
    });

    expect(calldata).toMatch(/^0x[0-9a-f]+$/);
    expect(calldata.slice(0, 10)).toBe("0x95e9a6c2");
  });

  it("rejects zero contract address before requesting a wallet transaction", async () => {
    const request = vi.fn(async () => {
      throw new Error("wallet request should not be called");
    });

    await expect(
      sendPreserveVintageTransaction({
        provider: { request },
        from: "0xaa00000000000000000000000000000000000001",
        payload: {
          contractAddress: "0x0000000000000000000000000000000000000000",
          chainId: 84532,
          batchId: "batch_1",
          batchHash:
            "0x1111111111111111111111111111111111111111111111111111111111111111",
          metadataUri: "chateau://metadata/1",
          qualityLevel: 4,
          primaryMoment: "almost_legendary",
          seasonKey: "genesis_harvest",
          score: 88
        }
      })
    ).rejects.toThrow(/contract address/i);
    expect(request).not.toHaveBeenCalled();
  });

  it("does not add forbidden wallet transaction helpers", () => {
    const source = readFileSync(new URL("./chateauCellar.ts", import.meta.url), "utf8");

    expect(source).not.toMatch(/\bmint\b/i);
    expect(source).not.toMatch(/\btransfer\b/i);
    expect(source).not.toMatch(/\bstake\b/i);
    expect(source).not.toMatch(/\bbet\b/i);
    expect(source).not.toMatch(/\bwithdraw\b/i);
    expect(source).not.toMatch(/\bmarketplace\b/i);
    expect(source).not.toMatch(/\berc20\b/i);
  });
});
