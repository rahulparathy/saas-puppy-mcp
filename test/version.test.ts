import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { VERSION } from "../src/constants.js";

const read = (file: string) => JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"));

describe("release metadata", () => {
  const pkg = read("package.json");
  const registry = read("server.json");

  it("keeps one version across package.json, constants and server.json", () => {
    expect(VERSION).toBe(pkg.version);
    expect(registry.version).toBe(pkg.version);
    expect(registry.packages[0].version).toBe(pkg.version);
  });

  it("matches the registry name to mcpName and the npm package", () => {
    expect(registry.name).toBe(pkg.mcpName);
    expect(registry.packages[0].identifier).toBe(pkg.name);
  });

  it("points the remote entry at the hosted public endpoint", () => {
    expect(registry.remotes[0]).toEqual({ type: "streamable-http", url: "https://saaspuppy.com/MCP" });
  });
});
