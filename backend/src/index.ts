// FILE: src/index.ts
// Main entry point for npm package consumers

export { UltraScraperClient } from "./client/UltraScraperClient";
export { WebhookSigner } from "./handlers/webhook/signer";

// Export types
export type {
    ScrapeOptions,
    ScrapeResult,
} from "./scrapers/universalScraper";

export type {
    WebhookJobData,
} from "./queues/webhook.queue";

// Export queue instances for advanced users
export { scrapeQueue } from "./jobs/queue";
export { webhookQueue } from "./queues/webhook.queue";

// Export utilities
export { logger } from "./utils/logger";
export { redis } from "./utils/redis";
