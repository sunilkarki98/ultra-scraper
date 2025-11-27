// FILE: src/scrapers/heavyScraper.ts
import { PuppeteerManager } from "../browser/puppeteer";
import { HtmlParser } from "../parsers/htmlParser";
import { ScrapeOptions, ScrapeResult } from "./universalScraper";
import { logger } from "../utils/logger";

export class HeavyScraper {
  /**
   * Runs the "Hard 10%" logic using Puppeteer + GhostCursor
   */
  async run(
    options: ScrapeOptions
  ): Promise<{ success: boolean; data?: ScrapeResult; error?: string }> {
    const { url, proxy } = options;
    let page = null;

    try {
      logger.info("🛡️ HEAVY ARTILLERY: Engaging Puppeteer Stealth Mode...");

      // 1. Launch with GhostCursor
      const result = await PuppeteerManager.launchPage(url, proxy);
      page = result.page;
      const content = result.content;

      // 2. Parse Data (Reuse the same logic as Universal Scraper via HtmlParser)
      // We do this without the browser overhead, just using the HTML string
      const parser = new HtmlParser(content);

      const title =
        parser.getAttribute('meta[property="og:title"]', "content") ||
        parser.getText("title") ||
        "";
      const description =
        parser.getAttribute('meta[name="description"]', "content") || "";

      // Extract Leads (simplified for Heavy mode - usually we just want content)
      const jsonLd = parser.getJsonLd();
      const links = parser.getList("a", ($el) => ({
        text: $el.text(),
        href: $el.attr("href"),
      }));

      const output: ScrapeResult = {
        title,
        description,
        h1: parser.getText("h1") || "",
        content: (parser.getText("body") || "").substring(
          0,
          options.maxContentLength || 10000
        ),

        links: links.slice(0, options.maxLinks || 50),
        leads: { emails: [], phones: [], socialLinks: [] }, // Implement deep extraction if needed
        jsonLd,
      };

      return { success: true, data: output };
    } catch (error: any) {
      logger.error(`Heavy Scraper Failed: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      if (page) await PuppeteerManager.closePage(page);
    }
  }
}
