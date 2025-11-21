// universalScraper.ts
import { BrowserManager } from "../browser/playright";
import { logger } from "../utils/logger";
import { BrowserContext, Page} from "playwright";

export interface ScrapeOptions {
  url: string;
  waitForSelector?: string;
  maxContentLength?: number;
  maxLinks?: number;
  hydrationDelay?: number;
  proxy?: string;
  userAgent?: string;
  mobile?: boolean;
}

export interface LinkData {
  text: string;
  href: string;
}

export interface LeadData {
  emails: string[];
  phones: string[];
  socialLinks: string[];
}

export interface ScrapeResult {
  url: string;
  title: string;
  description: string;
  h1: string;
  content: string;
  links: LinkData[];
  leads: LeadData;
  botDetected: boolean;
}

export class UniversalScraper {
  async run(
    options: ScrapeOptions
  ): Promise<{ success: boolean; data?: ScrapeResult; error?: string }> {
    const {
      url,
      waitForSelector,
      maxContentLength = 5000,
      maxLinks = 50,
      hydrationDelay = 2000,
      proxy,
      userAgent,
      mobile,
    } = options;

    let context: BrowserContext | undefined;
    let page: Page | undefined;

    try {
      ({ context, page } = await BrowserManager.launchContext({
        proxy,
        userAgent,
        mobile,
      }));

      logger.info({ url }, "Navigating to page");

      // Navigation with soft timeout
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      } catch (e: any) {
        if (e.name === "TimeoutError") {
          logger.warn(
            { url },
            "⚠️ Navigation timed out, scraping available content..."
          );
        } else {
          throw e;
        }
      }

      // Optional selector wait + hydration
      if (waitForSelector) {
        await page
          .waitForSelector(waitForSelector, { timeout: 5000 })
          .catch(() => {
            logger.warn(
              { url, selector: waitForSelector },
              "Selector not found, proceeding..."
            );
          });
      }

      if (hydrationDelay > 0) await page.waitForTimeout(hydrationDelay);

      // Evaluate page content
      const data: ScrapeResult = await page.evaluate(
        ({
          maxContentLength,
          maxLinks,
        }: {
          maxContentLength: number;
          maxLinks: number;
        }) => {
          const clean = (txt: string | null | undefined) =>
            txt ? txt.replace(/\s+/g, " ").trim() : "";

          const getMeta = (name: string) =>
            document
              .querySelector(`meta[name="${name}"]`)
              ?.getAttribute("content") ||
            document
              .querySelector(`meta[property="og:${name}"]`)
              ?.getAttribute("content") ||
            document
              .querySelector(`meta[name="twitter:${name}"]`)
              ?.getAttribute("content") ||
            "";

          // Bot detection
          const botIndicators = document.querySelectorAll(
            ".captcha, .bot-detection, #recaptcha, .cookie-banner"
          );
          if (botIndicators.length > 0)
            return {
              url: window.location.href,
              title: "",
              description: "",
              h1: "",
              content: "",
              links: [],
              leads: { emails: [], phones: [], socialLinks: [] },
              botDetected: true,
            };

          // Cleanup
          const garbage = document.querySelectorAll(
            "script, style, noscript, iframe, nav, footer, .ad, .cookie-banner"
          );
          garbage.forEach((el) => el.remove());

          // Main content
          const bodyText = clean(document.body.innerText).slice(
            0,
            maxContentLength
          );

          // Links
          const links: LinkData[] = Array.from(document.querySelectorAll("a"))
            .map((a) => {
              const href = a.getAttribute("href");
              try {
                if (!href) return null;
                return {
                  text: clean(a.innerText),
                  href: new URL(href, window.location.href).href,
                };
              } catch {
                return null;
              }
            })
            .filter(
              (l): l is LinkData =>
                l !== null && l.href.startsWith("http") && l.text.length > 3
            )
            .slice(0, maxLinks);

          // Extract emails
          const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g;
          const emails = Array.from(
            new Set(
              (bodyText.match(emailRegex) || []).map((e) => e.toLowerCase())
            )
          );

          // Extract phone numbers (basic international + local formats)
          const phoneRegex =
            /(\+?\d{1,4}[-.\s]?)?(\(?\d{2,5}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/g;
          const phones = Array.from(new Set(bodyText.match(phoneRegex) || []));

          // Extract social links (Facebook, Instagram, LinkedIn, Twitter, TikTok)
          const socialDomains = [
            "facebook.com",
            "instagram.com",
            "linkedin.com",
            "twitter.com",
            "tiktok.com",
          ];
          const socialLinks = links
            .map((l) => l.href)
            .filter((href) =>
              socialDomains.some((domain) => href.includes(domain))
            );

          return {
            url: window.location.href,
            title: document.title || getMeta("title"),
            description: getMeta("description"),
            h1: clean(document.querySelector("h1")?.innerText),
            content: bodyText,
            links,
            leads: { emails, phones, socialLinks },
            botDetected: false,
          };
        },
        { maxContentLength, maxLinks } // Pass as single object
      );

      if (data.botDetected) throw new Error("Bot detection triggered.");
      if (!data.title && data.content.length < 50)
        throw new Error("Empty page content.");

      return { success: true, data };
    } catch (error: any) {
      logger.error({ url, err: error.message }, "Scraping Failed");
      return { success: false, error: error.message };
    } finally {
      if (context) await BrowserManager.closeContext(context);
    }
  }
}
