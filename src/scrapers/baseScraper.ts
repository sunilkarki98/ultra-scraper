// FILE: src/scrapers/baseScraper.ts
import { BrowserContext, Page } from "playwright";
import { BrowserManager } from "../browser/playright";
import { ScrapeOptions } from "./universalScraper";

export interface ScrapeResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    url: string;
    timestamp: string;
    proxyUsed?: string;
  };
}

export abstract class BaseScraper<T = any> {
  protected page: Page | null = null;
  protected context: BrowserContext | null = null;

  // Main entry point: accepts ScrapeOptions
  async run(options: ScrapeOptions): Promise<ScrapeResult<T>> {
    const { url, proxy, userAgent, mobile } = options;
    try {
      const { context, page } = await BrowserManager.launchContext({
        proxy,
        userAgent,
        mobile,
      });
      this.context = context;
      this.page = page;

      const data = await this.scrape(options);

      return {
        success: true,
        data,
        metadata: {
          url,
          timestamp: new Date().toISOString(),
          proxyUsed: proxy,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        metadata: {
          url,
          timestamp: new Date().toISOString(),
          proxyUsed: proxy,
        },
      };
    } finally {
      if (this.context) await BrowserManager.closeContext(this.context);
    }
  }

  // Must be implemented by child scrapers
  protected abstract scrape(options: ScrapeOptions): Promise<T>;
}
