<p align="center">
  <img src="https://raw.githubusercontent.com/rahulparathy/saas-puppy-mcp/main/assets/banner.png" alt="SaaS Puppy MCP: ask your AI about free-tier developer tools" width="100%">
</p>

<p align="center">
  <a href="https://github.com/rahulparathy/saas-puppy-mcp/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/rahulparathy/saas-puppy-mcp/actions/workflows/ci.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg"></a>
  <img alt="Node 20 or newer" src="https://img.shields.io/badge/node-%3E%3D20-339933.svg">
  <img alt="MCP server" src="https://img.shields.io/badge/MCP-server-black.svg">
</p>

# SaaS Puppy MCP

Let your AI assistant look things up in [SaaS Puppy](https://saaspuppy.com), a directory of free-tier developer tools.

Ask it about one tool, or have it compare two or three. For each one you get what the free plan includes, the good and bad points, and **the catch**, plus a link to the full listing.

- **No sign-up, no API key, no cost.**
- **Read-only.** It can look things up. It cannot change anything.
- **Works with** Claude, ChatGPT, Cursor, VS Code, Claude Code and any other app that supports MCP.

## What is MCP?

MCP (Model Context Protocol) is a standard way to plug extra abilities into an AI assistant. Think of it as a power adapter: once this one is plugged in, your assistant can check SaaS Puppy for you instead of guessing from memory.

## What can I ask?

After you connect it, ask in plain language:

- "What does Neon's free plan include, and what's the catch?"
- "Compare Supabase and Neon for a side project."
- "Show me a few free hosting options."
- "Show me a few free email tools and tell me which ones need a credit card."
- "Is there a free open-source option for uptime monitoring?"

The assistant picks the right tool and shows you the answer. You never call the tools yourself.

## Set it up

Pick the way that matches your app. The first is the easiest because there is nothing to install.

### The easy way: use the web address

Use this address, with **no authentication**:

```
https://saaspuppy.com/MCP
```

| App | What to do |
| --- | --- |
| **Claude** (web and desktop) | Settings, then Connectors, then add a custom connector. Paste the address and choose no authentication. |
| **ChatGPT** | Add a custom remote MCP connection (where your plan supports it). Paste the address and choose no authentication. |
| **Cursor** | Settings, then MCP, then add a remote server with the address. |
| **Claude Code** | Run `claude mcp add --transport http saas-puppy https://saaspuppy.com/MCP` |
| **VS Code** | See [docs/clients.md](docs/clients.md). |

More apps (Hermes Agent, OpenClaw and others) are in [docs/clients.md](docs/clients.md). App menus change often, so if a step looks different, follow the app's own MCP help and use the address above.

### The local way: run the package on your computer

Some apps only support local servers. For those, install [Node.js](https://nodejs.org) (version 20 or newer), then add this to the app's MCP settings:

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

For Claude Code: `claude mcp add saas-puppy -- npx -y saas-puppy-mcp`

## Check that it works

On your computer, run:

```bash
npx -y saas-puppy-mcp --check
```

You should see:

```
Checking the SaaS Puppy MCP at https://saaspuppy.com/MCP

PASS  Connected to the directory.
PASS  Found both tools: list_tools and compare_tools.
PASS  Asked a test question and got an answer.

All good. Your AI app can use this server.
```

If a line says `FAIL`, it also tells you what to try next.

## Questions

**Is it really free?** Yes. There is no account, key or limit you need to manage. The hosted address is shared, so it has fair-use limits and may slow down if someone sends too many requests.

**Does it see my files or chats?** No. It only receives the lookup your assistant sends (for example, "Neon") and returns an answer. It holds no keys, reads no files and has no analytics of its own.

**Why won't it list every tool?** On purpose. The full directory is on [saaspuppy.com](https://saaspuppy.com). The assistant can look up one tool, a few examples from one category, or compare two or three tools. It declines requests to dump or page through everything.

**What does "temporarily unavailable" mean?** The package could not reach saaspuppy.com. Wait a minute and ask again. If it keeps happening, run the check above.

**Where does the data come from?** From the live SaaS Puppy directory. Each answer includes the date the listing was last verified. Prices and limits change, so open the linked page before you rely on a number.

**`npx` says "command not found".** Install Node.js from [nodejs.org](https://nodejs.org) (the LTS version is fine), then restart your app.

**Something else is wrong.** [Open an issue](https://github.com/rahulparathy/saas-puppy-mcp/issues/new/choose) and paste the output of `--check`.

## The two tools

| Tool | What it returns |
| --- | --- |
| `list_tools` | A short summary of one tool by exact name or slug, or up to three examples from one category. Can filter by `free-forever`, `free-trial`, `open-source` or `self-hosted`. |
| `compare_tools` | Side-by-side summaries for two or three tools in the same category. |

Each summary has the tool's purpose, up to three good things and three bad things, the catch, a free-tier summary, pricing models, trial days, whether a card is required, the date it was last verified, and the SaaS Puppy page URL.

---

## For developers

### How it works

This package is a small proxy. It defines the two tools locally, with the same names, input schemas and instructions as the hosted public MCP, so clients and registries can list them without a network call. When a tool runs, the package forwards the request to the hosted endpoint and returns the answer.

- **No secrets and no database access.** All data and all limits live on the SaaS Puppy server.
- **One source of truth.** Listings, verification dates and rate limits come from the site, so the package never serves stale data.
- **Fail-soft.** If the hosted endpoint is unreachable, tools return a plain error that points to saaspuppy.com instead of crashing the client.
- **Local guard.** Bulk, wildcard and pagination requests are refused before they leave your machine.

### Run modes

```bash
npx -y saas-puppy-mcp                     # stdio (default)
npx -y saas-puppy-mcp --http --port 8080  # Streamable HTTP at /mcp, health check at /healthz
npx -y saas-puppy-mcp --check             # self-test
```

The HTTP mode is stateless, so it runs behind any load balancer. A `Dockerfile` is included:

```bash
docker build -t saas-puppy-mcp .
docker run --rm -p 8080:8080 saas-puppy-mcp
```

### Configuration

| Setting | Flag | Environment variable | Default |
| --- | --- | --- | --- |
| Upstream public MCP | `--endpoint` | `SAAS_PUPPY_MCP_URL` | `https://saaspuppy.com/MCP` |
| Upstream timeout (ms) | `--timeout` | `SAAS_PUPPY_MCP_TIMEOUT_MS` | `20000` |
| HTTP port (with `--http`) | `--port` | `PORT` | `8080` |
| HTTP bind address | `--host` | none | `0.0.0.0` |

The upstream address must use `https`. Plain `http` is accepted only for `localhost`, for development.

### Develop

```bash
npm install
npm run check     # typecheck, build and test in one go
```

The tests run a mock of the hosted endpoint, so they need no network.

| File | Purpose |
| --- | --- |
| `src/server.ts` | Builds the MCP server and registers the two tools. |
| `src/tools.ts` | Tool names, descriptions and input schemas. |
| `src/lookup.ts` | Local copy of the bulk-request guard. |
| `src/remote.ts` | Client for the hosted endpoint, with reconnect and timeout. |
| `src/http.ts` | Stateless Streamable HTTP server. |
| `src/check.ts` | The `--check` self-test. |
| `src/cli.ts` | Command-line entry point. |

See [CONTRIBUTING.md](CONTRIBUTING.md) to send a change.

### Publishing

Maintainers: [docs/launch-guide.md](docs/launch-guide.md) is a step-by-step launch checklist in plain English, and [docs/publishing.md](docs/publishing.md) has the registry details.

## License

[MIT](LICENSE). SaaS Puppy listing data belongs to SaaS Puppy and is served under the terms at [saaspuppy.com](https://saaspuppy.com).
