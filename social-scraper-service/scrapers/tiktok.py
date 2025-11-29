import logging
from playwright.async_api import async_playwright
from . import BaseSocialScraper

logger = logging.getLogger(__name__)

class TikTokScraper(BaseSocialScraper):
    async def scrape(self, url: str, options: dict = None):
        logger.info(f"Starting TikTok scrape for {url}")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = await context.new_page()
            
            try:
                await page.goto(url, timeout=30000)
                await page.wait_for_load_state("domcontentloaded")
                
                title = await page.title()
                
                # Extract Description / Bio
                content = ""
                try:
                    # Generic meta description fallback
                    meta = await page.query_selector('meta[name="description"]')
                    if meta:
                        content = await meta.get_attribute("content")
                except:
                    pass

                return {
                    "platform": "tiktok",
                    "url": url,
                    "title": title,
                    "content": content,
                    "meta": {
                        "scraped_at": "now"
                    }
                }
                
            except Exception as e:
                logger.error(f"TikTok scrape error: {str(e)}")
                raise e
            finally:
                await browser.close()
