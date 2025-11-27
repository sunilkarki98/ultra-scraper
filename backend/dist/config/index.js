"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// FILE: src/config/index.ts
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
const path_1 = __importDefault(require("path"));
const calculateConcurrency_1 = require("../utils/calculateConcurrency");
const envHelpers_1 = require("../utils/envHelpers"); // 👈 Imported here
dotenv_1.default.config();
// -----------------------------
// 🔧 Resource-based concurrency
// -----------------------------
const safeConcurrency = (0, calculateConcurrency_1.calculateConcurrency)({
    maxMemoryMb: process.env.MAX_MEMORY_MB,
    maxCpuCores: process.env.MAX_CPU_CORES,
    concurrencyOverride: process.env.CONCURRENCY,
    utilizationPct: process.env.RESOURCE_UTILIZATION_PCT,
});
// -----------------------------
// 📌 Zod Schema Definition
// -----------------------------
const configSchema = zod_1.z.object({
    port: zod_1.z.coerce.number().default(3000),
    env: zod_1.z.enum(["development", "production", "test"]).default("development"),
    redis: zod_1.z.object({
        url: zod_1.z.string().optional(),
        host: zod_1.z.string().default("127.0.0.1"),
        port: zod_1.z.coerce.number().default(6379),
        password: zod_1.z.string().optional(),
    }),
    services: zod_1.z.object({
        openaiApiKey: zod_1.z.string().optional(),
        captchaApiKey: zod_1.z.string().optional(),
    }),
    paths: zod_1.z.object({
        debug: zod_1.z.string().default(path_1.default.resolve(process.cwd(), "debug")),
        logs: zod_1.z.string().default(path_1.default.resolve(process.cwd(), "logs")),
        data: zod_1.z.string().default(path_1.default.resolve(process.cwd(), "data")),
    }),
    logLevel: zod_1.z.string().default("info"),
    scraping: zod_1.z.object({
        headless: zod_1.z.boolean().default(true),
        timeout: zod_1.z.number().default(30000),
        defaultProxy: zod_1.z.string().optional(),
        rotateUserAgents: zod_1.z.boolean().default(true),
        blockAssets: zod_1.z.boolean().default(true),
        gotoRetries: zod_1.z.number().default(3),
        proxies: zod_1.z.string().optional(),
        concurrency: zod_1.z.number(),
        maxMemoryMb: zod_1.z.number().optional(),
        utilizationPct: zod_1.z.number().default(80),
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
        headless: (0, envHelpers_1.parseBool)(process.env.HEADLESS, true),
        timeout: (0, envHelpers_1.parseNumber)(process.env.SCRAPE_TIMEOUT, 30000),
        defaultProxy: process.env.PROXY_URL,
        rotateUserAgents: (0, envHelpers_1.parseBool)(process.env.ROTATE_UA, true),
        blockAssets: (0, envHelpers_1.parseBool)(process.env.BLOCK_ASSETS, true),
        gotoRetries: (0, envHelpers_1.parseNumber)(process.env.GOTO_RETRIES, 3),
        proxies: process.env.PROXIES,
        concurrency: safeConcurrency,
        maxMemoryMb: (0, envHelpers_1.parseNumber)(process.env.MAX_MEMORY_MB),
        utilizationPct: (0, envHelpers_1.parseNumber)(process.env.RESOURCE_UTILIZATION_PCT, 80),
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
    console.log(`⚖️ Resource Audit (${config.scraping.utilizationPct}% Utilization):`);
    console.log(`   • RAM Limit: ${process.env.MAX_MEMORY_MB || "Auto"} MB`);
    console.log(`   • CPU Limit: ${process.env.MAX_CPU_CORES || "Auto"} cores`);
    console.log(`   • Calculated Safe Concurrency: ${config.scraping.concurrency}`);
    console.log("");
}
exports.default = config;
