// FILE: src/client/UltraScraperClient.ts
import { ScrapeOptions, ScrapeResult } from "../scrapers/universalScraper";
import { scrapeQueue } from "../jobs/queue";
import { webhookQueue, WebhookJobData } from "../queues/webhook.queue";

export interface ClientConfig {
    redisUrl?: string;
    apiUrl?: string; // For HTTP client mode
}

/**
 * Ultra-Scraper Client for programmatic usage
 * 
 * Can be used in two modes:
 * 1. **Direct Mode**: Enqueue jobs directly to BullMQ
 * 2. **HTTP Mode**: Make HTTP requests to running API server
 */
export class UltraScraperClient {
    private config: ClientConfig;

    constructor(config: ClientConfig = {}) {
        this.config = config;
    }

    /**
     * Scrape a URL (Direct Queue Mode)
     * Requires Redis connection
     */
    async scrape(url: string, options?: Partial<ScrapeOptions>): Promise<string> {
        const job = await scrapeQueue.add("scrape", {
            url,
            options: options || {},
        });

        return job.id!;
    }

    /**
     * Scrape a URL via HTTP (API Mode)
     * Requires running API server
     */
    async scrapeViaHTTP(
        url: string,
        options?: Partial<ScrapeOptions>
    ): Promise<{ jobId: string; statusUrl: string }> {
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
    async getJobStatus(jobId: string): Promise<any> {
        if (!this.config.apiUrl) {
            throw new Error("apiUrl must be configured for HTTP mode");
        }

        const response = await fetch(`${this.config.apiUrl}/job/${jobId}`);
        return response.json();
    }

    /**
     * Wait for job completion (HTTP mode)
     */
    async waitForCompletion(
        jobId: string,
        pollInterval: number = 2000
    ): Promise<ScrapeResult> {
        while (true) {
            const status = await this.getJobStatus(jobId);

            if (status.state === "completed") {
                return status.result;
            } else if (status.state === "failed") {
                throw new Error(`Job failed: ${status.error}`);
            }

            await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }
    }

    /**
     * Dispatch webhook (Direct Mode)
     */
    async sendWebhook(data: WebhookJobData): Promise<string> {
        const job = await webhookQueue.add("deliver", data);
        return job.id!;
    }
}
