import { chmodSync } from "node:fs";

// Make the CLI entry executable so `npx saas-puppy-mcp` works on Unix.
chmodSync(new URL("../dist/cli.js", import.meta.url), 0o755);
