# Publishing and listing

This repository is private until the SaaS Puppy directory launches. Do these steps in order when you go public.

## 0. Before the first release

1. Confirm `https://saaspuppy.com/MCP` is live and answers `tools/list` with `list_tools` and `compare_tools`.
2. Make the repository public (Settings, General, Danger Zone, Change visibility).
3. Check `package.json` and `server.json` carry the same version. `npm test` enforces this.

## 1. Publish to npm

```bash
npm login
npm run prepublishOnly   # typecheck, test, build
npm publish --access public
```

The package name `saas-puppy-mcp` was unclaimed when this repository was created. Check again before publishing, and switch to a scope such as `@your-name/saas-puppy-mcp` if it has been taken. If you change the name, update `server.json` (`packages[0].identifier`) too.

## 2. Official MCP Registry

The registry holds metadata only. `server.json` is ready, with both the npm package and the hosted remote. The name `io.github.rahulparathy/saas-puppy` matches `mcpName` in `package.json`, which the registry checks.

```bash
brew install mcp-publisher        # or download the release binary
mcp-publisher login github        # log in as rahulparathy
mcp-publisher publish
```

Check the result:

```bash
curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.rahulparathy/saas-puppy"
```

The release workflow in `.github/workflows/release.yml` can do both the npm and registry steps when you push a version tag. It needs an `NPM_TOKEN` repository secret.

For later releases, bump the version in `package.json`, `src/constants.ts` and `server.json` (twice), update `CHANGELOG.md`, then tag: `git tag v0.1.1 && git push --tags`.

## 3. Smithery

`smithery.yaml` and the `Dockerfile` are included. Add the GitHub repository on [smithery.ai](https://smithery.ai) and follow its deploy flow. Smithery changes its requirements from time to time, so check its current docs if the build asks for something different.

## 4. Glama

`glama.json` claims the listing for the maintainer. Glama indexes public GitHub repositories automatically. Sign in at [glama.ai](https://glama.ai), find the server, and claim it.

## 5. Other directories

These accept a GitHub link or a short form. Use the same name, one-line description and tags in each.

| Directory | Notes |
| --- | --- |
| [mcp.so](https://mcp.so) | Submit the GitHub URL. |
| [PulseMCP](https://www.pulsemcp.com) | Picks up servers from the official registry; submit manually if missing. |
| [mcpservers.org](https://mcpservers.org) | Submit through the site form. |
| [Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers) | Open a pull request adding one line under a fitting category. |
| [Cursor directory](https://cursor.directory) | Submit through the site. |

Suggested listing text:

- **Name:** SaaS Puppy
- **One line:** Look up or compare free-tier developer tools, with the catch spelled out.
- **Tags:** directory, saas, free-tier, pricing, developer-tools, comparison
- **Transport:** Streamable HTTP (remote) and stdio (npm)
- **Auth:** none
- **Endpoint:** `https://saaspuppy.com/MCP`
- **Install:** `npx -y saas-puppy-mcp`

Directory requirements change, so check each site's current submission guide before you submit.
