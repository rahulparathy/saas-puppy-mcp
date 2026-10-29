# SaaS Puppy MCP

An MCP server for [SaaS Puppy](https://saaspuppy.com), a directory of free-tier developer tools. Ask your AI agent about one tool, or compare two or three, and get the free tier, the good and bad points, and the catch, each with a link to the full listing.

- **Two read-only tools:** `list_tools` and `compare_tools`.
- **No account and no API key.** The directory is public.
- **Works over stdio or Streamable HTTP**, or connect straight to the hosted endpoint: `https://saaspuppy.com/MCP`.

## What it does

| Tool | What it returns |
| --- | --- |
| `list_tools` | A short summary of one tool by exact name or slug, or up to three examples from one category. Optional `pricing_models` filter: `free-forever`, `free-trial`, `open-source`, `self-hosted`. |
| `compare_tools` | Side-by-side summaries for two or three tools in the same category (`slugs`). |

Each summary has the tool's purpose, up to three good things and three bad things, the catch, a free-tier summary, pricing models, trial days, whether a card is required, the date the listing was last verified, and the SaaS Puppy page URL.

### What it will not do

The directory is not available as a bulk export. Lookups need an exact name or a specific category, categories return at most three examples, and there is no pagination. Requests to dump or enumerate the directory are refused, both in this package and on the hosted endpoint. For everything else, the answer links to [saaspuppy.com](https://saaspuppy.com). There are no writes, drafts or private data.

## Install

### Option 1: connect to the hosted endpoint (no install)

Use the public address with no authentication:

```
https://saaspuppy.com/MCP
```

```bash
# Claude Code
claude mcp add --transport http saas-puppy https://saaspuppy.com/MCP
```

Claude, ChatGPT and Cursor take the same address in their custom MCP connection screens. See [docs/clients.md](docs/clients.md) for VS Code, Hermes Agent, OpenClaw and others.

### Option 2: run the package over stdio

```bash
# Claude Code
claude mcp add saas-puppy -- npx -y saas-puppy-mcp
```

Claude Desktop, Cursor and most other clients use the standard `mcpServers` block:

```json
{
  "mcpServers": {
    "saas-puppy": {
      "command": "npx",
      "args": ["-y", "saas-puppy-mcp"]
    }
  }
}
```

VS Code (`.vscode/mcp.json`):

```json
{
  "servers": {
    "saas-puppy": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "saas-puppy-mcp"]
    }
  }
}
```

### Option 3: run it as an HTTP server

```bash
npx -y saas-puppy-mcp --http --port 8080
# MCP endpoint:  http://localhost:8080/mcp
# Health check:  http://localhost:8080/healthz
```

The HTTP mode is stateless, so it runs behind any load balancer. A `Dockerfile` is included:

```bash
docker build -t saas-puppy-mcp .
docker run --rm -p 8080:8080 saas-puppy-mcp
```

## Configuration

| Setting | Flag | Environment variable | Default |
| --- | --- | --- | --- |
| Upstream public MCP | `--endpoint` | `SAAS_PUPPY_MCP_URL` | `https://saaspuppy.com/MCP` |
| Upstream timeout (ms) | `--timeout` | `SAAS_PUPPY_MCP_TIMEOUT_MS` | `20000` |
| HTTP port (with `--http`) | `--port` | `PORT` | `8080` |
| HTTP bind address | `--host` | none | `0.0.0.0` |

The upstream address must use `https`. Plain `http` is accepted only for `localhost`, for development.

## How it works

This package is a small proxy. It defines the two tools locally, with the same names, input schemas and instructions as the hosted public MCP, so clients and registries can list them without a network call. When a tool runs, the package forwards the request to the hosted endpoint and returns its answer.

- **No secrets and no database access.** The package holds no keys. All data and all limits live on the SaaS Puppy server.
- **One source of truth.** Listings, verification dates and rate limits come from the site, so the package never serves stale data.
- **Fail-soft.** If the hosted endpoint is unreachable, tools return a plain error that points to saaspuppy.com instead of crashing the client.

## Development

```bash
npm install
npm run typecheck
npm run build
npm test
```

The tests run a mock of the hosted endpoint locally, so they need no network. The CLI test runs the compiled `dist/cli.js`, so build first.

Source layout:

| File | Purpose |
| --- | --- |
| `src/server.ts` | Builds the MCP server and registers the two tools. |
| `src/tools.ts` | Tool names, descriptions and input schemas. |
| `src/lookup.ts` | Local copy of the bulk-request guard. |
| `src/remote.ts` | Client for the hosted endpoint, with reconnect and timeout. |
| `src/http.ts` | Stateless Streamable HTTP server. |
| `src/cli.ts` | Command-line entry point. |

## Listing in MCP registries

[docs/publishing.md](docs/publishing.md) has the steps and ready-made metadata for the official MCP Registry, Smithery and Glama, plus a checklist for other directories.

## License

[MIT](LICENSE). SaaS Puppy listing data belongs to SaaS Puppy and is served under the terms at [saaspuppy.com](https://saaspuppy.com).
