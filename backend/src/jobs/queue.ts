// FILE: src/jobs/queue.ts
import { Queue } from "bullmq";
import { redis } from "../utils/redis";
import { logger } from "../utils/logger";

const QUEUE_NAME = "scrape-queue";

// 1️⃣ Define Queue (Producer Only)
// Note: Worker runs in a separate process (see worker.ts)
export const scrapeQueue = new Queue(QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 success logs in Redis
    removeOnFail: 1000, // Keep last 1000 fail logs for debugging
    attempts: 1, // Retries are handled manually inside the processor
  },
});

logger.info("✅ Queue initialized:", QUEUE_NAME);

// 2️⃣ Helper to Add Jobs
export const addScrapeJob = async (url: string, options: any = {}) => {
  // Create a deterministic ID based on URL to prevent duplicate queuing
  // e.g. scraping google.com twice in a row returns the same job ID
  const jobId = Buffer.from(url).toString("base64");
  return await scrapeQueue.add("scrape", { url, options }, { jobId });
};

// 3️⃣ Graceful Shutdown Helper
export const closeQueue = async () => {
  await scrapeQueue.close();
};
