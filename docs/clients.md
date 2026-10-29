# Connecting clients

Public endpoint: `https://saaspuppy.com/MCP`. No authentication.

Every client below can use either the hosted endpoint (remote) or the npm package (`npx -y saas-puppy-mcp`, stdio). Remote needs no install.

## Claude Code

```bash
# Remote
claude mcp add --transport http saas-puppy https://saaspuppy.com/MCP

# Local package
claude mcp add saas-puppy -- npx -y saas-puppy-mcp
```

## Claude (web and desktop)

Settings, Connectors, add a custom connector. Enter `https://saaspuppy.com/MCP` and choose no authentication.

## ChatGPT

Add a custom remote MCP connection where your plan supports it. Use `https://saaspuppy.com/MCP` and no authentication.

## Cursor

Add a remote Streamable HTTP server in MCP settings or `mcp.json`:

```json
{
  "mcpServers": {
    "saas-puppy": { "url": "https://saaspuppy.com/MCP" }
  }
}
```

## VS Code

```json
{
  "servers": {
    "saas-puppy": { "type": "http", "url": "https://saaspuppy.com/MCP" }
  }
}
```

## Hermes Agent

```yaml
mcp_servers:
  saas_puppy:
    url: "https://saaspuppy.com/MCP"
    enabled: true
```

## OpenClaw

```json5
{
  mcp: {
    servers: {
      saas_puppy: {
        url: "https://saaspuppy.com/MCP",
        transport: "streamable-http"
      }
    }
  }
}
```

Client menus change often. If a step differs, follow the client's current MCP documentation and use the address above.
