import { createServer as createHttpServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { VERSION } from "./constants.js";
import type { RemoteDirectory } from "./remote.js";
import { createServer } from "./server.js";

const MAX_BODY_BYTES = 1_000_000;

function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}): void {
  res.writeHead(status, { "content-type": "application/json", ...headers });
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new Error("Request body too large");
    chunks.push(chunk as Buffer);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : undefined;
}

const jsonRpcError = (code: number, message: string) => ({ jsonrpc: "2.0", error: { code, message }, id: null });

/**
 * Stateless Streamable HTTP server. Every request gets a fresh MCP server instance, so the process
 * holds no per-client state and can sit behind any container platform or load balancer.
 */
export function createHttpApp(remote: RemoteDirectory): Server {
  return createHttpServer(async (req, res) => {
    const path = (req.url ?? "/").split("?")[0];

    if (path === "/healthz") return send(res, 200, { status: "ok", version: VERSION });

    if (path !== "/" && path !== "/mcp") return send(res, 404, { error: "Not found" });

    if (req.method !== "POST") {
      return send(res, 405, jsonRpcError(-32000, "Method not allowed."), { allow: "POST" });
    }

    try {
      const body = await readJson(req);
      const server = createServer(remote);
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      res.on("close", () => {
        void transport.close();
        void server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch (error) {
      if (res.headersSent) return;
      const tooLarge = error instanceof Error && error.message === "Request body too large";
      const badJson = error instanceof SyntaxError;
      if (tooLarge) return send(res, 413, jsonRpcError(-32600, "Request body too large."));
      if (badJson) return send(res, 400, jsonRpcError(-32700, "Parse error."));
      send(res, 500, jsonRpcError(-32603, "Internal server error."));
    }
  });
}
