// FILE: src/browser/puppeteer.ts
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AnonymizeUAPlugin from "puppeteer-extra-plugin-anonymize-ua";
import { Browser, Page, HTTPRequest } from "puppeteer";
import { createCursor } from "ghost-cursor";
import { logger } from "../utils/logger";
import config from "../config";
import { getRandomUserAgent } from "../utils/userAgents";
import { CaptchaSolver } from "../utils/captchaSolver";
import { LoginHandler } from "../utils/loginHandler";

// Use plugins
puppeteer.use(StealthPlugin());
puppeteer.use(AnonymizeUAPlugin());

export class PuppeteerManager {
  private static browser: Browser | null = null;
  private static captchaSolver: CaptchaSolver | null = null;
  private static loginHandler: LoginHandler | null = null;

  static async init() {
    if (this.browser) return;

    logger.info("🛡️ Launching Puppeteer Stealth Engine (Ultra Mode)...");

    // Initialize helper services
    if (!this.captchaSolver) {
      this.captchaSolver = new CaptchaSolver();
    }
    if (!this.loginHandler) {
      this.loginHandler = new LoginHandler();
    }

    // ✅ FIX: strictly boolean. Puppeteer v22+ treats 'true' as the new headless mode.
    const headlessMode: boolean = config.scraping.headless;

    const launchArgs = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1920,1080",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
    ];

    this.browser = (await puppeteer.launch({
      headless: headlessMode ? "shell" : false, // or just `headlessMode` if on latest v23+
      args: launchArgs,
      ignoreDefaultArgs: ["--enable-automation"],
      defaultViewport: { width: 1920, height: 1080 },
    })) as unknown as Browser;
    // Note: 'as unknown as Browser' handles potential type conflicts between
    // puppeteer-core types and puppeteer-extra wrappers if versions mismatch.
  }

  private static async retryGoto(page: Page, url: string, retries = 3) {
    let lastError: any = null;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));
        return;
      } catch (err) {
        lastError = err;
        logger.warn(`Goto attempt ${attempt} failed for ${url}: ${err}`);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 1000 + Math.random() * 2000));
        }
      }
    }
    throw lastError;
  }

  private static async setStealthFingerprints(page: Page) {
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });
      Object.defineProperty(navigator, "hardwareConcurrency", {
        get: () => Math.floor(Math.random() * 4) + 4,
      });

      try {
        const getParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function (
          parameter: number
        ) {
          if (parameter === 37445) return "Intel Inc.";
          if (parameter === 37446) return "Intel Iris OpenGL Engine";
          return getParameter.call(this, parameter);
        };
      } catch (e) { }
    });
  }

  private static async randomizeUA(page: Page, isMobile: boolean) {
    const ua = getRandomUserAgent(isMobile);
    if (ua) {
      // ✅ FIX: Pass only the string.
      // Even if deprecated warning shows in editor, this is the correct usage
      // for standard UA override without Client Hints data.
      await page.setUserAgent(ua);
    }
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
    });
  }

  private static async setRequestInterception(page: Page) {
    // ✅ FIX: Types now exist in config
    if (!config.scraping.blockAssets) return;

    await page.setRequestInterception(true);
    page.on("request", (req: HTTPRequest) => {
      const resource = req.resourceType();
      const blocked = ["image", "media", "font", "stylesheet"];
      if (blocked.includes(resource)) return req.abort();
      if (
        /google-analytics|gtag|doubleclick|mixpanel|hotjar/i.test(req.url())
      ) {
        return req.abort();
      }
      req.continue().catch(() => { });
    });
  }

  private static async humanize(page: Page) {
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 1000));
    try {
      const cursor = createCursor(page);
      await cursor.moveTo({
        x: Math.floor(Math.random() * 1000) + 100,
        y: Math.floor(Math.random() * 400) + 50,
      });
    } catch { }

    await page.evaluate(async () => {
      function sleep(ms: number) {
        return new Promise((res) => setTimeout(res, ms));
      }
      const steps = Math.floor(Math.random() * 6) + 3;
      for (let i = 0; i < steps; i++) {
        window.scrollBy(0, Math.floor(Math.random() * 300) + 100);
        await sleep(Math.floor(Math.random() * 400) + 150);
      }
    });
  }

  static async launchPage(
    url: string,
    proxy?: string,
    isMobile: boolean = false
  ): Promise<{ page: Page; content: string }> {
    if (!this.browser) await this.init();

    const page = await this.browser!.newPage();

    page.on("error", async () => {
      try {
        if (!page.isClosed()) await page.close();
      } catch { }
    });

    if (proxy) {
      try {
        const proxyUrl = new URL(proxy);
        if (proxyUrl.username && proxyUrl.password) {
          await page.authenticate({
            username: proxyUrl.username,
            password: proxyUrl.password,
          });
        }
      } catch (e) {
        logger.warn(`Invalid proxy URL provided to Puppeteer: ${proxy}`);
      }
    }

    try {
      if (isMobile) {
        await page.setViewport({
          width: 390,
          height: 844,
          isMobile: true,
          hasTouch: true,
        });
      } else {
        await page.setViewport({
          width: 1920,
          height: 1080,
          isMobile: false,
          hasTouch: false,
        });
      }

      await this.setStealthFingerprints(page);
      await this.randomizeUA(page, isMobile);
      await this.setRequestInterception(page);

      logger.info(
        `Navigating to ${url} with Puppeteer (Mobile: ${isMobile})...`
      );

      // ✅ FIX: Type now exists in config
      await this.retryGoto(page, url, config.scraping.gotoRetries);

      await this.humanize(page);
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 1200));

      const content = await page.content();

      return { page, content };
    } catch (error) {
      logger.error(`Puppeteer Failed: ${error}`);
      try {
        if (!page.isClosed()) await page.close();
      } catch { }
      throw error;
    }
  }

  static async closePage(page: Page) {
    try {
      if (page && !page.isClosed()) await page.close();
    } catch (e) { }
  }

  /**
   * Solve captcha on a page
   */
  static async solveCaptcha(page: Page, url: string): Promise<boolean> {
    if (!this.captchaSolver) {
      this.captchaSolver = new CaptchaSolver();
    }
    return this.captchaSolver.handleCaptcha(page, url);
  }

  /**
   * Perform login on a page
   */
  static async handleLogin(page: Page, credentials: any): Promise<any> {
    if (!this.loginHandler) {
      this.loginHandler = new LoginHandler();
    }
    return this.loginHandler.login(page, credentials);
  }

  /**
   * Load saved session cookies
   */
  static async loadSession(page: Page, cookies: any[]): Promise<void> {
    if (!this.loginHandler) {
      this.loginHandler = new LoginHandler();
    }
    return this.loginHandler.loadSession(page, cookies);
  }

  static async shutdownBrowser() {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (e) {
      } finally {
        this.browser = null;
      }
    }
  }
}
