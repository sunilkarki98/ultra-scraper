"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeQueue = exports.addScrapeJob = exports.scrapeQueue = void 0;
// FILE: src/jobs/queue.ts
const bullmq_1 = require("bullmq");
const redis_1 = require("../utils/redis");
const logger_1 = require("../utils/logger");
const QUEUE_NAME = "scrape-queue";
// 1️⃣ Define Queue (Producer Only)
// Note: Worker runs in a separate process (see worker.ts)
exports.scrapeQueue = new bullmq_1.Queue(QUEUE_NAME, {
    connection: redis_1.redis,
    defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 success logs in Redis
        removeOnFail: 1000, // Keep last 1000 fail logs for debugging
        attempts: 1, // Retries are handled manually inside the processor
    },
});
logger_1.logger.info("✅ Queue initialized:", QUEUE_NAME);
// 2️⃣ Helper to Add Jobs
const addScrapeJob = async (url, options = {}) => {
    // Create a deterministic ID based on URL to prevent duplicate queuing
    // e.g. scraping google.com twice in a row returns the same job ID
    const jobId = Buffer.from(url).toString("base64");
    return await exports.scrapeQueue.add("scrape", { url, options }, { jobId });
};
exports.addScrapeJob = addScrapeJob;
// 3️⃣ Graceful Shutdown Helper
const closeQueue = async () => {
    await exports.scrapeQueue.close();
};
exports.closeQueue = closeQueue;
