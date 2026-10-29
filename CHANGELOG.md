# Changelog

## 0.1.0

First release.

- `list_tools` and `compare_tools`, with the same names, schemas and instructions as the hosted public SaaS Puppy MCP.
- Stdio mode for `npx`, and a stateless Streamable HTTP mode with a `/healthz` check.
- Local guard that refuses bulk, wildcard and pagination requests before they reach the network.
- `--check` self-test that explains the result in plain English.
- Dockerfile, `server.json` for the official MCP Registry, `smithery.yaml` and `glama.json`.
