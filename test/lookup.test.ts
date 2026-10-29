import { describe, expect, it } from "vitest";
import { PUBLIC_CATEGORY_LIMIT, PUBLIC_LOOKUP_REFUSAL, focusedLookup } from "../src/lookup.js";

describe("focusedLookup", () => {
  it.each(["", "all tools", "dump everything", "%", "*", "pagination workaround", "a,b", "export"])(
    "rejects bulk, wildcard and empty lookups: %j",
    (query) => {
      expect(() => focusedLookup(query)).toThrow(PUBLIC_LOOKUP_REFUSAL);
    },
  );

  it("rejects bulk wording in the category too", () => {
    expect(() => focusedLookup("", "everything")).toThrow();
    expect(() => focusedLookup("neon", "all")).toThrow();
  });

  it("rejects one-character names", () => {
    expect(() => focusedLookup("a")).toThrow("Enter a specific tool or provider name.");
  });

  it("limits a named tool to one result and a category to three", () => {
    expect(focusedLookup("Neon").limit).toBe(1);
    expect(focusedLookup("", "hosting").limit).toBe(3);
    expect(PUBLIC_CATEGORY_LIMIT).toBe(3);
  });

  it("trims input", () => {
    expect(focusedLookup("  Neon  ", "  databases ")).toEqual({ name: "Neon", category: "databases", limit: 1 });
  });
});
