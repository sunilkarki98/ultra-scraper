"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UltraScraperClient = void 0;
const queue_1 = require("../jobs/queue");
const webhook_queue_1 = require("../queues/webhook.queue");
/**
 * Ultra-Scraper Client for programmatic usage
 *
 * Can be used in two modes:
 * 1. **Direct Mode**: Enqueue jobs directly to BullMQ
 * 2. **HTTP Mode**: Make HTTP requests to running API server
 */
class UltraScraperClient {
    config;
    constructor(config = {}) {
        this.config = config;
    }
    /**
     * Scrape a URL (Direct Queue Mode)
     * Requires Redis connection
     */
    async scrape(url, options) {
        const job = await queue_1.scrapeQueue.add("scrape", {
            url,
            options: options || {},
        });
        return job.id;
    }
    /**
     * Scrape a URL via HTTP (API Mode)
     * Requires running API server
     */
    async scrapeViaHTTP(url, options) {
        if (!this.config.apiUrl) {
            throw new Error("apiUrl must be configured for HTTP mode");
        }
        const response = await fetch(`${this.config.apiUrl}/scrape`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url, options }),
        });
        return response.json();
    }
    /**
     * Get job status via HTTP
     */
    async getJobStatus(jobId) {
        if (!this.config.apiUrl) {
            throw new Error("apiUrl must be configured for HTTP mode");
        }
        const response = await fetch(`${this.config.apiUrl}/job/${jobId}`);
        return response.json();
    }
    /**
     * Wait for job completion (HTTP mode)
     */
    async waitForCompletion(jobId, pollInterval = 2000) {
        while (true) {
            const status = await this.getJobStatus(jobId);
            if (status.state === "completed") {
                return status.result;
            }
            else if (status.state === "failed") {
                throw new Error(`Job failed: ${status.error}`);
            }
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }
    }
    /**
     * Dispatch webhook (Direct Mode)
     */
    async sendWebhook(data) {
        const job = await webhook_queue_1.webhookQueue.add("deliver", data);
        return job.id;
    }
}
exports.UltraScraperClient = UltraScraperClient;
