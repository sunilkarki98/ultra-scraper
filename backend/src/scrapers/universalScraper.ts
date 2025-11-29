// FILE: src/scrapers/universalScraper.ts
import { BaseScraper } from "./baseScraper";
import { HtmlParser } from "../parsers/htmlParser";
import { logger } from "../utils/logger";
import { ProxyService } from "../common/proxy/proxy.service";

// Define ScrapeOptions (If not already in a shared types file)
export interface ScrapeOptions {
  url: string;
  waitForSelector?: string;
  maxContentLength?: number;
  maxLinks?: number;
  hydrationDelay?: number;
  proxy?: string;
  userAgent?: string;
  mobile?: boolean;
  recursive?: boolean;
  maxDepth?: number;
  maxPages?: number;
  ignoreRobotsTxt?: boolean;
  webhook?: string;
  webhookSecret?: string;

  // AI/LLM Extraction Options
  useAI?: boolean;
  aiPrompt?: string;

  // Content Selectors (for URL scrape filtering)
  contentSelectors?: {
    emails?: boolean;
    phones?: boolean;
    text?: boolean;
    links?: boolean;
    images?: boolean;
    videos?: boolean;
    tables?: boolean;
  };

  // Dual-Mode Options
  mode?: 'simple' | 'advanced';
  workflow?: 'scraper-only' | 'scraper-llm' | 'llm-only';
  outputFormat?: 'text' | 'json' | 'markdown' | 'xml';

  llmConfig?: {
    provider: string;
    model: string;
    apiKey?: string;
    endpoint?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  };

  // Legacy/Direct Options (kept for backward compatibility)
  llmProvider?: "openai" | "anthropic" | "gemini" | "custom";
  llmApiKey?: string;
  llmModel?: string;
  llmEndpoint?: string; // For custom/local LLMs
}

// Define the Output Schema
export interface ScrapeResult {
  title: string;
  description: string;
  h1: string;
  content: string;
  links: { text: string; href: string }[];
  leads: {
    emails: string[];
    phones: string[];
    socialLinks: string[];
  };
  images?: {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
  }[];
  videos?: {
    url: string;
    type: 'html5' | 'youtube' | 'vimeo' | 'other';
    poster?: string;
  }[];
  jsonLd: any[]; // Structured data (Schema.org)
}

export class UniversalScraper extends BaseScraper<ScrapeResult> {
  constructor(proxyService?: ProxyService) {
    super(proxyService);
  }
  /**
   * The specific scraping logic.
   * BaseScraper handles the browser, errors, and retries.
   */
  protected async scrape(options: ScrapeOptions): Promise<ScrapeResult> {
    if (!this.page) throw new Error("Browser Page not initialized");

    const {
      waitForSelector,
      hydrationDelay = 2000,
      maxContentLength = 10000,
    } = options;

    // 1. Wait for Specific Elements (if requested)
    if (waitForSelector) {
      try {
        await this.page.waitForSelector(waitForSelector, { timeout: 5000 });
      } catch (e) {
        logger.warn(
          `Selector ${waitForSelector} not found, proceeding anyway.`
        );
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
    const parser = new HtmlParser(html);

    // 5. Extraction Logic
    // A. Basic Meta
    const title =
      (await this.page.title()) ||
      parser.getAttribute('meta[property="og:title"]', "content") ||
      "";
    const description =
      parser.getAttribute('meta[name="description"]', "content") || "";
    const h1 = parser.getText("h1") || "";

    // B. Clean Body Content
    // Remove nav, footer, scripts before extracting text
    const content = this.cleanContent(parser, maxContentLength);

    // C. Extract Links & Leads
    const links = this.extractLinks(parser, options.maxLinks || 50);
    const leads = await this.extractLeads(content); // Scan text + mailto links
    const images = this.extractImages(parser);
    const videos = this.extractVideos(parser);
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
      images,
      videos,
      jsonLd,
    };
  }

  /**
   * Helper: Scroll to bottom to trigger lazy loads
   */
  private async autoScroll() {
    if (!this.page) return;
    await this.page.evaluate(async () => {
      await new Promise<void>((resolve) => {
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
  private cleanContent(parser: HtmlParser, maxLength: number): string {
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
  private extractLinks(parser: HtmlParser, limit: number) {
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
        } catch (e) {
          return { text: "", href: "" };
        }
      })
      .filter((l) => l.href && l.href.startsWith("http") && l.text.length > 0)
      .slice(0, limit);
  }

  /**
   * Helper: Extract Images
   */
  private extractImages(parser: HtmlParser) {
    const baseUrl = this.page?.url() || "";
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
  private extractVideos(parser: HtmlParser) {
    const baseUrl = this.page?.url() || "";

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

  /**
   * Helper: Extract Emails, Phones, Socials
   * Combines Regex with DOM inspection for 'mailto:'
   */
  private async extractLeads(bodyText: string) {
    // 1. Regex Extraction
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g;
    const phoneRegex =
      /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

    const regexEmails = bodyText.match(emailRegex) || [];
    const regexPhones = bodyText.match(phoneRegex) || [];

    // 2. DOM Extraction (Better accuracy for buttons)
    // We use page.evaluate here because 'href' properties are computed
    const domLeads = await this.page!.evaluate(() => {
      const emails: string[] = [];
      const phones: string[] = [];

      document.querySelectorAll('a[href^="mailto:"]').forEach((el) => {
        const href = el.getAttribute("href");
        if (href) emails.push(href.replace("mailto:", ""));
      });

      document.querySelectorAll('a[href^="tel:"]').forEach((el) => {
        const href = el.getAttribute("href");
        if (href) phones.push(href.replace("tel:", ""));
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
    const socialLinks: string[] = [];
    // (Simple scan of bodyText is inaccurate for socials, usually better to scan 'a' tags)
    // We leave this as a basic filter on the 'links' array we already extracted.

    return {
      emails: [...new Set([...regexEmails, ...domLeads.emails])].map((e) =>
        e.toLowerCase()
      ),
      phones: [...new Set([...regexPhones, ...domLeads.phones])],
      socialLinks, // Populated by the parent method if needed, or logic added here
    };
  }
}
