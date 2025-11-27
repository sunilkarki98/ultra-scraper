// FILE: src/scrapers/baseScraper.ts
import { BrowserContext, Page } from "playwright";
import { BrowserManager } from "../browser/BrowserManager";
import { ScrapeOptions } from "./universalScraper"; // Ensure this matches your types
import { logger } from "../utils/logger";
import fs from "fs";
import path from "path";

// Standardized Result Interface
export interface ScrapeResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata: {
    url: string;
    timestamp: string;
    executionTimeMs: number;
    proxyUsed?: string;
    retriesAttempted: number;
  };
}

export abstract class BaseScraper<T = any> {
  protected page: Page | null = null;
  protected context: BrowserContext | null = null;

  // Configuration for retries
  protected MAX_RETRIES = 2;
  protected TIMEOUT_MS = 30000;

  /**
   * Main Orchestrator: Handles Lifecycle, Error Recovery, and Metrics
   */
  async run(options: ScrapeOptions): Promise<ScrapeResult<T>> {
    const { url, proxy, userAgent, mobile } = options;
    const startTime = Date.now();
    let attempt = 0;
    let lastError: Error | null = null;

    // 🔄 RETRY LOOP
    while (attempt <= this.MAX_RETRIES) {
      try {
        // 1. Initialize Resources
        if (attempt > 0) {
          logger.warn(`Retry attempt ${attempt} for ${url}`);
          await this.randomDelay(2000 * attempt); // Exponential backoff
        }

        const { context, page } = await BrowserManager.launchContext({
          proxy,
          userAgent,
          mobile,
        });
        this.context = context;
        this.page = page;

        // 2. Navigate with Robustness
        logger.info(`Navigating to ${url} (Attempt ${attempt})`);
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
        return {
          success: true,
          data,
          metadata: {
            url,
            timestamp: new Date().toISOString(),
            executionTimeMs: Date.now() - startTime,
            proxyUsed: proxy,
            retriesAttempted: attempt,
          },
        };
      } catch (err: any) {
        lastError = err;
        logger.error(`Scrape failed on attempt ${attempt}: ${err.message}`);

        // 📸 FORENSICS: Take snapshot on failure
        if (this.page) {
          await this.saveDebugSnapshot(url, attempt);
        }

        // Cleanup before retry
        if (this.context) {
          await BrowserManager.closeContext(this.context);
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
        proxyUsed: proxy,
        retriesAttempted: attempt,
      },
    };
  }

  // ------------------------------------------
  // Abstract Methods (Child must implement)
  // ------------------------------------------
  protected abstract scrape(options: ScrapeOptions): Promise<T>;

  // ------------------------------------------
  // Helper Methods
  // ------------------------------------------

  /**
   * Saves Screenshot and HTML to 'debug/' folder for analysis
   */
  private async saveDebugSnapshot(url: string, attempt: number) {
    try {
      const safeUrl = url.replace(/[^a-z0-9]/gi, "_").substring(0, 50);
      const timestamp = Date.now();
      const debugDir = path.resolve(process.cwd(), "debug");

      if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir);

      if (this.page) {
        await this.page.screenshot({
          path: path.join(
            debugDir,
            `${timestamp}_${safeUrl}_att${attempt}.png`
          ),
          fullPage: false, // Save time, just viewport usually enough
        });
        const html = await this.page.content();
        fs.writeFileSync(
          path.join(debugDir, `${timestamp}_${safeUrl}_att${attempt}.html`),
          html
        );
      }
    } catch (e) {
      logger.error("Failed to save debug snapshot");
    }
  }

  /**
   * Basic check for common Block pages (Cloudflare, 403, etc)
   * Children can override this for site-specific checks
   */
  protected async checkForBan(page: Page): Promise<boolean> {
    const content = await page.content();
    const title = await page.title();

    if (
      title.includes("Just a moment...") || // Cloudflare
      title.includes("Access Denied") ||
      title.includes("Attention Required!") ||
      content.includes("Please verify you are a human")
    ) {
      logger.warn("🚨 Anti-Bot Screen Detected!");
      return true;
    }
    return false;
  }

  /**
   * Utility for human-like pauses
   */
  protected async randomDelay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}