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
      let content = result.content;

      // 1.5 Check for Captcha and solve if present
      logger.info("🔍 Checking for captcha challenges...");
      const captchaSolved = await PuppeteerManager.solveCaptcha(page, url);
      if (captchaSolved) {
        logger.info("✅ Captcha solved successfully");
        // Reload content after captcha solving
        await page.waitForTimeout(2000);
        content = await page.content();
      }

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
        images: extractImages(parser, url),
        videos: extractVideos(parser, url),
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

/**
 * Helper: Extract Images
 */
function extractImages(parser: HtmlParser, baseUrl: string) {
  return parser
    .getList("img", ($el) => {
      const src = $el.attr("src");
      const alt = $el.attr("alt") || "";
      const width = parseInt($el.attr("width") || "0", 10);
      const height = parseInt($el.attr("height") || "0", 10);

      if (!src) return null;

      try {
        const absoluteUrl = new URL(src, baseUrl).href;
        // Filter small icons/pixels
        if ((width > 0 && width < 50) || (height > 0 && height < 50)) return null;

        return {
          src: absoluteUrl,
          alt,
          width: width || undefined,
          height: height || undefined,
        };
      } catch (e) {
        return null;
      }
    })
    .filter((img): img is NonNullable<typeof img> => img !== null)
    .slice(0, 50); // Limit to 50 images
}

/**
 * Helper: Extract Videos
 */
function extractVideos(parser: HtmlParser, baseUrl: string) {
  // 1. HTML5 Videos
  const html5Videos = parser.getList("video", ($el) => {
    const src = $el.attr("src") || $el.find("source").attr("src");
    const poster = $el.attr("poster");

    if (!src) return null;

    try {
      return {
        url: new URL(src, baseUrl).href,
        type: 'html5' as const,
        poster: poster ? new URL(poster, baseUrl).href : undefined,
      };
    } catch (e) {
      return null;
    }
  }).filter((v): v is NonNullable<typeof v> => v !== null);

  // 2. Iframe Embeds (YouTube/Vimeo)
  const iframeVideos = parser.getList("iframe", ($el) => {
    const src = $el.attr("src");
    if (!src) return null;

    try {
      const url = new URL(src, baseUrl).href;
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        return { url, type: 'youtube' as const };
      }
      if (url.includes("vimeo.com")) {
        return { url, type: 'vimeo' as const };
      }
      return null;
    } catch (e) {
      return null;
    }
  }).filter((v): v is NonNullable<typeof v> => v !== null);

  return [...html5Videos, ...iframeVideos];
}
