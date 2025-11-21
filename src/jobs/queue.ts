import { Queue, Worker, Job } from "bullmq";
import { logger } from "../utils/logger";
import config from "../config";
import { redis } from "../utils/redis"; // Shared Redis connection

// Scrapers
import { ExampleSiteScraper } from "../scrapers/exampleSiteScraper";
import { UniversalScraper } from "../scrapers/universalScraper"; // <--- 1. Import new scraper

// 1. Define Queue
export const scrapeQueue = new Queue("scrape-queue", {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 500,
    attempts: 2, // Reduced to 2 for Playwright (save resources)
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

      // 2. Switch based on type (default to universal)
      switch (type) {
        case "universal":
          const uniScraper = new UniversalScraper();
          result = await uniScraper.run(url);
          break;

        case "example":
          const exScraper = new ExampleSiteScraper();
          result = await exScraper.run(url);
          break;

        default:
          // Fallback to universal if unknown
          const defaultScraper = new UniversalScraper();
          result = await defaultScraper.run(url);
          break;
      }

      // 3. Handle Result & Cache
      if (result && result.success) {
        const cacheKey = `scrape:${url}`;

        // Optimization: Cache result.data (clean JSON) instead of the full wrapper
        const payload = result.data;

        await redis.set(cacheKey, JSON.stringify(payload), "EX", 3600);

        logger.info(logMeta, "✅ Job completed & Cached");

        // Return the clean data so the API gets it via job.waitUntilFinished()
        return payload;
      }

      throw new Error("Scraper completed but returned no data");
    } catch (error: any) {
      logger.error({ ...logMeta, err: error.message }, "❌ Job failed");
      throw error;
    }
  },
  {
    connection: redis,
    // Warning: Keep this low (1 or 2) on Railway Starter/Hobby plans
    // Playwright uses a lot of RAM.
    concurrency: config.scraping.concurrency || 2,
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
// Changed default type to "universal"
export const addScrapeJob = async (url: string, type: string = "universal") => {
  // Use Base64 of URL as ID to prevent duplicate jobs for the same URL
  const jobId = Buffer.from(url).toString("base64");
  return await scrapeQueue.add("scrape", { url, type }, { jobId });
};
