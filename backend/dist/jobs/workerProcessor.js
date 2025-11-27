"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const logger_1 = require("../utils/logger");
const redis_1 = require("../utils/redis");
const universalScraper_1 = require("../scrapers/universalScraper");
const heavyScraper_1 = require("../scrapers/heavyScraper");
/**
 * 🧠 The Brain of the Operation
 * This function runs in a separate process (Sandboxed).
 * It handles the logic: Cache -> Playwright -> Puppeteer -> Save.
 */
async function default_1(job) {
    const { url, options = {} } = job.data;
    const logMeta = { jobId: job.id, url };
    logger_1.logger.info(logMeta, "⚡ Sandboxed Worker Started");
    // 0️⃣ ROBOTS.TXT CHECK
    if (!options.ignoreRobotsTxt) {
        const { isUrlAllowed } = await Promise.resolve().then(() => __importStar(require("../utils/robotsParser")));
        const allowed = await isUrlAllowed(url);
        if (!allowed) {
            logger_1.logger.warn(logMeta, "⛔ Blocked by robots.txt");
            throw new Error("BLOCKED_BY_ROBOTS_TXT");
        }
    }
    // 1️⃣ CACHE CHECK (Double check inside worker for robustness)
    const cacheKey = `scrape:${url}`;
    try {
        const cached = await redis_1.redis.get(cacheKey);
        if (cached) {
            logger_1.logger.info(logMeta, "🔹 Returning Cached Result (Worker hit)");
            return JSON.parse(cached);
        }
    }
    catch (e) {
        logger_1.logger.warn("Redis cache check failed, proceeding without cache");
    }
    // Prepare Options
    const scrapeOptions = {
        url,
        ...options,
        hydrationDelay: options.hydrationDelay ?? 2000,
        maxContentLength: options.maxContentLength ?? 20000,
    };
    let result = { success: false, error: "Not started" };
    // ============================================================
    // 🟢 TIER 1: Universal Scraper (Playwright) OR AI Scraper
    // ============================================================
    try {
        if (scrapeOptions.useAI) {
            // AI-Powered Extraction
            logger_1.logger.info(logMeta, "🤖 Using AI Extraction...");
            const { AIScraper } = await Promise.resolve().then(() => __importStar(require("../scrapers/aiScraper")));
            const aiScraper = new AIScraper();
            result = await aiScraper.run(scrapeOptions);
        }
        else {
            // Traditional CSS Selector Extraction
            logger_1.logger.info(logMeta, "Attempting Tier 1 (Playwright)...");
            const scraper = new universalScraper_1.UniversalScraper();
            result = await scraper.run(scrapeOptions);
            // Check if the result looks suspicious (e.g., "Access Denied" title)
            if (!result.success && isAntiBotError(result.error)) {
                throw new Error("ANTI_BOT_DETECTED");
            }
        }
    }
    catch (error) {
        logger_1.logger.warn(logMeta, `Tier 1 failed: ${error.message}`);
        result = { success: false, error: error.message };
    }
    // Check if data looks empty (Soft Block)
    const isDataEmpty = result.success &&
        result.data &&
        (!result.data.title || result.data.title === "") &&
        (!result.data.content || result.data.content.length < 50);
    // ============================================================
    // 🔴 TIER 2: Heavy Scraper (Puppeteer + Stealth)
    // Slow, CPU Heavy, but bypasses Cloudflare/Akamai
    // ============================================================
    if (!result.success || isDataEmpty) {
        logger_1.logger.warn(logMeta, "⚠️ Tier 1 Failed/Blocked. Escalating to Tier 2 (Puppeteer)...");
        try {
            const heavyScraper = new heavyScraper_1.HeavyScraper();
            result = await heavyScraper.run(scrapeOptions);
        }
        catch (err) {
            result = { success: false, error: `Tier 2 Failed: ${err.message}` };
        }
    }
    // ============================================================
    // 🏁 FINALIZATION
    // ============================================================
    if (result.success && result.data) {
        // Cache result for 1 hour
        await redis_1.redis.set(cacheKey, JSON.stringify(result.data), "EX", 3600);
        // 🪝 WEBHOOK TRIGGER
        if (scrapeOptions.webhook) {
            // We use dynamic import or just standard import if at top level. 
            // Since we are inside a function and want to keep it clean:
            const { WebhookHandler } = await Promise.resolve().then(() => __importStar(require("../utils/webhookHandler")));
            // Fire and forget (don't await to block return, OR await if we want to ensure delivery before marking job done)
            // Usually better to await so we know it tried.
            await WebhookHandler.send(scrapeOptions.webhook, {
                jobId: job.id,
                url: url,
                status: "completed",
                data: result.data
            }, scrapeOptions.webhookSecret // Pass the secret for HMAC signing
            );
        }
        // 🔄 RECURSIVE CRAWLING LOGIC
        if (scrapeOptions.recursive && result.data.links && result.data.links.length > 0) {
            const currentDepth = scrapeOptions.maxDepth || 1;
            const currentPages = scrapeOptions.maxPages || 10;
            // If we haven't hit depth limit
            if (currentDepth > 0) {
                logger_1.logger.info(logMeta, `🕸️ Found ${result.data.links.length} links. Queuing children (Depth: ${currentDepth - 1})`);
                // We need to import the queue to add jobs. 
                // Since this is a sandboxed worker, we might need a separate connection or use the parent flow.
                // However, usually workers can enqueue new jobs.
                const { scrapeQueue } = await Promise.resolve().then(() => __importStar(require("./queue")));
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
        logger_1.logger.info(logMeta, "✅ Job Completed Successfully");
        // 🧹 Optional: Force Garbage Collection if exposed
        if (global.gc) {
            global.gc();
        }
        return result.data;
    }
    // If we are here, both tiers failed
    logger_1.logger.error(logMeta, `❌ All tiers failed. Final error: ${result.error}`);
    throw new Error(result.error || "Unknown extraction error");
}
/**
 * Helper: Detect keywords that suggest IP Ban / Bot Detection
 */
function isAntiBotError(errorMsg) {
    if (!errorMsg)
        return false;
    const msg = errorMsg.toLowerCase();
    return (msg.includes("timeout") ||
        msg.includes("anti_bot") ||
        msg.includes("403") ||
        msg.includes("429") ||
        msg.includes("captcha") ||
        msg.includes("security check") ||
        msg.includes("denied"));
}
