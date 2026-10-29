import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { startMockUpstream, textOf, type MockUpstream } from "./helpers.js";

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

  it("rejects a non-https endpoint", async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [cli, "--endpoint", "http://example.com/MCP"],
    });
    const client = new Client({ name: "cli-test", version: "0.0.0" });
    await expect(client.connect(transport)).rejects.toThrow();
  });
});
