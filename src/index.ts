import express from "express";
import config from "./config";
import { logger } from "./utils/logger";
import { addScrapeJob, scrapeQueue } from "./jobs/queue";
import { redis } from "./utils/redis";
import { BrowserManager } from "./browser/playright";
const app = express();
app.use(express.json());

// --- FIXED HEALTH CHECK ---
app.get("/health", async (req, res) => {
  // Explicit typing prevents the TS2322 error
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

app.post("/scrape", async (req, res) => {
  const { url, type, force } = req.body;
  if (!url) return res.status(400).json({ error: "URL required" });

  // 1. Check Cache
  if (!force) {
    const cached = await redis.get(`scrape:${url}`);
    if (cached) return res.json({ source: "cache", data: JSON.parse(cached) });
  }

  // 2. Queue Job
  try {
    const job = await addScrapeJob(url, type);
    res.status(202).json({ message: "Queued", jobId: job.id });
  } catch (e) {
    res.status(500).json({ error: "Failed to queue" });
  }
});

app.get("/job/:id", async (req, res) => {
  const job = await scrapeQueue.getJob(req.params.id);
  if (!job) return res.status(404).json({ error: "Not found" });
  res.json({
    state: await job.getState(),
    result: job.returnvalue,
    error: job.failedReason,
  });
});

const server = app.listen(config.port, async () => {
  await BrowserManager.init(); // Pre-launch browser
  logger.info(`🚀 Server running on port ${config.port}`);
});

process.on("SIGTERM", async () => {
  await BrowserManager.closeBrowser();
  await scrapeQueue.close();
  await redis.quit();
  process.exit(0);
});
process.on("SIGINT", async () => {
  await BrowserManager.closeBrowser();
  await scrapeQueue.close();
  await redis.quit();
  process.exit(0);
});