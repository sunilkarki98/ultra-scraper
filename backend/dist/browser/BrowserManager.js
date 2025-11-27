"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserManager = void 0;
const playwright_extra_1 = require("playwright-extra");
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
// @ts-ignore
const user_agents_1 = __importDefault(require("user-agents"));
const config_1 = __importDefault(require("../config"));
const logger_1 = require("../utils/logger");
// Activate Stealth Plugin
playwright_extra_1.chromium.use((0, puppeteer_extra_plugin_stealth_1.default)());
class BrowserManager {
    static globalBrowser = null;
    /**
     * Initialize the Global Browser Instance (Singleton)
     * using playwright-extra for stealth capabilities.
     */
    static async init() {
        if (this.globalBrowser?.isConnected())
            return;
        logger_1.logger.info("🚀 Launching Enterprise Browser Engine...");
        this.globalBrowser = await playwright_extra_1.chromium.launch({
            headless: config_1.default.scraping.headless,
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
    static parseProxy(proxyString) {
        if (!proxyString)
            return undefined;
        try {
            const url = new URL(proxyString);
            return {
                server: `${url.protocol}//${url.hostname}:${url.port}`,
                username: url.username,
                password: url.password,
            };
        }
        catch (e) {
            logger_1.logger.warn(`Invalid proxy string provided: ${proxyString}`);
            return undefined;
        }
    }
    /**
     * Launches a new optimized Context.
     * Handles Fingerprinting, Proxy Auth, and Resource Blocking.
     */
    static async launchContext(options = {}) {
        if (!this.globalBrowser || !this.globalBrowser.isConnected()) {
            await this.init();
        }
        const { proxy, userAgent, mobile, cookies } = options;
        const proxyConfig = this.parseProxy(proxy);
        // 1. Generate Advanced User Agent
        const userAgentInstance = new user_agents_1.default({
            deviceCategory: mobile ? "mobile" : "desktop",
            platform: "MacIntel", // Force Mac footprint even on Linux/Docker for better trust score
        });
        const finalUA = userAgent || userAgentInstance.toString();
        // 2. Create Context with Fingerprint overrides
        const context = await this.globalBrowser.newContext({
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
            if (blockedResources.includes(resourceType) ||
                blockedDomains.some((d) => url.includes(d))) {
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
    static async closeContext(context) {
        try {
            if (context)
                await context.close();
        }
        catch (error) {
            logger_1.logger.warn("Error closing browser context", error);
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
exports.BrowserManager = BrowserManager;
