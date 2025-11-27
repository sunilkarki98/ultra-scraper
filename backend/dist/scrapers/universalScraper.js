"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversalScraper = void 0;
// FILE: src/scrapers/universalScraper.ts
const baseScraper_1 = require("./baseScraper");
const htmlParser_1 = require("../parsers/htmlParser");
const logger_1 = require("../utils/logger");
class UniversalScraper extends baseScraper_1.BaseScraper {
    /**
     * The specific scraping logic.
     * BaseScraper handles the browser, errors, and retries.
     */
    async scrape(options) {
        if (!this.page)
            throw new Error("Browser Page not initialized");
        const { waitForSelector, hydrationDelay = 2000, maxContentLength = 10000, } = options;
        // 1. Wait for Specific Elements (if requested)
        if (waitForSelector) {
            try {
                await this.page.waitForSelector(waitForSelector, { timeout: 5000 });
            }
            catch (e) {
                logger_1.logger.warn(`Selector ${waitForSelector} not found, proceeding anyway.`);
            }
        }
        // 2. Human Behavior: Smooth Scroll to trigger lazy loading
        await this.autoScroll();
        // 3. Wait for Hydration (React/Vue/Angular apps)
        if (hydrationDelay) {
            await this.randomDelay(hydrationDelay);
        }
        // 4. Get Raw HTML & Pass to our Advanced Parser
        const html = await this.page.content();
        const parser = new htmlParser_1.HtmlParser(html);
        // 5. Extraction Logic
        // A. Basic Meta
        const title = (await this.page.title()) ||
            parser.getAttribute('meta[property="og:title"]', "content") ||
            "";
        const description = parser.getAttribute('meta[name="description"]', "content") || "";
        const h1 = parser.getText("h1") || "";
        // B. Clean Body Content
        // Remove nav, footer, scripts before extracting text
        const content = this.cleanContent(parser, maxContentLength);
        // C. Extract Links & Leads
        const links = this.extractLinks(parser, options.maxLinks || 50);
        const leads = await this.extractLeads(content); // Scan text + mailto links
        const jsonLd = parser.getJsonLd(); // Get hidden Schema.org data
        // Validation
        if (!title && content.length < 50) {
            throw new Error("Page appears empty or fully blocked");
        }
        return {
            title,
            description,
            h1,
            content,
            links,
            leads,
            jsonLd,
        };
    }
    /**
     * Helper: Scroll to bottom to trigger lazy loads
     */
    async autoScroll() {
        if (!this.page)
            return;
        await this.page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 100;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    if (totalHeight >= scrollHeight || totalHeight > 15000) {
                        // Stop after 15k pixels
                        clearInterval(timer);
                        resolve();
                    }
                }, 50);
            });
        });
    }
    /**
     * Helper: Clean text content
     */
    cleanContent(parser, maxLength) {
        // We rely on HtmlParser's Cheerio instance, but for deep cleaning
        // sometimes regex on the whole body is easier.
        // Ideally, HtmlParser should have a 'removeElements' method.
        // For now, we extract body text.
        const text = parser.getText("body");
        return text ? text.substring(0, maxLength) : "";
    }
    /**
     * Helper: Extract Links
     */
    extractLinks(parser, limit) {
        const baseUrl = this.page?.url() || "";
        return parser
            .getList("a", ($el) => {
            const rawHref = $el.attr("href");
            try {
                // Resolve relative URL
                const absoluteUrl = new URL(rawHref || "", baseUrl).href;
                return {
                    text: $el.text().trim().replace(/\s+/g, " "),
                    href: absoluteUrl,
                };
            }
            catch (e) {
                return { text: "", href: "" };
            }
        })
            .filter((l) => l.href && l.href.startsWith("http") && l.text.length > 0)
            .slice(0, limit);
    }
    /**
     * Helper: Extract Emails, Phones, Socials
     * Combines Regex with DOM inspection for 'mailto:'
     */
    async extractLeads(bodyText) {
        // 1. Regex Extraction
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g;
        const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
        const regexEmails = bodyText.match(emailRegex) || [];
        const regexPhones = bodyText.match(phoneRegex) || [];
        // 2. DOM Extraction (Better accuracy for buttons)
        // We use page.evaluate here because 'href' properties are computed
        const domLeads = await this.page.evaluate(() => {
            const emails = [];
            const phones = [];
            document.querySelectorAll('a[href^="mailto:"]').forEach((el) => {
                const href = el.getAttribute("href");
                if (href)
                    emails.push(href.replace("mailto:", ""));
            });
            document.querySelectorAll('a[href^="tel:"]').forEach((el) => {
                const href = el.getAttribute("href");
                if (href)
                    phones.push(href.replace("tel:", ""));
            });
            return { emails, phones };
        });
        // 3. Social Media Links
        const socialDomains = [
            "facebook.com",
            "instagram.com",
            "linkedin.com",
            "twitter.com",
            "tiktok.com",
            "youtube.com",
        ];
        const socialLinks = [];
        // (Simple scan of bodyText is inaccurate for socials, usually better to scan 'a' tags)
        // We leave this as a basic filter on the 'links' array we already extracted.
        return {
            emails: [...new Set([...regexEmails, ...domLeads.emails])].map((e) => e.toLowerCase()),
            phones: [...new Set([...regexPhones, ...domLeads.phones])],
            socialLinks, // Populated by the parent method if needed, or logic added here
        };
    }
}
exports.UniversalScraper = UniversalScraper;
