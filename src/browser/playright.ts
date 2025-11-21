import { Browser, BrowserContext, Page } from "playwright";
import { stealthChromium } from "./stealth";
import config from "../config"; // <--- Now actually used
import { logger } from "../utils/logger";
import { getNextProxy } from "../utils/proxy";

let globalBrowser: Browser | null = null;

export class BrowserManager {
  static async init() {
    if (globalBrowser && globalBrowser.isConnected()) return;

    // Safety: Force headless on Railway/Production to prevent crashes
    const isProduction = process.env.NODE_ENV === "production";
    const useHeadless = isProduction ? true : config.scraping.headless;

    logger.info(`🚀 Launching Stealth Chromium (Headless: ${useHeadless})...`);

    globalBrowser = await stealthChromium.launch({
      headless: useHeadless,
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

  static async launchContext(): Promise<{
    context: BrowserContext;
    page: Page;
  }> {
    if (!globalBrowser || !globalBrowser.isConnected()) {
      await this.init();
    }

    const proxyUrl = getNextProxy();
    if (proxyUrl) {
      logger.debug({ proxy: proxyUrl }, "Using Proxy");
    }

    const contextOptions: any = {
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      locale: "en-US",
      ...(proxyUrl ? { proxy: { server: proxyUrl } } : {}),
    };

    const context = await globalBrowser!.newContext(contextOptions);
    const page = await context.newPage();

    // Resource Blocking (Optimized for Railway RAM)
    await page.route("**/*", (route) => {
      const type = route.request().resourceType();
      const blockedTypes = ["image", "font", "stylesheet", "media", "other"];
      if (blockedTypes.includes(type)) {
        return route.abort();
      }
      return route.continue();
    });

    return { context, page };
  }

  static async closeContext(context: BrowserContext) {
    if (context) await context.close();
  }

  static async closeBrowser() {
    if (globalBrowser) {
      await globalBrowser.close();
      globalBrowser = null;
    }
  }
}
