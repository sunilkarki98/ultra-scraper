// FILE: src/jobs/workerProcessor.ts
import { Job } from "bullmq";
import { logger } from "../utils/logger";
import { redis } from "../utils/redis";
import { UniversalScraper, ScrapeOptions } from "../scrapers/universalScraper";
import { HeavyScraper } from "../scrapers/heavyScraper";

// Helper Interface for internal logic
interface WorkerResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * 🧠 The Brain of the Operation
 * This function runs in a separate process (Sandboxed).
 * It handles the logic: Cache -> Playwright -> Puppeteer -> Save.
 */
export default async function (job: Job) {
  const { url, options = {} } = job.data;
  const logMeta = { jobId: job.id, url };

  logger.info(logMeta, "⚡ Sandboxed Worker Started");

  // 0️⃣ ROBOTS.TXT CHECK
  if (!options.ignoreRobotsTxt) {
    const { isUrlAllowed } = await import("../utils/robotsParser");
    const allowed = await isUrlAllowed(url);
    if (!allowed) {
      logger.warn(logMeta, "⛔ Blocked by robots.txt");
      throw new Error("BLOCKED_BY_ROBOTS_TXT");
    }
  }

  // 1️⃣ CACHE CHECK (Double check inside worker for robustness)
  const cacheKey = `scrape:${url}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.info(logMeta, "🔹 Returning Cached Result (Worker hit)");
      return JSON.parse(cached);
    }
  } catch (e) {
    logger.warn("Redis cache check failed, proceeding without cache");
  }

  // Prepare Options
  const scrapeOptions: ScrapeOptions = {
    url,
    ...options,
    hydrationDelay: options.hydrationDelay ?? 2000,
    maxContentLength: options.maxContentLength ?? 20000,
  };

  let result: WorkerResult = { success: false, error: "Not started" };

  // ============================================================
  // 🟢 TIER 1: Universal Scraper (Playwright) OR AI Scraper
  // ============================================================
  try {
    if (scrapeOptions.useAI) {
      // AI-Powered Extraction
      logger.info(logMeta, "🤖 Using AI Extraction...");
      const { AIScraper } = await import("../scrapers/aiScraper");
      const aiScraper = new AIScraper();
      result = await aiScraper.run(scrapeOptions);
    } else {
      // Traditional CSS Selector Extraction
      logger.info(logMeta, "Attempting Tier 1 (Playwright)...");
      const scraper = new UniversalScraper();
      result = await scraper.run(scrapeOptions);

      // Check if the result looks suspicious (e.g., "Access Denied" title)
      if (!result.success && isAntiBotError(result.error)) {
        throw new Error("ANTI_BOT_DETECTED");
      }
    }
  } catch (error: any) {
    logger.warn(logMeta, `Tier 1 failed: ${error.message}`);
    result = { success: false, error: error.message };
  }

  // Check if data looks empty (Soft Block)
  const isDataEmpty =
    result.success &&
    result.data &&
    (!result.data.title || result.data.title === "") &&
    (!result.data.content || result.data.content.length < 50);

  // ============================================================
  // 🔴 TIER 2: Heavy Scraper (Puppeteer + Stealth)
  // Slow, CPU Heavy, but bypasses Cloudflare/Akamai
  // ============================================================
  if (!result.success || isDataEmpty) {
    logger.warn(
      logMeta,
      "⚠️ Tier 1 Failed/Blocked. Escalating to Tier 2 (Puppeteer)..."
    );

    try {
      const heavyScraper = new HeavyScraper();
      result = await heavyScraper.run(scrapeOptions);
    } catch (err: any) {
      result = { success: false, error: `Tier 2 Failed: ${err.message}` };
    }
  }

  // ============================================================
  // 🏁 FINALIZATION
  // ============================================================
  if (result.success && result.data) {
    // Cache result for 1 hour
    await redis.set(cacheKey, JSON.stringify(result.data), "EX", 3600);

    // 🪝 WEBHOOK TRIGGER
    if (scrapeOptions.webhook) {
      // We use dynamic import or just standard import if at top level. 
      // Since we are inside a function and want to keep it clean:
      const { WebhookHandler } = await import("../utils/webhookHandler");
      // Fire and forget (don't await to block return, OR await if we want to ensure delivery before marking job done)
      // Usually better to await so we know it tried.
      await WebhookHandler.send(
        scrapeOptions.webhook,
        {
          jobId: job.id,
          url: url,
          status: "completed",
          data: result.data
        },
        scrapeOptions.webhookSecret // Pass the secret for HMAC signing
      );
    }

    // 🔄 RECURSIVE CRAWLING LOGIC
    if (scrapeOptions.recursive && result.data.links && result.data.links.length > 0) {
      const currentDepth = scrapeOptions.maxDepth || 1;
      const currentPages = scrapeOptions.maxPages || 10;

      // If we haven't hit depth limit
      if (currentDepth > 0) {
        logger.info(logMeta, `🕸️ Found ${result.data.links.length} links. Queuing children (Depth: ${currentDepth - 1})`);

        // We need to import the queue to add jobs. 
        // Since this is a sandboxed worker, we might need a separate connection or use the parent flow.
        // However, usually workers can enqueue new jobs.
        const { scrapeQueue } = await import("./queue");

        const linksToQueue = result.data.links.slice(0, 5); // Limit fan-out to 5 per page to be safe

        for (const link of linksToQueue) {
          await scrapeQueue.add("scrape-child", {
            url: link.href,
            options: {
              ...options,
              maxDepth: currentDepth - 1,
              maxPages: currentPages - 1 // This is a naive counter, ideally we use a shared counter
            }
          });
        }
      }
    }

    logger.info(logMeta, "✅ Job Completed Successfully");

    // 🧹 Optional: Force Garbage Collection if exposed
    if (global.gc) {
      global.gc();
    }

    return result.data;
  }

  // If we are here, both tiers failed
  logger.error(logMeta, `❌ All tiers failed. Final error: ${result.error}`);
  throw new Error(result.error || "Unknown extraction error");
}

/**
 * Helper: Detect keywords that suggest IP Ban / Bot Detection
 */
function isAntiBotError(errorMsg?: string): boolean {
  if (!errorMsg) return false;
  const msg = errorMsg.toLowerCase();
  return (
    msg.includes("timeout") ||
    msg.includes("anti_bot") ||
    msg.includes("403") ||
    msg.includes("429") ||
    msg.includes("captcha") ||
    msg.includes("security check") ||
    msg.includes("denied")
  );
}
