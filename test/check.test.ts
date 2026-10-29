import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runCheck } from "../src/check.js";
import { startMockUpstream, type MockUpstream } from "./helpers.js";

let upstream: MockUpstream;
beforeAll(async () => {
  upstream = await startMockUpstream();
});
afterAll(async () => {
  await upstream.close();
});

const collect = () => {
  const lines: string[] = [];
  return { lines, write: (line: string) => void lines.push(line) };
};

describe("--check self-test", () => {
  it("passes against a healthy endpoint and says so in plain English", async () => {
    const { lines, write } = collect();
    const code = await runCheck(upstream.url, 5_000, write);
    expect(code).toBe(0);
    const text = lines.join("\n");
    expect(text).toContain("PASS  Connected to the directory.");
    expect(text).toContain("PASS  Found both tools: list_tools and compare_tools.");
    expect(text).toContain("PASS  Asked a test question and got an answer.");
    expect(text).toContain("All good.");
  });

  it("fails with a helpful message when the endpoint cannot be reached", async () => {
    const { lines, write } = collect();
    const code = await runCheck("http://127.0.0.1:1/MCP", 500, write);
    expect(code).toBe(1);
    const text = lines.join("\n");
    expect(text).toContain("FAIL  Could not connect.");
    expect(text).not.toContain("All good.");
  });
});
