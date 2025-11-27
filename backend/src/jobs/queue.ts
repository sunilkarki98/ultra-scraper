// FILE: src/jobs/queue.ts
import { Queue, Worker } from "bullmq";
import path from "path";
import { redis } from "../utils/redis";
import config from "../config";
import { logger } from "../utils/logger";

const QUEUE_NAME = "scrape-queue";

// 1️⃣ Define Queue
export const scrapeQueue = new Queue(QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 success logs in Redis
    removeOnFail: 1000, // Keep last 1000 fail logs for debugging
    attempts: 1, // Retries are handled manually inside the processor
  },
});

// 2️⃣ Calculate Processor Path
// In development with ts-node, we want to point to the .ts file.
// In production (dist), we want the .js file.
const processorPath = path.resolve(__dirname, "../../dist/jobs/workerProcessor.js");

// 3️⃣ Define Worker (Sandboxed Mode)
const worker = new Worker(QUEUE_NAME, processorPath, {
  connection: redis,
  concurrency: config.scraping.concurrency, // e.g., 5 parallel jobs
  useWorkerThreads: false, // Spawns separate Child Processes (Best for Browsers)
  limiter: {
    max: 20, // Max 20 jobs...
    duration: 10000, // ...per 10 seconds
  },
});

// 4️⃣ Event Listeners (Observability)
worker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "🎉 Job Completed");
});

worker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, "🔥 Job Failed");
});

worker.on("active", (job) => {
  logger.debug({ jobId: job.id }, "🚀 Job Active (Processing started)");
});

worker.on("stalled", (jobId) => {
  logger.warn({ jobId }, "⚠️ Job Stalled (Worker crashed or timed out)");
});

worker.on("error", (err) => {
  logger.error({ err }, "❌ Worker Connection Error");
});

// 5️⃣ Helper to Add Jobs
export const addScrapeJob = async (url: string, options: any = {}) => {
  // Create a deterministic ID based on URL to prevent duplicate queuing
  // e.g. scraping google.com twice in a row returns the same job ID
  const jobId = Buffer.from(url).toString("base64");
  return await scrapeQueue.add("scrape", { url, options }, { jobId });
};

// 6️⃣ Graceful Shutdown Helper
export const closeQueue = async () => {
  await worker.close();
  await scrapeQueue.close();
};
