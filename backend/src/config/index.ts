// FILE: src/config/index.ts
import dotenv from "dotenv";
import { z } from "zod";
import path from "path";
import { calculateConcurrency } from "../utils/calculateConcurrency";
import { parseBool, parseNumber } from "../utils/envHelpers"; // 👈 Imported here

dotenv.config();

// -----------------------------
// 🔧 Resource-based concurrency
// -----------------------------
const safeConcurrency = calculateConcurrency({
  maxMemoryMb: process.env.MAX_MEMORY_MB,
  maxCpuCores: process.env.MAX_CPU_CORES,
  concurrencyOverride: process.env.CONCURRENCY,
  utilizationPct: process.env.RESOURCE_UTILIZATION_PCT,
});

// -----------------------------
// 📌 Zod Schema Definition
// -----------------------------
const configSchema = z.object({
  port: z.coerce.number().default(3000),
  env: z.enum(["development", "production", "test"]).default("development"),

  redis: z.object({
    url: z.string().optional(),
    host: z.string().default("127.0.0.1"),
    port: z.coerce.number().default(6379),
    password: z.string().optional(),
  }),

  services: z.object({
    openaiApiKey: z.string().optional(),
    captchaApiKey: z.string().optional(),
  }),

  paths: z.object({
    debug: z.string().default(path.resolve(process.cwd(), "debug")),
    logs: z.string().default(path.resolve(process.cwd(), "logs")),
    data: z.string().default(path.resolve(process.cwd(), "data")),
  }),

  logLevel: z.string().default("info"),

  scraping: z.object({
    headless: z.boolean().default(true),
    timeout: z.number().default(30000),
    defaultProxy: z.string().optional(),
    rotateUserAgents: z.boolean().default(true),
    blockAssets: z.boolean().default(true),
    gotoRetries: z.number().default(3),
    proxies: z.string().optional(),

    concurrency: z.number(),
    maxMemoryMb: z.number().optional(),
    utilizationPct: z.number().default(80),
  }),
});

// -----------------------------
// 📌 Raw Config (Environment)
// -----------------------------
const rawConfig = {
  port: process.env.PORT,
  env: process.env.NODE_ENV,

  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  },

  services: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    captchaApiKey: process.env.CAPTCHA_API_KEY,
  },

  paths: {
    debug: process.env.DEBUG_DIR,
    logs: process.env.LOG_DIR,
    data: process.env.DATA_DIR,
  },

  logLevel: process.env.LOG_LEVEL,

  scraping: {
    headless: parseBool(process.env.HEADLESS, true),
    timeout: parseNumber(process.env.SCRAPE_TIMEOUT, 30000),
    defaultProxy: process.env.PROXY_URL,
    rotateUserAgents: parseBool(process.env.ROTATE_UA, true),
    blockAssets: parseBool(process.env.BLOCK_ASSETS, true),
    gotoRetries: parseNumber(process.env.GOTO_RETRIES, 3),
    proxies: process.env.PROXIES,

    concurrency: safeConcurrency,
    maxMemoryMb: parseNumber(process.env.MAX_MEMORY_MB),
    utilizationPct: parseNumber(process.env.RESOURCE_UTILIZATION_PCT, 80),
  },
};

// -----------------------------
// 🔍 Validate & Build Final Config
// -----------------------------
const config = configSchema.parse(rawConfig);

// Force headless in production unless forced otherwise
if (config.env === "production" && process.env.FORCE_HEADFUL !== "true") {
  config.scraping.headless = true;
}

// -----------------------------
// 📊 Audit Logs
// -----------------------------
if (process.env.MAX_MEMORY_MB || process.env.MAX_CPU_CORES) {
  console.log("");
  console.log(
    `⚖️ Resource Audit (${config.scraping.utilizationPct}% Utilization):`
  );
  console.log(`   • RAM Limit: ${process.env.MAX_MEMORY_MB || "Auto"} MB`);
  console.log(`   • CPU Limit: ${process.env.MAX_CPU_CORES || "Auto"} cores`);
  console.log(
    `   • Calculated Safe Concurrency: ${config.scraping.concurrency}`
  );
  console.log("");
}

export type Config = z.infer<typeof configSchema>;
export default config;
