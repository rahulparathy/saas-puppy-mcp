import { z } from "zod";
import { PRICING_MODELS } from "./constants.js";

const slug = z
  .string()
  .max(160)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

/** Input shapes. Identical to the hosted public MCP so clients see the same tools either way. */
export const listToolsInput = {
  query: z
    .string()
    .max(100)
    .default("")
    .describe("Exact tool name or slug, for example “Neon” or “cloudflare-turnstile”."),
  category: z
    .string()
    .max(60)
    .default("")
    .describe("Category to sample, for example “hosting”. Returns at most three examples."),
  pricing_models: z
    .array(z.enum(PRICING_MODELS))
    .max(4)
    .default([])
    .describe("Optional filters: free-forever, free-trial, open-source, self-hosted."),
};

export const compareToolsInput = {
  slugs: z
    .array(slug)
    .min(2)
    .max(3)
    .describe("Two or three tool slugs from the same category."),
};

export const TOOL_ANNOTATIONS = {
  readOnlyHint: true,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export const LIST_TOOLS = {
  name: "list_tools",
  title: "Summarize a tool or category",
  description:
    "Summarize one exact tool name or slug, or up to three examples from a specific category. No bulk exports, pagination or full records; visit SaaS Puppy for more.",
} as const;

export const COMPARE_TOOLS = {
  name: "compare_tools",
  title: "Compare tool summaries",
  description:
    "Compare short purpose, quota, pros, cons and catch summaries for two or three tools in one category; full details remain on SaaS Puppy.",
} as const;
