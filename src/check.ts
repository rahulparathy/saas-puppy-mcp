import { SITE_URL } from "./constants.js";
import { COMPARE_TOOLS, LIST_TOOLS } from "./tools.js";
import { RemoteDirectory } from "./remote.js";

const EXPECTED = [LIST_TOOLS.name, COMPARE_TOOLS.name];

/**
 * Plain-English self-test for `saas-puppy-mcp --check`.
 * Returns the process exit code: 0 when everything works, 1 otherwise.
 */
export async function runCheck(
  endpoint: string,
  timeoutMs: number,
  write: (line: string) => void,
): Promise<number> {
  write(`Checking the SaaS Puppy MCP at ${endpoint}`);
  write("");

  const remote = new RemoteDirectory(endpoint, { timeoutMs });
  try {
    let names: string[];
    try {
      names = await remote.listToolNames();
    } catch {
      write("FAIL  Could not connect.");
      write("      Check your internet connection and that the address above is right.");
      write(`      If the site is down, try again later or visit ${SITE_URL}.`);
      return 1;
    }
    write("PASS  Connected to the directory.");

    const missing = EXPECTED.filter((name) => !names.includes(name));
    if (missing.length > 0) {
      write(`FAIL  The directory is missing these tools: ${missing.join(", ")}.`);
      write("      This package may be out of date. Update it with: npm install -g saas-puppy-mcp@latest");
      return 1;
    }
    write(`PASS  Found both tools: ${EXPECTED.join(" and ")}.`);

    const reply = await remote.call(LIST_TOOLS.name, { query: "neon", category: "", pricing_models: [] });
    if (reply.isError) {
      write("FAIL  The directory answered a test question with an error.");
      write("      Try again in a minute. If it keeps failing, open an issue on GitHub.");
      return 1;
    }
    write("PASS  Asked a test question and got an answer.");
    write("");
    write("All good. Your AI app can use this server.");
    return 0;
  } finally {
    await remote.close();
  }
}
