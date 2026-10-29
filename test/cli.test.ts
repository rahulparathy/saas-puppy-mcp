import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { startMockUpstream, textOf, type MockUpstream } from "./helpers.js";

// Async on purpose: the mock upstream lives in this process, so a blocking spawn would freeze it.
function runCli(args: string[]): Promise<{ status: number | null; stdout: string }> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [cli, ...args], { stdio: ["ignore", "pipe", "ignore"] });
    let stdout = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.on("close", (status) => resolve({ status, stdout }));
  });
}

const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
const built = existsSync(cli);

let upstream: MockUpstream;
beforeAll(async () => {
  upstream = await startMockUpstream();
});
afterAll(async () => {
  await upstream.close();
});

// Runs against the compiled CLI, so it needs `npm run build` first (CI does this).
describe.skipIf(!built)("compiled CLI over stdio", () => {
  it("starts, lists tools and forwards a call to SAAS_PUPPY_MCP_URL", async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [cli],
      env: { ...(process.env as Record<string, string>), SAAS_PUPPY_MCP_URL: upstream.url },
    });
    const client = new Client({ name: "cli-test", version: "0.0.0" });
    await client.connect(transport);
    try {
      const { tools } = await client.listTools();
      expect(tools.map((t) => t.name).sort()).toEqual(["compare_tools", "list_tools"]);
      const result = await client.callTool({ name: "list_tools", arguments: { query: "mailtrap" } });
      expect(JSON.parse(textOf(result))).toEqual({ tools: [{ slug: "mailtrap" }] });
    } finally {
      await client.close();
    }
  });

  it("--check prints plain-English results and exits 0 against a healthy endpoint", async () => {
    const result = await runCli(["--check", "--endpoint", upstream.url]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("All good.");
  });

  it("--check exits 1 when the endpoint is unreachable", async () => {
    const result = await runCli(["--check", "--endpoint", "http://127.0.0.1:1/MCP", "--timeout", "500"]);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("FAIL  Could not connect.");
  });

  it("--version prints the package version", async () => {
    expect((await runCli(["--version"])).stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("rejects a non-https endpoint", async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [cli, "--endpoint", "http://example.com/MCP"],
    });
    const client = new Client({ name: "cli-test", version: "0.0.0" });
    await expect(client.connect(transport)).rejects.toThrow();
  });
});
