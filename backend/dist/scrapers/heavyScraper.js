"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeavyScraper = void 0;
// FILE: src/scrapers/heavyScraper.ts
const puppeteer_1 = require("../browser/puppeteer");
const htmlParser_1 = require("../parsers/htmlParser");
const logger_1 = require("../utils/logger");
class HeavyScraper {
    /**
     * Runs the "Hard 10%" logic using Puppeteer + GhostCursor
     */
    async run(options) {
        const { url, proxy } = options;
        let page = null;
        try {
            logger_1.logger.info("🛡️ HEAVY ARTILLERY: Engaging Puppeteer Stealth Mode...");
            // 1. Launch with GhostCursor
            const result = await puppeteer_1.PuppeteerManager.launchPage(url, proxy);
            page = result.page;
            const content = result.content;
            // 2. Parse Data (Reuse the same logic as Universal Scraper via HtmlParser)
            // We do this without the browser overhead, just using the HTML string
            const parser = new htmlParser_1.HtmlParser(content);
            const title = parser.getAttribute('meta[property="og:title"]', "content") ||
                parser.getText("title") ||
                "";
            const description = parser.getAttribute('meta[name="description"]', "content") || "";
            // Extract Leads (simplified for Heavy mode - usually we just want content)
            const jsonLd = parser.getJsonLd();
            const links = parser.getList("a", ($el) => ({
                text: $el.text(),
                href: $el.attr("href"),
            }));
            const output = {
                title,
                description,
                h1: parser.getText("h1") || "",
                content: (parser.getText("body") || "").substring(0, options.maxContentLength || 10000),
                links: links.slice(0, options.maxLinks || 50),
                leads: { emails: [], phones: [], socialLinks: [] }, // Implement deep extraction if needed
                jsonLd,
            };
            return { success: true, data: output };
        }
        catch (error) {
            logger_1.logger.error(`Heavy Scraper Failed: ${error.message}`);
            return { success: false, error: error.message };
        }
        finally {
            if (page)
                await puppeteer_1.PuppeteerManager.closePage(page);
        }
    }
}
exports.HeavyScraper = HeavyScraper;
