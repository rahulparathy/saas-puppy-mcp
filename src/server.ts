import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
  DEFAULT_ENDPOINT,
  INSTRUCTIONS,
  SERVER_NAME,
  SERVER_TITLE,
  SITE_URL,
  VERSION,
} from "./constants.js";
import { LookupError, focusedLookup } from "./lookup.js";
import { RemoteDirectory } from "./remote.js";
import {
  COMPARE_TOOLS,
  LIST_TOOLS,
  TOOL_ANNOTATIONS,
  compareToolsInput,
  listToolsInput,
} from "./tools.js";

export { DEFAULT_ENDPOINT, VERSION } from "./constants.js";
export { RemoteDirectory } from "./remote.js";

const refusal = (message: string): CallToolResult => ({
  isError: true,
  content: [{ type: "text", text: message }],
});

/**
 * Builds the SaaS Puppy MCP server. Tool definitions live here so clients and registries can list them
 * without the hosted endpoint being reachable; calls are forwarded to the hosted public MCP.
 */
export function createServer(remote: RemoteDirectory): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, title: SERVER_TITLE, version: VERSION, websiteUrl: SITE_URL },
    { instructions: INSTRUCTIONS },
  );

  server.registerTool(
    LIST_TOOLS.name,
    {
      title: LIST_TOOLS.title,
      description: LIST_TOOLS.description,
      inputSchema: listToolsInput,
      annotations: TOOL_ANNOTATIONS,
    },
    async ({ query, category, pricing_models }) => {
      try {
        focusedLookup(query, category);
      } catch (error) {
        if (error instanceof LookupError) return refusal(error.message);
        throw error;
      }
      return remote.call(LIST_TOOLS.name, { query, category, pricing_models });
    },
  );

  server.registerTool(
    COMPARE_TOOLS.name,
    {
      title: COMPARE_TOOLS.title,
      description: COMPARE_TOOLS.description,
      inputSchema: compareToolsInput,
      annotations: TOOL_ANNOTATIONS,
    },
    async ({ slugs }) => {
      if (new Set(slugs).size !== slugs.length) return refusal("Choose distinct tools to compare.");
      return remote.call(COMPARE_TOOLS.name, { slugs });
    },
  );

  return server;
}
