"use strict";
// FILE: src/jobs/worker.ts
// Dedicated worker entry point for BullMQ
// This file can be executed directly by ts-node or compiled to JS for production
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const redis_1 = require("../utils/redis");
const logger_1 = require("../utils/logger");
const workerProcessor_1 = __importDefault(require("./workerProcessor"));
const os_1 = __importDefault(require("os"));
// Calculate dynamic concurrency: 2 jobs per CPU core
const CPU_CORES = os_1.default.cpus().length;
const DYNAMIC_CONCURRENCY = Math.max(1, CPU_CORES * 2);
const QUEUE_NAME = "scrape-queue";
// Global Error Handlers
process.on("uncaughtException", (err) => {
    console.error("🔥 Uncaught Exception:", err);
    logger_1.logger.error({ err }, "🔥 Uncaught Exception in Worker Process");
    // Give logger time to flush before exit
    setTimeout(() => process.exit(1), 1000);
});
process.on("unhandledRejection", (reason, promise) => {
    logger_1.logger.error({ reason }, "🔥 Unhandled Rejection in Worker Process");
});
// ================================
// 📊 MAIN WORKER PROCESS
// ================================
logger_1.logger.info(`Starting dedicated BullMQ worker (PID: ${process.pid})...`);
logger_1.logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
logger_1.logger.info(`CPU Cores: ${CPU_CORES}`);
logger_1.logger.info(`Dynamic Concurrency: ${DYNAMIC_CONCURRENCY}`);
// Create worker with direct processor function
const worker = new bullmq_1.Worker(QUEUE_NAME, workerProcessor_1.default, {
    connection: redis_1.redis,
    concurrency: DYNAMIC_CONCURRENCY,
    limiter: {
        max: 20, // Max 20 jobs
        duration: 10000, // per 10 seconds
    },
    // Optimize for lower overhead
    lockDuration: 30000, // 30s lock duration
});
// Event Listeners
worker.on('completed', (job) => {
    logger_1.logger.info(`Worker: Job ${job.id} COMPLETED`);
});
worker.on('failed', (job, err) => {
    logger_1.logger.error(`Worker: Job ${job?.id} FAILED: ${err.message}`);
    logger_1.logger.error({ jobId: job?.id, err: err.message }, "🔥 Job Failed");
});
worker.on("active", (job) => {
    logger_1.logger.debug(`Worker: Job ${job.id} ACTIVE`);
});
worker.on('stalled', (jobId) => {
    logger_1.logger.warn(`Worker: Job ${jobId} STALLED`);
});
// Error handling
worker.on('error', (err) => {
    logger_1.logger.error(`Worker ERROR: ${err.message}`);
});
// Worker ready
worker.on('ready', () => {
    logger_1.logger.info(`Worker is READY and listening for jobs on queue: ${QUEUE_NAME}`);
});
// Graceful Shutdown
const gracefulShutdown = async (signal) => {
    logger_1.logger.info(`${signal} received. Shutting down worker...`);
    try {
        await worker.close();
        await redis_1.redis.quit();
        logger_1.logger.info("Worker shut down successfully");
        process.exit(0);
    }
    catch (err) {
        console.error("❌ Error during shutdown:", err);
        process.exit(1);
    }
};
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
logger_1.logger.info("Worker process initialized successfully");
