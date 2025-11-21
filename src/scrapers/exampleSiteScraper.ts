// FILE: src/scrapers/exampleSiteScraper.ts
import { BaseScraper } from "./baseScraper";
import * as cheerio from "cheerio";
import { logger } from "../utils/logger";

export class ExampleSiteScraper extends BaseScraper {
  protected async scrape(url: string): Promise<any> {
    if (!this.page) throw new Error("Page not initialized");

    logger.debug({ url }, "Navigating to page...");

    // 1. Navigate
    await this.page.goto(url, {
      waitUntil: "domcontentloaded", // 'networkidle' is usually too slow
      timeout: 30000,
    });

    // 2. Interaction (Example: Scroll to bottom to trigger lazy loading)
    // await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    // await this.page.waitForTimeout(1000);

    // 3. Extract HTML
    // We use Cheerio for parsing because it's 100x faster than
    // doing document.querySelector inside the browser context.
    const content = await this.page.content();
    const $ = cheerio.load(content);

    // 4. Parse Data
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
