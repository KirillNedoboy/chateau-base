import { describe, expect, it } from "vitest";
import { pathToFileURL } from "node:url";
import { isMainModuleUrl } from "../src/server.js";

describe("API server entrypoint detection", () => {
  it("matches Windows argv paths against file URLs", () => {
    const argvPath =
      "C:\\Users\\Администратор\\OneDrive\\Рабочий стол\\Base\\apps\\api\\src\\server.ts";
    const importMetaUrl = pathToFileURL(argvPath).href;

    expect(isMainModuleUrl(importMetaUrl, argvPath)).toBe(true);
  });

  it("does not match a different entrypoint path", () => {
    const serverPath =
      "C:\\Users\\Администратор\\OneDrive\\Рабочий стол\\Base\\apps\\api\\src\\server.ts";
    const testPath =
      "C:\\Users\\Администратор\\OneDrive\\Рабочий стол\\Base\\apps\\api\\tests\\server-entrypoint.test.ts";

    expect(isMainModuleUrl(pathToFileURL(serverPath).href, testPath)).toBe(false);
  });
});
