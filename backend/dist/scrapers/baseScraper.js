"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseScraper = void 0;
const BrowserManager_1 = require("../browser/BrowserManager");
const logger_1 = require("../utils/logger");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class BaseScraper {
    proxyService;
    page = null;
    context = null;
    constructor(proxyService) {
        this.proxyService = proxyService;
    }
    // Configuration for retries
    MAX_RETRIES = 2;
    TIMEOUT_MS = 30000;
    /**
     * Main Orchestrator: Handles Lifecycle, Error Recovery, and Metrics
     */
    async run(options) {
        let { url, proxy, userAgent, mobile } = options;
        const startTime = Date.now();
        let attempt = 0;
        let lastError = null;
        let currentProxy = proxy;
        // Get a proxy from rotator if none provided
        if (!currentProxy && this.proxyService) {
            currentProxy = this.proxyService.getNext();
        }
        // 🔄 RETRY LOOP
        while (attempt <= this.MAX_RETRIES) {
            try {
                // 1. Initialize Resources
                if (attempt > 0) {
                    logger_1.logger.warn(`Retry attempt ${attempt} for ${url}`);
                    await this.randomDelay(2000 * attempt); // Exponential backoff
                }
                const { context, page } = await BrowserManager_1.BrowserManager.launchContext({
                    proxy: currentProxy,
                    userAgent,
                    mobile,
                });
                this.context = context;
                this.page = page;
                // 2. Navigate with Robustness
                logger_1.logger.info(`Navigating to ${url} (Attempt ${attempt})`);
                await this.page.goto(url, {
                    waitUntil: "domcontentloaded",
                    timeout: this.TIMEOUT_MS,
                });
                // 3. Validation Hook (Did we get blocked?)
                const isBlocked = await this.checkForBan(this.page);
                if (isBlocked) {
                    throw new Error("ANTI_BOT_DETECTED");
                }
                // 4. Execute Specific Scraper Logic
                const data = await this.scrape(options);
                // 5. Success!
                if (currentProxy && this.proxyService) {
                    this.proxyService.reportSuccess(currentProxy);
                }
                return {
                    success: true,
                    data,
                    metadata: {
                        url,
                        timestamp: new Date().toISOString(),
                        executionTimeMs: Date.now() - startTime,
                        proxyUsed: currentProxy,
                        retriesAttempted: attempt,
                    },
                };
            }
            catch (err) {
                lastError = err;
                logger_1.logger.error(`Scrape failed on attempt ${attempt}: ${err.message}`);
                if (currentProxy && this.proxyService) {
                    this.proxyService.reportFailure(currentProxy);
                    // Rotate proxy for next attempt
                    currentProxy = this.proxyService.getNext();
                    logger_1.logger.info(`Rotated proxy to: ${currentProxy}`);
                }
                // 📸 FORENSICS: Take snapshot on failure
                if (this.page) {
                    await this.saveDebugSnapshot(url, attempt);
                }
                // Cleanup before retry
                if (this.context) {
                    await BrowserManager_1.BrowserManager.closeContext(this.context);
                    this.context = null;
                    this.page = null;
                }
                attempt++;
            }
        }
        // ❌ FAILURE (Retries exhausted)
        return {
            success: false,
            error: lastError?.message || "Unknown error after retries",
            metadata: {
                url,
                timestamp: new Date().toISOString(),
                executionTimeMs: Date.now() - startTime,
                proxyUsed: currentProxy,
                retriesAttempted: attempt,
            },
        };
    }
    // ------------------------------------------
    // Helper Methods
    // ------------------------------------------
    /**
     * Saves Screenshot and HTML to 'debug/' folder for analysis
     */
    async saveDebugSnapshot(url, attempt) {
        try {
            const safeUrl = url.replace(/[^a-z0-9]/gi, "_").substring(0, 50);
            const timestamp = Date.now();
            const debugDir = path_1.default.resolve(process.cwd(), "debug");
            if (!fs_1.default.existsSync(debugDir))
                fs_1.default.mkdirSync(debugDir);
            if (this.page) {
                await this.page.screenshot({
                    path: path_1.default.join(debugDir, `${timestamp}_${safeUrl}_att${attempt}.png`),
                    fullPage: false, // Save time, just viewport usually enough
                });
                const html = await this.page.content();
                fs_1.default.writeFileSync(path_1.default.join(debugDir, `${timestamp}_${safeUrl}_att${attempt}.html`), html);
            }
        }
        catch (e) {
            logger_1.logger.error("Failed to save debug snapshot");
        }
    }
    /**
     * Basic check for common Block pages (Cloudflare, 403, etc)
     * Children can override this for site-specific checks
     */
    async checkForBan(page) {
        const content = await page.content();
        const title = await page.title();
        if (title.includes("Just a moment...") || // Cloudflare
            title.includes("Access Denied") ||
            title.includes("Attention Required!") ||
            content.includes("Please verify you are a human")) {
            logger_1.logger.warn("🚨 Anti-Bot Screen Detected!");
            return true;
        }
        return false;
    }
    /**
     * Utility for human-like pauses
     */
    async randomDelay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.BaseScraper = BaseScraper;
