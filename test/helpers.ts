import { createServer as createHttpServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

export interface MockUpstream {
  url: string;
  calls: Array<{ tool: string; args: unknown }>;
  close(): Promise<void>;
}

/** Stand-in for the hosted public SaaS Puppy MCP. Returns canned summaries and records every call. */
export async function startMockUpstream(): Promise<MockUpstream> {
  const calls: MockUpstream["calls"] = [];

  const build = () => {
    const server = new McpServer({ name: "mock-saas-puppy", version: "0.0.0" });
    server.registerTool(
      "list_tools",
      {
        inputSchema: {
          query: z.string().default(""),
          category: z.string().default(""),
          pricing_models: z.array(z.string()).default([]),
        },
      },
      async (args) => {
        calls.push({ tool: "list_tools", args });
        return { content: [{ type: "text", text: JSON.stringify({ tools: [{ slug: args.query || "example" }] }) }] };
      },
    );
    server.registerTool("compare_tools", { inputSchema: { slugs: z.array(z.string()) } }, async (args) => {
      calls.push({ tool: "compare_tools", args });
      return { content: [{ type: "text", text: JSON.stringify({ tools: args.slugs.map((slug) => ({ slug })) }) }] };
    });
    return server;
  };

  const http: Server = createHttpServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const text = Buffer.concat(chunks).toString("utf8");
    const server = build();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      void transport.close();
      void server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, text ? JSON.parse(text) : undefined);
  });

  await new Promise<void>((resolve) => http.listen(0, "127.0.0.1", resolve));
  const { port } = http.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}/MCP`,
    calls,
    close: () => new Promise<void>((resolve) => http.close(() => resolve())),
  };
}

export const textOf = (result: object): string => {
  const content = (result as { content?: Array<{ type: string; text?: string }> }).content;
  return content?.[0]?.text ?? "";
};
