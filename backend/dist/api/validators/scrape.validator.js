"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrapeQuerySchema = exports.ScrapeBodySchema = void 0;
// FILE: src/api/validators/scrape.validator.ts
const zod_1 = require("zod");
const security_1 = require("../../utils/security");
// 🛡️ Helper: Async refinement wrapper for Zod
const safeUrlRefinement = async (url) => {
    return await security_1.SecurityGuard.isSafeUrl(url);
};
// Schema for POST /scrape (JSON Body)
exports.ScrapeBodySchema = zod_1.z.object({
    url: zod_1.z
        .string()
        .url({ message: "Invalid URL format" })
        .refine(safeUrlRefinement, {
        message: "Forbidden: URL is internal, private, or restricted.",
    }),
    options: zod_1.z
        .object({
        waitForSelector: zod_1.z.string().optional(),
        // Robustness: Enforce limits to prevent memory overflows
        maxContentLength: zod_1.z.number().int().positive().max(5000000).optional(), // Max 5MB text
        maxLinks: zod_1.z.number().int().min(0).max(500).optional(), // Max 500 links
        hydrationDelay: zod_1.z.number().int().min(0).max(60000).optional(), // Max 60s delay
        mobile: zod_1.z.boolean().optional(),
        proxy: zod_1.z.string().optional(), // format: protocol://user:pass@host:port
        // 🕸️ Advanced Crawler Options
        recursive: zod_1.z.boolean().default(false),
        maxDepth: zod_1.z.number().int().min(1).max(5).default(1), // Limit depth to prevent infinite loops
        maxPages: zod_1.z.number().int().min(1).max(100).default(10), // Hard limit on total pages
        ignoreRobotsTxt: zod_1.z.boolean().default(false),
        // 🪝 Webhook
        webhook: zod_1.z.string().url().optional(),
        webhookSecret: zod_1.z.string().min(16).optional(), // Minimum 16 chars for security
        // 🤖 AI/LLM Extraction
        useAI: zod_1.z.boolean().default(false),
        aiPrompt: zod_1.z.string().optional(),
        llmProvider: zod_1.z.enum(["openai", "anthropic", "gemini", "custom"]).optional(),
        llmApiKey: zod_1.z.string().optional(), // User can provide their own key
        llmModel: zod_1.z.string().optional(),
        llmEndpoint: zod_1.z.string().url().optional(), // For custom/local LLMs
    })
        .optional(),
});
// Schema for GET /scrape (Query Params)
exports.ScrapeQuerySchema = zod_1.z.object({
    url: zod_1.z.string().url().refine(safeUrlRefinement, {
        message: "Forbidden: URL is internal, private, or restricted.",
    }),
    // Coercion & Transformation for Query Params
    mobile: zod_1.z
        .enum(["true", "false"])
        .optional()
        .transform((v) => v === "true"),
    sync: zod_1.z
        .enum(["true", "false"])
        .optional()
        .transform((v) => v === "true"),
    wait: zod_1.z.string().optional(), // waitForSelector alias
    delay: zod_1.z.coerce.number().int().min(0).max(60000).optional(),
    proxy: zod_1.z.string().optional(),
});
