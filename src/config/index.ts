import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const configSchema = z.object({
  port: z.coerce.number().default(3000),
  env: z.enum(["development", "production", "test"]).default("development"),

  redis: z.object({
    url: z.string().optional(), // Railway URL
    host: z.string().default("127.0.0.1"),
    port: z.coerce.number().default(6379),
    password: z.string().optional(),
  }),

  scraping: z.object({
    // Force headless in production to prevent crashes
    headless: z.coerce.boolean().default(true),
    // Safety: Default to 1 or 2. Higher values will crash Railway Starter/Hobby plans.
    concurrency: z.coerce.number().default(2),
  }),

  logLevel: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default((process.env.LOG_LEVEL as any) || "info"), // <-- Add logLevel
});

const parsed = configSchema.parse({
  port: process.env.PORT,
  env: process.env.NODE_ENV,
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  },
  scraping: {
    headless: process.env.HEADLESS,
    concurrency: process.env.CONCURRENCY,
  },
  logLevel: process.env.LOG_LEVEL,
});

// Force headless true if in production (Safety Override)
if (parsed.env === "production") {
  parsed.scraping.headless = true;
}

export default parsed;
