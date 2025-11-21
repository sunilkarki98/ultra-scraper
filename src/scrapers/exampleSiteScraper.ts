import { BaseScraper } from "./baseScraper";
import * as cheerio from "cheerio";
import { logger } from "../utils/logger";
import { ScrapeOptions } from "./universalScraper";

export class ExampleSiteScraper extends BaseScraper<any> {
  protected async scrape(options: ScrapeOptions): Promise<any> {
    const { url } = options;
    if (!this.page) throw new Error("Page not initialized");

    logger.debug({ url }, "Navigating to page...");

    await this.page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const content = await this.page.content();
    const $ = cheerio.load(content);

    const title = $("title").text().trim();
    const metaDescription = $('meta[name="description"]').attr("content") || "";

    const links: string[] = [];
    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (href && href.startsWith("http")) links.push(href);
    });

    return {
      title,
      metaDescription,
      linkCount: links.length,
      topLinks: links.slice(0, 5),
    };
  }
}
