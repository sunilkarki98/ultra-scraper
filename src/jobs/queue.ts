import { Queue, Worker, Job } from "bullmq";
import { logger } from "../utils/logger";
import config from "../config";
import { redis } from "../utils/redis";

// Scrapers
import { ExampleSiteScraper } from "../scrapers/exampleSiteScraper";
import { UniversalScraper, ScrapeOptions } from "../scrapers/universalScraper";

// 1️⃣ Define Queue
export const scrapeQueue = new Queue("scrape-queue", {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 500,
    attempts: 2,
    backoff: { type: "exponential", delay: 2000 },
  },
});

// 2️⃣ Worker
const worker = new Worker(
  "scrape-queue",
  async (job: Job) => {
    const { data } = job;
    const { url, type = "universal", options = {} } = data;
    const logMeta = { jobId: job.id, url, type };

    logger.info(logMeta, "⚡ Processing job start");

    const cacheKey = `scrape:${url}`;
    try {
      // Check Redis cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.info(logMeta, "🔹 Returning cached result");
        return JSON.parse(cached);
      }

      // Prepare ScrapeOptions
      const scrapeOptions: ScrapeOptions = {
        url,
        waitForSelector: options.waitForSelector,
        hydrationDelay: options.hydrationDelay ?? 2000,
        mobile: options.mobile ?? false,
        proxy: options.proxy,
        userAgent: options.userAgent,
        maxContentLength: options.maxContentLength,
        maxLinks: options.maxLinks,
      };

      // Initialize scraper based on type
      let result;

      switch (type) {
        case "universal":
          result = await new UniversalScraper().run(scrapeOptions);
          break;

        case "example":
          // Use ExampleSiteScraper with full ScrapeOptions to match baseScraper.run signature
          const exampleScraper = new ExampleSiteScraper();
          result = await exampleScraper.run(scrapeOptions);
          break;

        default:
          result = await new UniversalScraper().run(scrapeOptions);
          break;
      }

      // Cache successful result
      if (result?.success && result.data) {
        await redis.set(cacheKey, JSON.stringify(result.data), "EX", 3600);
        logger.info(logMeta, "✅ Job completed & cached");
        return result.data;
      }

      throw new Error(
        result?.error || "Scraper completed but returned no data"
      );
    } catch (error: any) {
      logger.error({ ...logMeta, err: error.message }, "❌ Job failed");
      throw error;
    }
  },
  {
    connection: redis,
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

// 3️⃣ Add job helper
export const addScrapeJob = async (
  url: string,
  type: string = "universal",
  options: Partial<ScrapeOptions> = {}
) => {
  const jobId = Buffer.from(url).toString("base64");
  return await scrapeQueue.add("scrape", { url, type, options }, { jobId });
};

// Progress & status logging
worker.on("completed", (job) =>
  logger.info({ jobId: job.id }, "🎉 Job completed successfully")
);
worker.on("active", (job) =>
  logger.info({ jobId: job.id }, "🚀 Job is now active")
);
worker.on("stalled", (jobId: string) =>
  logger.warn({ jobId }, "⚠️ Job has stalled")
);
worker.on("progress", (job, progress) =>
  logger.info({ jobId: job.id, progress }, "📊 Job progress updated")
);
