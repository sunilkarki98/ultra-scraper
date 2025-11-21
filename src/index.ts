import express from "express";
import { QueueEvents } from "bullmq"; // <--- Import this
import config from "./config";
import { logger } from "./utils/logger";
import { addScrapeJob, scrapeQueue } from "./jobs/queue";
import { redis } from "./utils/redis";
import { BrowserManager } from "./browser/playright";

const app = express();
app.use(express.json());

// Initialize QueueEvents to listen for job completion
// This allows us to "wait" for the worker
const queueEvents = new QueueEvents("scrape-queue", { connection: redis });

// --- HEALTH CHECK ---
app.get("/health", async (req, res) => {
  const health: Record<string, any> = {
    status: "ok",
    uptime: process.uptime(),
    services: { redis: "unknown", queue: "unknown" },
  };

  try {
    await redis.ping();
    health.services.redis = "up";
  } catch {
    health.services.redis = "down";
  }

  try {
    const counts = await scrapeQueue.getJobCounts(
      "active",
      "waiting",
      "failed"
    );
    health.services.queue = { status: "up", counts };
  } catch {
    health.services.queue = "down";
  }

  res.json(health);
});

// --- MAIN SCRAPE ROUTE (GET) ---
// Changed from POST to GET so you can test in browser easily
app.get("/scrape", async (req, res) => {
  const url = req.query.url as string;
  const type = (req.query.type as string) || "universal";
  const force = req.query.force === "true"; // ?force=true to bypass cache

  if (!url)
    return res.status(400).json({ error: "Missing 'url' query parameter" });

  // 1. Check Cache
  if (!force) {
    const cached = await redis.get(`scrape:${url}`);
    if (cached) {
      logger.info({ url }, "⚡ Served from Cache");
      return res.json(JSON.parse(cached));
    }
  }

  // 2. Queue Job & Wait
  try {
    const job = await addScrapeJob(url, type);

    // ⏳ WAIT HERE: Wait up to 60 seconds for the worker to finish
    // This makes the request look synchronous to the user
    const result = await job.waitUntilFinished(queueEvents, 60000);

    // 3. Return Data
    res.json(result);
  } catch (e: any) {
    if (e.message.includes("timed out")) {
      res
        .status(504)
        .json({ error: "Scrape timed out (website might be slow)" });
    } else {
      logger.error({ err: e.message }, "Scrape API Error");
      res.status(500).json({ error: "Scrape failed", details: e.message });
    }
  }
});

// --- JOB STATUS (Optional Debugging) ---
app.get("/job/:id", async (req, res) => {
  const job = await scrapeQueue.getJob(req.params.id);
  if (!job) return res.status(404).json({ error: "Not found" });
  res.json({
    id: job.id,
    state: await job.getState(),
    result: job.returnvalue,
    error: job.failedReason,
  });
});

const server = app.listen(config.port, async () => {
  await BrowserManager.init(); // Pre-launch browser
  logger.info(`🚀 Server running on port ${config.port}`);
});

// Graceful Shutdown
const cleanup = async () => {
  logger.info("Shutting down...");
  await BrowserManager.closeBrowser();
  await scrapeQueue.close();
  await redis.quit();
  process.exit(0);
};

process.on("SIGTERM", cleanup);
process.on("SIGINT", cleanup);
process.on("uncaughtException", async (err) => {
  logger.error({ err }, "Uncaught Exception");
  await cleanup();
});
process.on("unhandledRejection", async (reason) => {
  logger.error({ reason }, "Unhandled Rejection");
  await cleanup();
});