// FILE: src/browser/BrowserManager.ts
import { Browser, BrowserContext, Page, Cookie } from "playwright";
import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
// @ts-ignore
import UserAgent from "user-agents";
import config from "../config";
import { logger } from "../utils/logger";

// Activate Stealth Plugin
chromium.use(stealthPlugin());

// Type definitions for cleaner code
export interface BrowserContextOptions {
  proxy?: string; // Format: protocol://user:pass@ip:port or protocol://ip:port
  userAgent?: string;
  mobile?: boolean;
  cookies?: Cookie[];
  useStealth?: boolean;
}

export class BrowserManager {
  private static globalBrowser: Browser | null = null;

  /**
   * Initialize the Global Browser Instance (Singleton)
   * using playwright-extra for stealth capabilities.
   */
  static async init() {
    if (this.globalBrowser?.isConnected()) return;

    logger.info("🚀 Launching Enterprise Browser Engine...");

    this.globalBrowser = await chromium.launch({
      headless: config.scraping.headless,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", // Fixes crashes in Docker
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--mute-audio",
        "--disable-blink-features=AutomationControlled", // Critical for stealth
        "--window-position=0,0",
      ],
    });
  }

  /**
   * Helper to parse proxy strings into Playwright format
   */
  private static parseProxy(proxyString?: string) {
    if (!proxyString) return undefined;
    try {
      const url = new URL(proxyString);
      return {
        server: `${url.protocol}//${url.hostname}:${url.port}`,
        username: url.username,
        password: url.password,
      };
    } catch (e) {
      logger.warn(`Invalid proxy string provided: ${proxyString}`);
      return undefined;
    }
  }

  /**
   * Launches a new optimized Context.
   * Handles Fingerprinting, Proxy Auth, and Resource Blocking.
   */
  static async launchContext(
    options: BrowserContextOptions = {}
  ): Promise<{ context: BrowserContext; page: Page }> {
    if (!this.globalBrowser || !this.globalBrowser.isConnected()) {
      await this.init();
    }

    const { proxy, userAgent, mobile, cookies } = options;
    const proxyConfig = this.parseProxy(proxy);

    // 1. Generate Advanced User Agent
    const userAgentInstance = new UserAgent({
      deviceCategory: mobile ? "mobile" : "desktop",
      platform: "MacIntel", // Force Mac footprint even on Linux/Docker for better trust score
    });

    const finalUA = userAgent || userAgentInstance.toString();

    // 2. Create Context with Fingerprint overrides
    const context = await this.globalBrowser!.newContext({
      userAgent: finalUA,
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1920, height: 1080 },
      locale: "en-US",
      timezoneId: "America/New_York", // Should ideally match proxy IP location
      deviceScaleFactor: mobile ? 3 : 1,
      hasTouch: !!mobile,
      isMobile: !!mobile,
      proxy: proxyConfig,
      permissions: ["geolocation"], // Sometimes helps pass bot checks
      ignoreHTTPSErrors: true, // Bypass SSL issues
    });

    // Force disable WebRTC via script injection
    await context.addInitScript(() => {
      // @ts-ignore
      navigator.mediaDevices = undefined;
      // @ts-ignore
      window.RTCPeerConnection = undefined;
      // @ts-ignore
      window.RTCDataChannel = undefined;
    });

    // 3. Inject Cookies if provided (for authenticated sessions)
    if (cookies && cookies.length > 0) {
      await context.addCookies(cookies);
    }

    const page = await context.newPage();

    // 4. Advanced Resource Blocking & Network Optimization
    await page.route("**/*", (route) => {
      const resourceType = route.request().resourceType();
      const url = route.request().url();

      // Block heavy media and tracking scripts
      const blockedResources = [
        "image",
        "media",
        "font",
        "texttrack",
        "object",
        "beacon",
        "csp_report",
        "imageset",
      ];
      const blockedDomains = [
        "google-analytics.com",
        "facebook.net",
        "doubleclick.net",
        "adsystem.com",
      ];

      if (
        blockedResources.includes(resourceType) ||
        blockedDomains.some((d) => url.includes(d))
      ) {
        return route.abort();
      }
      return route.continue();
    });

    // 5. Safety: Disable Webdriver property (Double check even if stealth plugin is on)
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    return { context, page };
  }

  /** Safely close context */
  static async closeContext(context: BrowserContext) {
    try {
      if (context) await context.close();
    } catch (error) {
      logger.warn("Error closing browser context", error);
    }
  }

  /** Nuke the whole browser (used on shutdown or fatal error) */
  static async closeBrowser() {
    if (this.globalBrowser) {
      await this.globalBrowser.close();
      this.globalBrowser = null;
    }
  }
}
