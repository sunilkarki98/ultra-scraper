// FILE: src/parsers/htmlParser.ts
import * as cheerio from "cheerio";
import { logger } from "../utils/logger";

export class HtmlParser {
  private $: cheerio.CheerioAPI;

  constructor(htmlContent: string) {
    this.$ = cheerio.load(htmlContent);
  }

  /**
   * Extract text from a specific selector with automatic cleaning.
   * @param selector CSS Selector (e.g. '.product-price')
   */
  public getText(selector: string): string | null {
    const element = this.$(selector).first();
    if (!element.length) return null;
    return this.cleanText(element.text());
  }

  /**
   * Extract attribute value (e.g. href, src, data-id)
   */
  public getAttribute(selector: string, attribute: string): string | null {
    const val = this.$(selector).attr(attribute);
    return val ? val.trim() : null;
  }

  /**
   * Extract multiple elements (e.g. a list of products)
   */
  public getList(
    selector: string,
    extractor: ($el: cheerio.Cheerio<any>) => any
  ): any[] {
    const results: any[] = [];
    this.$(selector).each((_, el) => {
      results.push(extractor(this.$(el)));
    });
    return results;
  }

  /**
   * 🚀 ADVANCED: Extract JSON-LD Structured Data
   * This is the 'God Mode' of scraping. Many sites put all product/article info
   * here in clean JSON format.
   */
  public getJsonLd(): any[] {
    const data: any[] = [];
    this.$('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse(this.$(el).html() || "{}");
        data.push(json);
      } catch (err) {
        logger.warn("Failed to parse JSON-LD block");
      }
    });
    return data;
  }

  /**
   * Fallback: Extract Meta Tags (OpenGraph/Twitter Cards)
   * Useful when CSS selectors change but SEO tags remain.
   */
  public getMetaTags(): Record<string, string> {
    const meta: Record<string, string> = {};

    this.$("meta").each((_, el) => {
      const $el = this.$(el);
      const property = $el.attr("property") || $el.attr("name");
      const content = $el.attr("content");

      if (property && content) {
        meta[property] = content;
      }
    });

    return meta;
  }

  /**
   * Utility: Remove newlines, tabs, and extra spaces
   */
  private cleanText(text: string): string {
    return text
      .replace(/\\n/g, " ")
      .replace(/\\t/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}
