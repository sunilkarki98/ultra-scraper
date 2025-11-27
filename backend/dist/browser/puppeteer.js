"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PuppeteerManager = void 0;
// FILE: src/browser/puppeteer.ts
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
const puppeteer_extra_plugin_anonymize_ua_1 = __importDefault(require("puppeteer-extra-plugin-anonymize-ua"));
const ghost_cursor_1 = require("ghost-cursor");
const logger_1 = require("../utils/logger");
const config_1 = __importDefault(require("../config"));
const userAgents_1 = require("../utils/userAgents");
// Use plugins
puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_anonymize_ua_1.default)());
class PuppeteerManager {
    static browser = null;
    static async init() {
        if (this.browser)
            return;
        logger_1.logger.info("🛡️ Launching Puppeteer Stealth Engine (Ultra Mode)...");
        // ✅ FIX: strictly boolean. Puppeteer v22+ treats 'true' as the new headless mode.
        const headlessMode = config_1.default.scraping.headless;
        const launchArgs = [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--window-size=1920,1080",
            "--disable-accelerated-2d-canvas",
            "--disable-gpu",
        ];
        this.browser = (await puppeteer_extra_1.default.launch({
            headless: headlessMode ? "shell" : false, // or just `headlessMode` if on latest v23+
            args: launchArgs,
            ignoreDefaultArgs: ["--enable-automation"],
            defaultViewport: { width: 1920, height: 1080 },
        }));
        // Note: 'as unknown as Browser' handles potential type conflicts between
        // puppeteer-core types and puppeteer-extra wrappers if versions mismatch.
    }
    static async retryGoto(page, url, retries = 3) {
        let lastError = null;
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
                await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));
                return;
            }
            catch (err) {
                lastError = err;
                logger_1.logger.warn(`Goto attempt ${attempt} failed for ${url}: ${err}`);
                if (attempt < retries) {
                    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 2000));
                }
            }
        }
        throw lastError;
    }
    static async setStealthFingerprints(page) {
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
                WebGLRenderingContext.prototype.getParameter = function (parameter) {
                    if (parameter === 37445)
                        return "Intel Inc.";
                    if (parameter === 37446)
                        return "Intel Iris OpenGL Engine";
                    return getParameter.call(this, parameter);
                };
            }
            catch (e) { }
        });
    }
    static async randomizeUA(page, isMobile) {
        const ua = (0, userAgents_1.getRandomUserAgent)(isMobile);
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
    static async setRequestInterception(page) {
        // ✅ FIX: Types now exist in config
        if (!config_1.default.scraping.blockAssets)
            return;
        await page.setRequestInterception(true);
        page.on("request", (req) => {
            const resource = req.resourceType();
            const blocked = ["image", "media", "font", "stylesheet"];
            if (blocked.includes(resource))
                return req.abort();
            if (/google-analytics|gtag|doubleclick|mixpanel|hotjar/i.test(req.url())) {
                return req.abort();
            }
            req.continue().catch(() => { });
        });
    }
    static async humanize(page) {
        await new Promise((r) => setTimeout(r, 400 + Math.random() * 1000));
        try {
            const cursor = (0, ghost_cursor_1.createCursor)(page);
            await cursor.moveTo({
                x: Math.floor(Math.random() * 1000) + 100,
                y: Math.floor(Math.random() * 400) + 50,
            });
        }
        catch { }
        await page.evaluate(async () => {
            function sleep(ms) {
                return new Promise((res) => setTimeout(res, ms));
            }
            const steps = Math.floor(Math.random() * 6) + 3;
            for (let i = 0; i < steps; i++) {
                window.scrollBy(0, Math.floor(Math.random() * 300) + 100);
                await sleep(Math.floor(Math.random() * 400) + 150);
            }
        });
    }
    static async launchPage(url, proxy, isMobile = false) {
        if (!this.browser)
            await this.init();
        const page = await this.browser.newPage();
        page.on("error", async () => {
            try {
                if (!page.isClosed())
                    await page.close();
            }
            catch { }
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
            }
            catch (e) {
                logger_1.logger.warn(`Invalid proxy URL provided to Puppeteer: ${proxy}`);
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
            }
            else {
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
            logger_1.logger.info(`Navigating to ${url} with Puppeteer (Mobile: ${isMobile})...`);
            // ✅ FIX: Type now exists in config
            await this.retryGoto(page, url, config_1.default.scraping.gotoRetries);
            await this.humanize(page);
            await new Promise((r) => setTimeout(r, 500 + Math.random() * 1200));
            const content = await page.content();
            return { page, content };
        }
        catch (error) {
            logger_1.logger.error(`Puppeteer Failed: ${error}`);
            try {
                if (!page.isClosed())
                    await page.close();
            }
            catch { }
            throw error;
        }
    }
    static async closePage(page) {
        try {
            if (page && !page.isClosed())
                await page.close();
        }
        catch (e) { }
    }
    static async shutdownBrowser() {
        if (this.browser) {
            try {
                await this.browser.close();
            }
            catch (e) {
            }
            finally {
                this.browser = null;
            }
        }
    }
}
exports.PuppeteerManager = PuppeteerManager;
