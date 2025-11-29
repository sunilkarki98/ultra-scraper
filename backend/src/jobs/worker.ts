// FILE: src/jobs/worker.ts
// Dedicated worker entry point for BullMQ
// This file can be executed directly by ts-node or compiled to JS for production

import { Worker } from "bullmq";
import { redis } from "../utils/redis";
import config from "../config";
import { logger } from "../utils/logger";
import processorFn from "./workerProcessor";
import os from "os";

// Calculate dynamic concurrency: 2 jobs per CPU core
const CPU_CORES = os.cpus().length;
const DYNAMIC_CONCURRENCY = Math.max(1, CPU_CORES * 2);

const QUEUE_NAME = "scrape-queue";

// Global Error Handlers
process.on("uncaughtException", (err) => {
    console.error("🔥 Uncaught Exception:", err);
    logger.error({ err }, "🔥 Uncaught Exception in Worker Process");
    // Give logger time to flush before exit
    setTimeout(() => process.exit(1), 1000);
});

process.on("unhandledRejection", (reason, promise) => {
    logger.error({ reason }, "🔥 Unhandled Rejection in Worker Process");
});

// ================================
// 📊 MAIN WORKER PROCESS
// ================================
logger.info(`Starting dedicated BullMQ worker (PID: ${process.pid})...`);
logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
logger.info(`CPU Cores: ${CPU_CORES}`);
logger.info(`Dynamic Concurrency: ${DYNAMIC_CONCURRENCY}`);

// Create worker with direct processor function
const worker = new Worker(QUEUE_NAME, processorFn, {
    connection: redis,
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
    logger.info(`Worker: Job ${job.id} COMPLETED`);
});

worker.on('failed', (job, err) => {
    logger.error(`Worker: Job ${job?.id} FAILED: ${err.message}`);
    logger.error({ jobId: job?.id, err: err.message }, "🔥 Job Failed");
});

worker.on("active", (job) => {
    logger.debug(`Worker: Job ${job.id} ACTIVE`);
});

worker.on('stalled', (jobId) => {
    logger.warn(`Worker: Job ${jobId} STALLED`);
});

// Error handling
worker.on('error', (err) => {
    logger.error(`Worker ERROR: ${err.message}`);
});

// Worker ready
worker.on('ready', () => {
    logger.info(`Worker is READY and listening for jobs on queue: ${QUEUE_NAME}`);
});

// Graceful Shutdown
const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down worker...`);
    try {
        await worker.close();
        await redis.quit();
        logger.info("Worker shut down successfully");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error during shutdown:", err);
        process.exit(1);
    }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

logger.info("Worker process initialized successfully");
