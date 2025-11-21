import { Queue, Worker, Job } from "bullmq";
import { logger } from "../utils/logger";
import config from "../config";
import { ExampleSiteScraper } from "../scrapers/exampleSiteScraper";
// ✅ Import the configured connection we fixed earlier
import { redis } from "../utils/redis";

// 1. Define Queue
// We pass the imported 'redis' instance directly to 'connection'
export const scrapeQueue = new Queue("scrape-queue", {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 500,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
});

// 2. Worker
const worker = new Worker(
  "scrape-queue",
  async (job: Job) => {
    const { url, type } = job.data;
    const logMeta = { jobId: job.id, url, type };

    logger.info(logMeta, "⚡ Processing job start");

    try {
      let result;

      switch (type) {
        case "example":
          const scraper = new ExampleSiteScraper();
          result = await scraper.run(url);
          break;

        default:
          throw new Error(`Unknown scraper type: ${type}`);
      }

      if (result.success) {
        const cacheKey = `scrape:${url}`;

        // ✅ FIX: Don't create a new Redis client here.
        // Reuse the imported 'redis' instance.
        // This is faster and prevents connection leaks.
        await redis.set(cacheKey, JSON.stringify(result), "EX", 3600);
      }

      logger.info(logMeta, "✅ Job completed successfully");
      return result;
    } catch (error: any) {
      logger.error({ ...logMeta, err: error.message }, "❌ Job failed");
      throw error;
    }
  },
  {
    // ✅ Use the shared connection here too
    connection: redis,
    concurrency: config.scraping.concurrency,
    limiter: {
      max: 10,
      duration: 1000,
    },
  }
);

// Worker Events
worker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, "Worker error");
});

worker.on("error", (err) => {
  logger.error({ err }, "Worker connection error");
});

// Add job helper
export const addScrapeJob = async (url: string, type: string = "example") => {
  const jobId = Buffer.from(url).toString("base64");
  return await scrapeQueue.add("scrape", { url, type }, { jobId });
};
