// FILE: src/jobs/queue.ts
import { Queue, Worker, Job } from "bullmq";
import { redis } from "../utils/redis";
import { logger } from "../utils/logger";
import config from "../config";
import { ExampleSiteScraper } from "../scrapers/exampleSiteScraper";

// 1. Define the Queue (Producer side)
export const scrapeQueue = new Queue("scrape-queue", {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs in Redis
    removeOnFail: 500, // Keep last 500 failed jobs for debugging
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
});

// 2. Define the Worker (Consumer side)
// This runs in the background and processes jobs one by one (or concurrently)
const worker = new Worker(
  "scrape-queue",
  async (job: Job) => {
    const { url, type } = job.data;
    const logMeta = { jobId: job.id, url, type };

    logger.info(logMeta, "⚡ Processing job start");

    try {
      let result;

      // Scraper Factory: Select the right scraper based on job type
      switch (type) {
        case "example":
          const scraper = new ExampleSiteScraper();
          result = await scraper.run(url);
          break;

        // Add more cases here for different sites:
        // case 'amazon':
        //   result = await new AmazonScraper().run(url);
        //   break;

        default:
          throw new Error(`Unknown scraper type: ${type}`);
      }

      // Cache successful results in Redis (Optional, but recommended)
      // This allows the API to serve this data instantly next time
      if (result.success) {
        const cacheKey = `scrape:${url}`;
        await redis.set(cacheKey, JSON.stringify(result), "EX", 3600); // Expire in 1 hour
      }

      logger.info(logMeta, "✅ Job completed successfully");
      return result;
    } catch (error: any) {
      logger.error({ ...logMeta, err: error.message }, "❌ Job failed");
      throw error; // Throwing triggers BullMQ's retry mechanism
    }
  },
  {
    connection: redis,
    concurrency: config.scraping.concurrency, // Controlled by .env (e.g., 3)
    limiter: {
      max: 10, // Rate Limit: Max 10 jobs...
      duration: 1000, // ...per 1 second
    },
  }
);

// Worker Event Listeners
worker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, "Worker error");
});

worker.on("error", (err) => {
  // Connection errors (Redis down, etc)
  logger.error({ err }, "Worker connection error");
});

export const addScrapeJob = async (url: string, type: string = "example") => {
  // We use the URL as a deterministic ID to prevent duplicates in the queue
  // if the user spams the button.
  const jobId = Buffer.from(url).toString("base64");

  return await scrapeQueue.add("scrape", { url, type }, { jobId });
};
