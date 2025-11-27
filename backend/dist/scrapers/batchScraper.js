"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchScraper = void 0;
// batchScraper.ts
const universalScraper_1 = require("./universalScraper");
const logger_1 = require("../utils/logger");
class BatchScraper {
    scraper;
    constructor() {
        this.scraper = new universalScraper_1.UniversalScraper();
    }
    getRandom(arr) {
        if (!arr || arr.length === 0)
            return undefined;
        return arr[Math.floor(Math.random() * arr.length)];
    }
    async run(options) {
        const { urls, concurrency = 3, delayMs = 1000, retries = 1, proxies, userAgents, waitForSelector, maxContentLength, maxLinks, hydrationDelay, mobile, } = options;
        const results = [];
        const queue = [...urls];
        const worker = async () => {
            while (queue.length > 0) {
                const url = queue.shift();
                let attempt = 0;
                let success = false;
                let result = { url, success: false, attempt: 0 };
                while (attempt <= retries && !success) {
                    attempt++;
                    const proxy = this.getRandom(proxies);
                    const userAgent = this.getRandom(userAgents);
                    try {
                        const scrapeOptions = {
                            url,
                            waitForSelector,
                            maxContentLength,
                            maxLinks,
                            hydrationDelay,
                            proxy,
                            userAgent,
                            mobile,
                        };
                        const data = await this.scraper.run(scrapeOptions);
                        result = {
                            url,
                            success: data.success,
                            data: data.data,
                            error: data.error,
                            attempt,
                        };
                        success = data.success;
                    }
                    catch (err) {
                        logger_1.logger.warn({ url, attempt }, `Scrape attempt failed: ${err.message}`);
                        if (attempt > retries) {
                            result = { url, success: false, error: err.message, attempt };
                        }
                        else {
                            // Exponential backoff
                            const backoff = delayMs * attempt;
                            await new Promise((res) => setTimeout(res, backoff));
                        }
                    }
                }
                results.push(result);
                // Delay between requests
                if (delayMs > 0)
                    await new Promise((res) => setTimeout(res, delayMs));
            }
        };
        // Start concurrent workers
        const workers = Array.from({ length: concurrency }, () => worker());
        await Promise.all(workers);
        return results;
    }
}
exports.BatchScraper = BatchScraper;
