// FILE: src/scrapers/baseScraper.ts
import { BrowserContext, Page } from "playwright";
import { BrowserManager } from "../browser/playright";

export interface ScrapeResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    url: string;
    timestamp: string;
    proxyUsed?: string;
  };
}

export abstract class BaseScraper {
  protected page: Page | null = null;
  protected context: BrowserContext | null = null;

  /**
   * The main entry point. Manages the browser lifecycle.
   */
  async run(url: string): Promise<ScrapeResult> {
    try {
      // 1. Launch (or reuse) browser context
      const { context, page } = await BrowserManager.launchContext();
      this.context = context;
      this.page = page;

      // 2. Execute specific scraping logic
      const data = await this.scrape(url);

      // 3. Return success
      return {
        success: true,
        data,
        metadata: {
          url,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      // 4. Handle errors
      // Snapshot error for debugging? (Optional)
      // if (this.page) await this.page.screenshot({ path: `error-${Date.now()}.png` });

      return {
        success: false,
        error: error.message,
        metadata: {
          url,
          timestamp: new Date().toISOString(),
        },
      };
    } finally {
      // 5. Cleanup: ALWAYS close the context/page to free memory
      if (this.context) {
        await BrowserManager.closeContext(this.context);
      }
    }
  }

  /**
   * Abstract method: Must be implemented by child classes
   */
  protected abstract scrape(url: string): Promise<any>;
}
