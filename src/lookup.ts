import { SITE_URL } from "./constants.js";

export const PUBLIC_CATEGORY_LIMIT = 3;

export const PUBLIC_LOOKUP_REFUSAL = `I can’t dump the SaaS Puppy directory or provide pagination workarounds. Ask about one tool or a category, or visit ${SITE_URL} for all listings.`;

/** Raised for requests the public MCP refuses. The message is safe to show to the model and the user. */
export class LookupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LookupError";
  }
}

export interface FocusedLookup {
  name: string;
  category: string;
  limit: number;
}

/**
 * Local copy of the public MCP's lookup guard. The hosted endpoint enforces the same rules;
 * checking here avoids a network round trip for requests it would refuse anyway.
 */
export function focusedLookup(query: string, category = ""): FocusedLookup {
  const name = query.trim();
  const group = category.trim();
  const looksBulk = (value: string) =>
    /[%_*(),]/.test(value) ||
    /\b(all|everything|dump|export|workaround|paginate|pagination|offset|directory)\b/i.test(value);

  if ((!name && !group) || [name, group].some(looksBulk)) {
    throw new LookupError(PUBLIC_LOOKUP_REFUSAL);
  }
  if (name && name.length < 2) {
    throw new LookupError("Enter a specific tool or provider name.");
  }
  return { name, category: group, limit: name ? 1 : PUBLIC_CATEGORY_LIMIT };
}
