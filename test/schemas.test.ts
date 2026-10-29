import { describe, expect, it } from "vitest";
import { z } from "zod";
import { compareToolsInput, listToolsInput } from "../src/tools.js";

const list = z.object(listToolsInput).strict();
const compare = z.object(compareToolsInput).strict();

describe("tool schemas", () => {
  it("compare_tools accepts two or three slugs only", () => {
    expect(compare.safeParse({ slugs: ["a-tool"] }).success).toBe(false);
    expect(compare.safeParse({ slugs: ["a-tool", "b-tool"] }).success).toBe(true);
    expect(compare.safeParse({ slugs: ["a", "b", "c"] }).success).toBe(true);
    expect(compare.safeParse({ slugs: ["a", "b", "c", "d"] }).success).toBe(false);
  });

  it("compare_tools rejects malformed slugs", () => {
    expect(compare.safeParse({ slugs: ["Not A Slug", "ok-slug"] }).success).toBe(false);
  });

  it("list_tools has no pagination or caller-selected limit", () => {
    expect(list.safeParse({ query: "Neon", offset: 40 }).success).toBe(false);
    expect(list.safeParse({ query: "Neon", limit: 40 }).success).toBe(false);
  });

  it("list_tools defaults every field and limits pricing models", () => {
    expect(list.parse({})).toEqual({ query: "", category: "", pricing_models: [] });
    expect(list.safeParse({ pricing_models: ["free-forever", "open-source"] }).success).toBe(true);
    expect(list.safeParse({ pricing_models: ["enterprise"] }).success).toBe(false);
  });
});
