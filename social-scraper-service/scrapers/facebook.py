import logging
from playwright.async_api import async_playwright
from . import BaseSocialScraper

logger = logging.getLogger(__name__)

class FacebookScraper(BaseSocialScraper):
    async def scrape(self, url: str, options: dict = None):
        logger.info(f"Starting Facebook scrape for {url}")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = await context.new_page()
            
            try:
                await page.goto(url, timeout=30000)
                await page.wait_for_load_state("domcontentloaded")
                
                # Check for login wall
                if "login" in page.url:
                    logger.warning("Hit Facebook Login Wall")
                    return {
                        "platform": "facebook",
                        "url": url,
                        "error": "Login Wall Detected",
                        "title": await page.title()
                    }

                title = await page.title()
                
                # Extract Page Name (h1 usually)
                page_name = ""
                try:
                    h1 = await page.query_selector("h1")
                    if h1:
                        page_name = await h1.inner_text()
                except:
                    pass

                # Extract some content (very fragile on FB)
                content = ""
                try:
                    # Try to get the first post text
                    post = await page.query_selector("div[data-ad-preview='message']")
                    if post:
                        content = await post.inner_text()
                except:
                    pass

                return {
                    "platform": "facebook",
                    "url": url,
                    "title": title,
                    "page_name": page_name,
                    "content": content,
                    "meta": {
                        "scraped_at": "now"
                    }
                }
                
            except Exception as e:
                logger.error(f"Facebook scrape error: {str(e)}")
                raise e
            finally:
                await browser.close()
