// batchScraper.ts
import {
  UniversalScraper,
  ScrapeOptions,
  ScrapeResult,
} from "./universalScraper";
import { logger } from "../utils/logger";

export interface BatchScrapeOptions {
  urls: string[];
  concurrency?: number; // Number of parallel scrapes
  delayMs?: number; // Delay between requests (ms)
  retries?: number; // Number of retry attempts
  proxies?: string[]; // Optional proxy list
  userAgents?: string[]; // Optional user-agent list
  waitForSelector?: string;
  maxContentLength?: number;
  maxLinks?: number;
  hydrationDelay?: number;
  mobile?: boolean;
}

export interface BatchScrapeResult {
  url: string;
  success: boolean;
  data?: ScrapeResult;
  error?: string;
  attempt?: number;
}

export class BatchScraper {
  private scraper: UniversalScraper;

  constructor() {
    this.scraper = new UniversalScraper();
  }

  private getRandom<T>(arr?: T[]): T | undefined {
    if (!arr || arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  public async run(options: BatchScrapeOptions): Promise<BatchScrapeResult[]> {
    const {
      urls,
      concurrency = 3,
      delayMs = 1000,
      retries = 1,
      proxies,
      userAgents,
      waitForSelector,
      maxContentLength,
      maxLinks,
      hydrationDelay,
      mobile,
    } = options;

    const results: BatchScrapeResult[] = [];
    const queue = [...urls];

    const worker = async () => {
      while (queue.length > 0) {
        const url = queue.shift()!;
        let attempt = 0;
        let success = false;
        let result: BatchScrapeResult = { url, success: false, attempt: 0 };

        while (attempt <= retries && !success) {
          attempt++;
          const proxy = this.getRandom(proxies);
          const userAgent = this.getRandom(userAgents);

          try {
            const scrapeOptions: ScrapeOptions = {
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
          } catch (err: any) {
            logger.warn(
              { url, attempt },
              `Scrape attempt failed: ${err.message}`
            );
            if (attempt > retries) {
              result = { url, success: false, error: err.message, attempt };
            } else {
              // Exponential backoff
              const backoff = delayMs * attempt;
              await new Promise((res) => setTimeout(res, backoff));
            }
          }
        }

        results.push(result);

        // Delay between requests
        if (delayMs > 0) await new Promise((res) => setTimeout(res, delayMs));
      }
    };

    // Start concurrent workers
    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);

    return results;
  }
}
