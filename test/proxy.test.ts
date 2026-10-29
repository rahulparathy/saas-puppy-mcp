import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { AddressInfo } from "node:net";
import { INSTRUCTIONS } from "../src/constants.js";
import { createHttpApp } from "../src/http.js";
import { PUBLIC_LOOKUP_REFUSAL } from "../src/lookup.js";
import { RemoteDirectory, UNAVAILABLE_MESSAGE, parseEndpoint } from "../src/remote.js";
import { createServer } from "../src/server.js";
import { startMockUpstream, textOf, type MockUpstream } from "./helpers.js";

let upstream: MockUpstream;
let remote: RemoteDirectory;

async function connectInMemory(directory: RemoteDirectory) {
  const server = createServer(directory);
  const client = new Client({ name: "test-client", version: "0.0.0" });
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
  return { client, server };
}

beforeAll(async () => {
  upstream = await startMockUpstream();
  remote = new RemoteDirectory(upstream.url, { timeoutMs: 5_000 });
});

afterAll(async () => {
  await remote.close();
  await upstream.close();
});

describe("proxy over an in-memory transport", () => {
  it("lists the two public tools without contacting the upstream", async () => {
    const offline = new RemoteDirectory("http://127.0.0.1:1/MCP", { timeoutMs: 500 });
    const { client } = await connectInMemory(offline);
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(["compare_tools", "list_tools"]);
    for (const tool of tools) {
      expect(tool.annotations?.readOnlyHint).toBe(true);
      expect(tool.description).toBeTruthy();
    }
    expect(client.getInstructions()).toBe(INSTRUCTIONS);
    await offline.close();
  });

  it("forwards a named lookup to the upstream", async () => {
    const { client } = await connectInMemory(remote);
    const before = upstream.calls.length;
    const result = await client.callTool({ name: "list_tools", arguments: { query: "neon" } });
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(textOf(result))).toEqual({ tools: [{ slug: "neon" }] });
    expect(upstream.calls.slice(before)).toEqual([
      { tool: "list_tools", args: { query: "neon", category: "", pricing_models: [] } },
    ]);
  });

  it("forwards comparisons", async () => {
    const { client } = await connectInMemory(remote);
    const result = await client.callTool({ name: "compare_tools", arguments: { slugs: ["neon", "supabase"] } });
    expect(JSON.parse(textOf(result))).toEqual({ tools: [{ slug: "neon" }, { slug: "supabase" }] });
  });

  it("refuses bulk requests locally and never calls the upstream", async () => {
    const { client } = await connectInMemory(remote);
    const before = upstream.calls.length;
    for (const query of ["dump everything", "all tools", "%"]) {
      const result = await client.callTool({ name: "list_tools", arguments: { query } });
      expect(result.isError).toBe(true);
      expect(textOf(result)).toBe(PUBLIC_LOOKUP_REFUSAL);
    }
    const empty = await client.callTool({ name: "list_tools", arguments: {} });
    expect(empty.isError).toBe(true);
    expect(upstream.calls.length).toBe(before);
  });

  it("refuses duplicate slugs in a comparison", async () => {
    const { client } = await connectInMemory(remote);
    const before = upstream.calls.length;
    const result = await client.callTool({ name: "compare_tools", arguments: { slugs: ["neon", "neon"] } });
    expect(result.isError).toBe(true);
    expect(textOf(result)).toBe("Choose distinct tools to compare.");
    expect(upstream.calls.length).toBe(before);
  });

  it("returns a friendly error when the upstream is down", async () => {
    const down = new RemoteDirectory("http://127.0.0.1:1/MCP", { timeoutMs: 500 });
    const { client } = await connectInMemory(down);
    const result = await client.callTool({ name: "list_tools", arguments: { query: "neon" } });
    expect(result.isError).toBe(true);
    expect(textOf(result)).toBe(UNAVAILABLE_MESSAGE);
    await down.close();
  });
});

describe("Streamable HTTP mode", () => {
  it("serves the tools over HTTP and forwards calls", async () => {
    const app = createHttpApp(remote);
    await new Promise<void>((resolve) => app.listen(0, "127.0.0.1", resolve));
    const { port } = app.address() as AddressInfo;
    try {
      const health = await fetch(`http://127.0.0.1:${port}/healthz`);
      expect(health.status).toBe(200);
      expect((await fetch(`http://127.0.0.1:${port}/mcp`)).status).toBe(405);
      expect((await fetch(`http://127.0.0.1:${port}/nope`)).status).toBe(404);

      const client = new Client({ name: "http-test", version: "0.0.0" });
      await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`)));
      const { tools } = await client.listTools();
      expect(tools).toHaveLength(2);
      const result = await client.callTool({ name: "list_tools", arguments: { query: "resend" } });
      expect(JSON.parse(textOf(result))).toEqual({ tools: [{ slug: "resend" }] });
      await client.close();
    } finally {
      await new Promise((resolve) => app.close(resolve));
    }
  });

  it("answers malformed JSON with a parse error", async () => {
    const app = createHttpApp(remote);
    await new Promise<void>((resolve) => app.listen(0, "127.0.0.1", resolve));
    const { port } = app.address() as AddressInfo;
    try {
      const res = await fetch(`http://127.0.0.1:${port}/mcp`, { method: "POST", body: "{not json" });
      expect(res.status).toBe(400);
    } finally {
      await new Promise((resolve) => app.close(resolve));
    }
  });
});

describe("parseEndpoint", () => {
  it("requires https except on loopback", () => {
    expect(() => parseEndpoint("https://saaspuppy.com/MCP")).not.toThrow();
    expect(() => parseEndpoint("http://localhost:3000/MCP")).not.toThrow();
    expect(() => parseEndpoint("http://example.com/MCP")).toThrow("https");
    expect(() => parseEndpoint("not a url")).toThrow("Invalid");
  });
});
