// FILE: src/browser/playwright.ts
import { Browser, BrowserContext, Page } from "playwright";
import { stealthChromium } from "./stealth";
import config from "../config";
import { logger } from "../utils/logger";
import { getNextProxy } from "../utils/proxy"; // <--- 1. Import this

let globalBrowser: Browser | null = null;

export class BrowserManager {
  static async init() {
    /* ... (Keep existing init code) ... */
    if (globalBrowser) return;
    globalBrowser = await stealthChromium.launch({
      headless: config.scraping.headless,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--mute-audio",
      ],
    });
  }

  static async launchContext(): Promise<{
    context: BrowserContext;
    page: Page;
  }> {
    if (!globalBrowser) await this.init();

    // 2. Get the next proxy from the rotator
    const proxyUrl = getNextProxy();

    if (proxyUrl) {
      logger.debug({ proxy: proxyUrl }, "Using Proxy for this job");
    }

    // 3. Apply proxy to the context options
    const contextOptions: any = {
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      locale: "en-US",
    };

    // Add proxy if it exists
    if (proxyUrl) {
      contextOptions.proxy = { server: proxyUrl };
    }

    const context = await globalBrowser!.newContext(contextOptions);
    const page = await context.newPage();

    // ... (Keep existing resource blocking code) ...

    return { context, page };
  }
  /**
   * Closes the context (tab) but keeps the browser running.
   */
  static async closeContext(context: BrowserContext) {
    if (context) await context.close();
  }

  /**
   * Full shutdown (for server termination)
   */
  static async closeBrowser() {
    if (globalBrowser) {
      await globalBrowser.close();
      globalBrowser = null;
    }
  }
}
