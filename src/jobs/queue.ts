import { Queue, Worker, Job } from "bullmq";
import { logger } from "../utils/logger";
import config from "../config";
import { ExampleSiteScraper } from "../scrapers/exampleSiteScraper";

// BullMQ connection config
const connection = process.env.REDIS_URL
  ? { connectionString: process.env.REDIS_URL } // Railway
  : {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    };

// 1. Define Queue
export const scrapeQueue = new Queue("scrape-queue", {
  connection,
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
        // Store using a new redis client inside Worker
        const Redis = require("ioredis");
        const redisClient = process.env.REDIS_URL
          ? new Redis(process.env.REDIS_URL)
          : new Redis({
              host: process.env.REDIS_HOST || "127.0.0.1",
              port: Number(process.env.REDIS_PORT) || 6379,
              password: process.env.REDIS_PASSWORD || undefined,
            });

        await redisClient.set(cacheKey, JSON.stringify(result), "EX", 3600);
        redisClient.quit();
      }

      logger.info(logMeta, "✅ Job completed successfully");
      return result;
    } catch (error: any) {
      logger.error({ ...logMeta, err: error.message }, "❌ Job failed");
      throw error;
    }
  },
  {
    connection,
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
