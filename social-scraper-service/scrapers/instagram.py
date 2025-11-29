import logging
from playwright.async_api import async_playwright
from . import BaseSocialScraper

logger = logging.getLogger(__name__)

class InstagramScraper(BaseSocialScraper):
    async def scrape(self, url: str, options: dict = None):
        logger.info(f"Starting Instagram scrape for {url}")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = await context.new_page()
            
            try:
                await page.goto(url, timeout=30000)
                await page.wait_for_load_state("domcontentloaded")
                
                if "login" in page.url:
                     logger.warning("Hit Instagram Login Wall")
                     return {
                        "platform": "instagram",
                        "url": url,
                        "error": "Login Wall Detected",
                        "title": await page.title()
                    }

                title = await page.title()
                
                # Try to get meta description which often contains follower count
                meta_desc = ""
                try:
                    meta = await page.query_selector('meta[name="description"]')
                    if meta:
                        meta_desc = await meta.get_attribute("content")
                except:
                    pass

                return {
                    "platform": "instagram",
                    "url": url,
                    "title": title,
                    "content": meta_desc, # Often contains "X Followers, Y Following, Z Posts"
                    "meta": {
                        "scraped_at": "now"
                    }
                }
                
            except Exception as e:
                logger.error(f"Instagram scrape error: {str(e)}")
                raise e
            finally:
                await browser.close()
