// FILE: src/browser/playright.ts
import { Browser, BrowserContext, Page } from "playwright";
import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
// @ts-ignore
import UserAgent from "user-agents";
import config from "../config";
import { logger } from "../utils/logger";
import { ScrapeOptions } from "../scrapers/universalScraper";

// Enable stealth plugin
chromium.use(stealthPlugin());

let globalBrowser: Browser | null = null;

export class BrowserManager {
  /** Initialize global browser */
  static async init() {
    if (globalBrowser && globalBrowser.isConnected()) return;

    logger.info("🚀 Launching robust browser...");

    globalBrowser = await chromium.launch({
      headless: config.scraping.headless,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--mute-audio",
        "--window-size=1920,1080",
      ],
    });
  }

  /**
   * Launch a new browser context
   * Accepts ScrapeOptions for proxy, userAgent, mobile, etc.
   */
  static async launchContext(
    options: Pick<ScrapeOptions, "proxy" | "userAgent" | "mobile"> = {}
  ): Promise<{ context: BrowserContext; page: Page }> {
    if (!globalBrowser || !globalBrowser.isConnected()) await this.init();
    if (!globalBrowser) throw new Error("Browser failed to initialize");

    const { proxy, userAgent, mobile } = options;

    const ua =
      userAgent ||
      new UserAgent({
        deviceCategory: mobile ? "mobile" : "desktop",
      }).toString();

    const context = await globalBrowser.newContext({
      userAgent: ua,
      viewport: mobile
        ? { width: 375, height: 812 }
        : { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      locale: "en-US",
      bypassCSP: true,
      proxy: proxy ? { server: proxy } : undefined,
      isMobile: !!mobile,
    });

    const page = await context.newPage();

    // Resource blocking
    await page.route("**/*", (route) => {
      const type = route.request().resourceType();
      const blockedTypes = [
        "image",
        "media",
        "font",
        "texttrack",
        "object",
        "beacon",
        "csp_report",
        "imageset",
      ];
      if (blockedTypes.includes(type)) return route.abort();
      return route.continue();
    });

    return { context, page };
  }

  /** Close a context */
  static async closeContext(context: BrowserContext) {
    if (context) await context.close();
  }

  /** Close the global browser */
  static async closeBrowser() {
    if (globalBrowser) {
      await globalBrowser.close();
      globalBrowser = null;
    }
  }
}
