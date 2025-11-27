// FILE: src/api/validators/scrape.validator.ts
import { z } from "zod";
import { SecurityGuard } from "../../utils/security";

// 🛡️ Helper: Async refinement wrapper for Zod
const safeUrlRefinement = async (url: string) => {
  return await SecurityGuard.isSafeUrl(url);
};

// Schema for POST /scrape (JSON Body)
export const ScrapeBodySchema = z.object({
  url: z
    .string()
    .url({ message: "Invalid URL format" })
    .refine(safeUrlRefinement, {
      message: "Forbidden: URL is internal, private, or restricted.",
    }),

  options: z
    .object({
      waitForSelector: z.string().optional(),

      // Robustness: Enforce limits to prevent memory overflows
      maxContentLength: z.number().int().positive().max(5000000).optional(), // Max 5MB text
      maxLinks: z.number().int().min(0).max(500).optional(), // Max 500 links
      hydrationDelay: z.number().int().min(0).max(60000).optional(), // Max 60s delay

      mobile: z.boolean().optional(),
      proxy: z.string().optional(), // format: protocol://user:pass@host:port

      // 🕸️ Advanced Crawler Options
      recursive: z.boolean().default(false),
      maxDepth: z.number().int().min(1).max(5).default(1), // Limit depth to prevent infinite loops
      maxPages: z.number().int().min(1).max(100).default(10), // Hard limit on total pages
      ignoreRobotsTxt: z.boolean().default(false),

      // 🪝 Webhook
      webhook: z.string().url().optional(),
      webhookSecret: z.string().min(16).optional(), // Minimum 16 chars for security

      // 🤖 AI/LLM Extraction
      useAI: z.boolean().default(false),
      aiPrompt: z.string().optional(),
      llmProvider: z.enum(["openai", "anthropic", "gemini", "custom"]).optional(),
      llmApiKey: z.string().optional(), // User can provide their own key
      llmModel: z.string().optional(),
      llmEndpoint: z.string().url().optional(), // For custom/local LLMs
    })
    .optional(),
});

// Schema for GET /scrape (Query Params)
export const ScrapeQuerySchema = z.object({
  url: z.string().url().refine(safeUrlRefinement, {
    message: "Forbidden: URL is internal, private, or restricted.",
  }),

  // Coercion & Transformation for Query Params
  mobile: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  sync: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),

  wait: z.string().optional(), // waitForSelector alias
  delay: z.coerce.number().int().min(0).max(60000).optional(),
  proxy: z.string().optional(),
});

export type ScrapeBody = z.infer<typeof ScrapeBodySchema>;
export type ScrapeQuery = z.infer<typeof ScrapeQuerySchema>;
