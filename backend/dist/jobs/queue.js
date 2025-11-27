"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeQueue = exports.addScrapeJob = exports.scrapeQueue = void 0;
// FILE: src/jobs/queue.ts
const bullmq_1 = require("bullmq");
const path_1 = __importDefault(require("path"));
const redis_1 = require("../utils/redis");
const config_1 = __importDefault(require("../config"));
const logger_1 = require("../utils/logger");
const QUEUE_NAME = "scrape-queue";
// 1️⃣ Define Queue
exports.scrapeQueue = new bullmq_1.Queue(QUEUE_NAME, {
    connection: redis_1.redis,
    defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 success logs in Redis
        removeOnFail: 1000, // Keep last 1000 fail logs for debugging
        attempts: 1, // Retries are handled manually inside the processor
    },
});
// 2️⃣ Calculate Processor Path
// In development with ts-node, we want to point to the .ts file.
// In production (dist), we want the .js file.
const processorPath = path_1.default.resolve(__dirname, "../../dist/jobs/workerProcessor.js");
// 3️⃣ Define Worker (Sandboxed Mode)
const worker = new bullmq_1.Worker(QUEUE_NAME, processorPath, {
    connection: redis_1.redis,
    concurrency: config_1.default.scraping.concurrency, // e.g., 5 parallel jobs
    useWorkerThreads: false, // Spawns separate Child Processes (Best for Browsers)
    limiter: {
        max: 20, // Max 20 jobs...
        duration: 10000, // ...per 10 seconds
    },
});
// 4️⃣ Event Listeners (Observability)
worker.on("completed", (job) => {
    logger_1.logger.info({ jobId: job.id }, "🎉 Job Completed");
});
worker.on("failed", (job, err) => {
    logger_1.logger.error({ jobId: job?.id, err: err.message }, "🔥 Job Failed");
});
worker.on("active", (job) => {
    logger_1.logger.debug({ jobId: job.id }, "🚀 Job Active (Processing started)");
});
worker.on("stalled", (jobId) => {
    logger_1.logger.warn({ jobId }, "⚠️ Job Stalled (Worker crashed or timed out)");
});
worker.on("error", (err) => {
    logger_1.logger.error({ err }, "❌ Worker Connection Error");
});
// 5️⃣ Helper to Add Jobs
const addScrapeJob = async (url, options = {}) => {
    // Create a deterministic ID based on URL to prevent duplicate queuing
    // e.g. scraping google.com twice in a row returns the same job ID
    const jobId = Buffer.from(url).toString("base64");
    return await exports.scrapeQueue.add("scrape", { url, options }, { jobId });
};
exports.addScrapeJob = addScrapeJob;
// 6️⃣ Graceful Shutdown Helper
const closeQueue = async () => {
    await worker.close();
    await exports.scrapeQueue.close();
};
exports.closeQueue = closeQueue;
