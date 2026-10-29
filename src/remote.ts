import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { SITE_URL, VERSION } from "./constants.js";

export const UNAVAILABLE_MESSAGE = `The SaaS Puppy directory is temporarily unavailable. Try again shortly, or visit ${SITE_URL}.`;

export interface RemoteOptions {
  /** Per-request timeout in milliseconds. */
  timeoutMs?: number;
  /** Override fetch, mainly for tests. */
  fetch?: typeof fetch;
}

/** Validates the upstream address. HTTPS is required except for loopback addresses used in development. */
export function parseEndpoint(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid SaaS Puppy MCP endpoint: ${value}`);
  }
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) {
    throw new Error("The SaaS Puppy MCP endpoint must use https.");
  }
  return url;
}

/**
 * Thin client for the hosted public SaaS Puppy MCP. It connects on first use,
 * reconnects once if the connection has gone stale, and never throws from `call`.
 */
export class RemoteDirectory {
  private client: Client | undefined;
  private connecting: Promise<Client> | undefined;
  private readonly url: URL;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch | undefined;

  constructor(endpoint: string, options: RemoteOptions = {}) {
    this.url = parseEndpoint(endpoint);
    this.timeoutMs = options.timeoutMs ?? 20_000;
    this.fetchImpl = options.fetch;
  }

  private async connect(): Promise<Client> {
    if (this.client) return this.client;
    this.connecting ??= (async () => {
      const transport = new StreamableHTTPClientTransport(this.url, {
        requestInit: { headers: { "user-agent": `saas-puppy-mcp/${VERSION}` } },
        ...(this.fetchImpl ? { fetch: this.fetchImpl } : {}),
      });
      const client = new Client({ name: "saas-puppy-mcp-proxy", version: VERSION });
      await client.connect(transport);
      this.client = client;
      return client;
    })().finally(() => {
      this.connecting = undefined;
    });
    return this.connecting;
  }

  private async reset(): Promise<void> {
    const client = this.client;
    this.client = undefined;
    await client?.close().catch(() => undefined);
  }

  async call(name: string, args: Record<string, unknown>): Promise<CallToolResult> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const client = await this.connect();
        const result = await client.callTool({ name, arguments: args }, undefined, {
          timeout: this.timeoutMs,
        });
        return result as CallToolResult;
      } catch {
        await this.reset();
      }
    }
    return { isError: true, content: [{ type: "text", text: UNAVAILABLE_MESSAGE }] };
  }

  /** Names of the tools the hosted endpoint offers. Throws if it cannot be reached. */
  async listToolNames(): Promise<string[]> {
    try {
      const client = await this.connect();
      const { tools } = await client.listTools(undefined, { timeout: this.timeoutMs });
      return tools.map((tool) => tool.name);
    } catch (error) {
      await this.reset();
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.reset();
  }
}
