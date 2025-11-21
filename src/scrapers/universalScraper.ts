import { BrowserManager } from "../browser/playright";
import { logger } from "../utils/logger";

export class UniversalScraper {
  async run(url: string) {
    // ❌ OLD: const browser = await BrowserManager.getBrowser();

    // ✅ NEW: Get a ready-to-use Page and Context directly
    const { context, page } = await BrowserManager.launchContext();

    try {
      logger.info(`Navigate to: ${url}`);

      // 1. Go to URL
      // waitUntil: 'domcontentloaded' is faster than 'networkidle'
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

      // 2. Extract Data inside the browser
      const data = await page.evaluate(() => {
        const getMeta = (name: string) =>
          document
            .querySelector(`meta[name="${name}"]`)
            ?.getAttribute("content") || "";
        const clean = (txt: string | undefined | null) =>
          txt ? txt.replace(/\s+/g, " ").trim() : "";

        return {
          url: window.location.href,
          title: document.title,
          description: getMeta("description") || getMeta("og:description"),
          h1: clean(document.querySelector("h1")?.innerText),
          // Get first 3000 chars of text content
          content: clean(document.body.innerText).slice(0, 3000),
          // Get top 50 valid links
          links: Array.from(document.querySelectorAll("a"))
            .map((a) => ({ text: clean(a.innerText), href: a.href }))
            .filter((l) => l.href.startsWith("http") && l.text.length > 0)
            .slice(0, 50),
        };
      });

      // 3. Cleanup
      // We don't close the 'browser', we just close this specific 'context' (tab)
      await BrowserManager.closeContext(context);

      return { success: true, data };
    } catch (error: any) {
      // Ensure we close the context even if errors happen to save RAM
      if (context) await BrowserManager.closeContext(context);

      logger.error(
        { url, err: error.message },
        "Scraping failed inside Playwright"
      );
      throw error;
    }
  }
}
