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
    // dbJobId might be at top level or inside options depending on how it was queued
    const dbJobId = job.data.dbJobId || options.dbJobId;
    const logMeta = { jobId: job.id, dbJobId, url };
    const prisma = (await Promise.resolve().then(() => __importStar(require("../utils/prisma")))).default;
    logger_1.logger.info(logMeta, "⚡ Sandboxed Worker Started");
    // 🔄 SYNC: Update Status to Processing
    if (dbJobId) {
        await prisma.job.update({
            where: { id: dbJobId },
            data: { status: "processing" },
        }).catch(e => logger_1.logger.error(`Failed to update job status: ${e.message}`));
    }
    let result = { success: false, error: "Not started" };
    try {
        // 0️⃣ ROBOTS.TXT CHECK
        if (!options.ignoreRobotsTxt) {
            const { isUrlAllowed } = await Promise.resolve().then(() => __importStar(require("../utils/robotsParser")));
            const allowed = await isUrlAllowed(url);
            if (!allowed) {
                logger_1.logger.warn(logMeta, "⛔ Blocked by robots.txt");
                if (dbJobId) {
                    await prisma.job.update({
                        where: { id: dbJobId },
                        data: { status: "failed", error: "Blocked by robots.txt" },
                    });
                }
                throw new Error("BLOCKED_BY_ROBOTS_TXT");
            }
        }
        // 1️⃣ CACHE CHECK (Double check inside worker for robustness)
        const cacheKey = `scrape:${url}`;
        try {
            const cached = await redis_1.redis.get(cacheKey);
            if (cached) {
                logger_1.logger.info(logMeta, "🔹 Returning Cached Result (Worker hit)");
                const data = JSON.parse(cached);
                if (dbJobId) {
                    await prisma.job.update({
                        where: { id: dbJobId },
                        data: { status: "completed", result: data },
                    });
                }
                return data;
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
        // ============================================================
        // 🐦 SOCIAL MEDIA ROUTING
        // ============================================================
        if (url.includes("twitter.com") || url.includes("x.com") || url.includes("linkedin.com") || url.includes("reddit.com") || url.includes("quora.com") || url.includes("facebook.com") || url.includes("instagram.com") || url.includes("tiktok.com") || url.includes("t.me") || url.includes("telegram.me")) {
            try {
                logger_1.logger.info(logMeta, "🐦 Routing to Social Media Microservice...");
                const { SocialMediaClient } = await Promise.resolve().then(() => __importStar(require("../utils/socialMediaClient")));
                const socialClient = new SocialMediaClient();
                let socialResult;
                if (url.includes("twitter.com") || url.includes("x.com")) {
                    socialResult = await socialClient.scrapeTwitter(url, scrapeOptions);
                }
                else if (url.includes("linkedin.com")) {
                    socialResult = await socialClient.scrapeLinkedIn(url, scrapeOptions);
                }
                else if (url.includes("reddit.com")) {
                    socialResult = await socialClient.scrapeReddit(url, scrapeOptions);
                }
                else if (url.includes("quora.com")) {
                    socialResult = await socialClient.scrapeQuora(url, scrapeOptions);
                }
                else if (url.includes("facebook.com")) {
                    socialResult = await socialClient.scrapeFacebook(url, scrapeOptions);
                }
                else if (url.includes("instagram.com")) {
                    socialResult = await socialClient.scrapeInstagram(url, scrapeOptions);
                }
                else if (url.includes("tiktok.com")) {
                    socialResult = await socialClient.scrapeTikTok(url, scrapeOptions);
                }
                else if (url.includes("t.me") || url.includes("telegram.me")) {
                    socialResult = await socialClient.scrapeTelegram(url, scrapeOptions);
                }
                if (socialResult && socialResult.success) {
                    // Map to standard result format
                    result = {
                        success: true,
                        data: {
                            title: socialResult.data.title,
                            content: socialResult.data.content,
                            links: [],
                            leads: { emails: [], phones: [], socialLinks: [] },
                            jsonLd: [],
                            metadata: socialResult.data.meta
                        }
                    };
                    // Skip other tiers
                    return result.data;
                }
                else {
                    logger_1.logger.warn(logMeta, `Social scraper failed: ${socialResult?.error}, falling back to standard scrapers`);
                }
            }
            catch (e) {
                logger_1.logger.error(logMeta, `Social routing error: ${e.message}`);
            }
        }
        // ============================================================
        // 🧠 INTELLIGENT ROUTING
        // ============================================================
        let recommendedEngine = 'universal';
        try {
            const { WebsiteAnalyzerService } = await Promise.resolve().then(() => __importStar(require("../modules/scraper/website-analyzer.service")));
            const analyzer = new WebsiteAnalyzerService();
            const analysis = await analyzer.analyze(url);
            recommendedEngine = analysis.recommendedEngine;
            logger_1.logger.info(logMeta, `🧠 Analysis: ${analysis.reasons.join(', ')} -> Recommended: ${recommendedEngine}`);
        }
        catch (e) {
            logger_1.logger.warn(logMeta, "Failed to analyze URL, defaulting to Universal Scraper");
        }
        // Force engine if specified in options
        if (options.forceEngine) {
            recommendedEngine = options.forceEngine;
            logger_1.logger.info(logMeta, `🔧 Forced Engine: ${recommendedEngine}`);
        }
        // ============================================================
        // 🕷️ TIER 0: Scrapy (Fast & Cheap)
        // ============================================================
        if (recommendedEngine === 'scrapy') {
            try {
                logger_1.logger.info(logMeta, "Attempting Tier 0 (Scrapy)...");
                const { ScrapyHelper } = await Promise.resolve().then(() => __importStar(require("../utils/scrapyHelper")));
                const scrapy = new ScrapyHelper();
                if (await scrapy.healthCheck()) {
                    const scrapyResult = await scrapy.scrape(url, scrapeOptions);
                    if (scrapyResult.success && scrapyResult.data) {
                        result = { success: true, data: scrapyResult.data };
                        // Skip other tiers
                        recommendedEngine = 'done';
                    }
                    else {
                        logger_1.logger.warn(logMeta, `Tier 0 failed: ${scrapyResult.error}, falling back to Universal`);
                    }
                }
                else {
                    logger_1.logger.warn(logMeta, "Scrapy service unavailable, skipping Tier 0");
                }
            }
            catch (e) {
                logger_1.logger.warn(logMeta, `Tier 0 error: ${e.message}`);
            }
        }
        if (recommendedEngine === 'done') {
            // Already successful
        }
        // ============================================================
        // 🟢 TIER 1: Universal Scraper (Playwright) OR AI Scraper
        // ============================================================
        else if (recommendedEngine === 'playwright' || recommendedEngine === 'universal' || recommendedEngine === 'scrapy') {
            // Note: We fall back to here if Scrapy failed
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
        }
        // ============================================================
        // 🔴 TIER 2: Heavy Scraper (Puppeteer + Stealth)
        // ============================================================
        else if (recommendedEngine === 'heavy') {
            logger_1.logger.info(logMeta, "🛡️ Skipping Tier 1, going directly to Tier 2 (Heavy Scraper)");
            // Logic handled in next block (it checks if !result.success)
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
            // 🔄 SYNC: Update Status to Completed
            if (dbJobId) {
                await prisma.job.update({
                    where: { id: dbJobId },
                    data: { status: "completed", result: result.data },
                }).catch(e => logger_1.logger.error(`Failed to save job result: ${e.message}`));
            }
            // 🪝 WEBHOOK TRIGGER
            if (scrapeOptions.webhook) {
                const { WebhookHandler } = await Promise.resolve().then(() => __importStar(require("../utils/webhookHandler")));
                await WebhookHandler.send(scrapeOptions.webhook, {
                    jobId: dbJobId || job.id,
                    url: url,
                    status: "completed",
                    data: result.data
                }, scrapeOptions.webhookSecret);
            }
            // 🔄 RECURSIVE CRAWLING LOGIC
            if (scrapeOptions.recursive && result.data.links && result.data.links.length > 0) {
                const currentDepth = scrapeOptions.maxDepth || 1;
                const currentPages = scrapeOptions.maxPages || 10;
                if (currentDepth > 0) {
                    logger_1.logger.info(logMeta, `🕸️ Found ${result.data.links.length} links. Queuing children (Depth: ${currentDepth - 1})`);
                    const { scrapeQueue } = await Promise.resolve().then(() => __importStar(require("./queue")));
                    const linksToQueue = result.data.links.slice(0, 5);
                    for (const link of linksToQueue) {
                        await scrapeQueue.add("scrape-child", {
                            url: link.href,
                            options: {
                                ...options,
                                maxDepth: currentDepth - 1,
                                maxPages: currentPages - 1
                            }
                        });
                    }
                }
            }
            logger_1.logger.info(logMeta, "✅ Job Completed Successfully");
            return result.data;
        }
        // If we are here, both tiers failed
        logger_1.logger.error(logMeta, `❌ All tiers failed. Final error: ${result.error}`);
        // 🔄 SYNC: Update Status to Failed
        if (dbJobId) {
            await prisma.job.update({
                where: { id: dbJobId },
                data: { status: "failed", error: result.error },
            }).catch(e => logger_1.logger.error(`Failed to update job failure: ${e.message}`));
        }
        throw new Error(result.error || "Unknown extraction error");
    }
    catch (error) {
        // Catch-all for unexpected errors
        logger_1.logger.error(logMeta, `🔥 Unexpected worker error: ${error.message}`);
        if (dbJobId) {
            await prisma.job.update({
                where: { id: dbJobId },
                data: { status: "failed", error: error.message },
            }).catch(e => logger_1.logger.error(`Failed to update job failure: ${e.message}`));
        }
        throw error;
    }
    finally {
        // 🧹 Force Garbage Collection if exposed
        if (global.gc) {
            global.gc();
        }
    }
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
