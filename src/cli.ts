#!/usr/bin/env node
import { parseArgs } from "node:util";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { DEFAULT_ENDPOINT, SITE_URL, VERSION } from "./constants.js";
import { createHttpApp } from "./http.js";
import { RemoteDirectory, parseEndpoint } from "./remote.js";
import { createServer } from "./server.js";

const HELP = `saas-puppy-mcp ${VERSION}
MCP server for the SaaS Puppy free-tier directory (${SITE_URL}).

Usage:
  saas-puppy-mcp                   Run over stdio (default, for Claude Desktop, Cursor, VS Code, ...)
  saas-puppy-mcp --http            Run a stateless Streamable HTTP server on /mcp

Options:
  --http                 Serve Streamable HTTP instead of stdio
  --port <n>             HTTP port (default: $PORT or 8080)
  --host <addr>          HTTP bind address (default: 0.0.0.0)
  --endpoint <url>       Upstream public MCP (default: $SAAS_PUPPY_MCP_URL or ${DEFAULT_ENDPOINT})
  --timeout <ms>         Upstream request timeout (default: 20000)
  -v, --version          Print the version
  -h, --help             Print this help
`;

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      http: { type: "boolean", default: false },
      port: { type: "string" },
      host: { type: "string" },
      endpoint: { type: "string" },
      timeout: { type: "string" },
      version: { type: "boolean", short: "v", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (values.help) return void process.stdout.write(HELP);
  if (values.version) return void process.stdout.write(`${VERSION}\n`);

  const endpoint = values.endpoint ?? process.env["SAAS_PUPPY_MCP_URL"] ?? DEFAULT_ENDPOINT;
  parseEndpoint(endpoint);
  const timeoutMs = Number(values.timeout ?? process.env["SAAS_PUPPY_MCP_TIMEOUT_MS"] ?? 20_000);
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error("--timeout must be a positive number.");

  const remote = new RemoteDirectory(endpoint, { timeoutMs });
  const shutdown = async () => {
    await remote.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  if (values.http) {
    const port = Number(values.port ?? process.env["PORT"] ?? 8080);
    if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("--port must be 0-65535.");
    const host = values.host ?? "0.0.0.0";
    const app = createHttpApp(remote);
    app.listen(port, host, () => {
      // stderr only: stdout is reserved for the protocol in stdio mode, and kept quiet here for consistency.
      process.stderr.write(`saas-puppy-mcp ${VERSION} listening on http://${host}:${port}/mcp\n`);
    });
    return;
  }

  const server = createServer(remote);
  await server.connect(new StdioServerTransport());
  process.stderr.write(`saas-puppy-mcp ${VERSION} ready (stdio), upstream ${endpoint}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`saas-puppy-mcp: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
