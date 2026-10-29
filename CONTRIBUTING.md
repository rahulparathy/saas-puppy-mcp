# Contributing

1. Fork, then `npm install`.
2. Make the change and add a test for it in `test/`.
3. Run `npm run typecheck && npm run build && npm test`.
4. Open a pull request that says what changed and why.

## Keep the tools in step with the site

`list_tools` and `compare_tools` mirror the hosted public MCP. If the site changes a tool name, description or input schema, change `src/tools.ts` and `src/constants.ts` to match, and bump the version in `package.json`, `src/constants.ts` and `server.json`.

Do not add bulk export, pagination or write tools. The directory is meant to be looked up one tool or category at a time.
