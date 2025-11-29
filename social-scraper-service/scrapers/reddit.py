import logging
from playwright.async_api import async_playwright
from . import BaseSocialScraper

logger = logging.getLogger(__name__)

class RedditScraper(BaseSocialScraper):
    async def scrape(self, url: str, options: dict = None):
        logger.info(f"Starting Reddit scrape for {url}")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = await context.new_page()
            
            try:
                await page.goto(url, timeout=30000)
                await page.wait_for_load_state("domcontentloaded")
                
                # Handle "Click to see NSFW" or similar popups if possible, but keeping it simple for now
                
                title = await page.title()
                
                # Extract Post Content
                content = ""
                try:
                    # Try to find the main post content. Selectors vary by layout (shreddit vs old)
                    # This targets the modern "shreddit" layout often seen
                    post_content = await page.query_selector("shreddit-post")
                    if post_content:
                         # Sometimes content is in a specific attribute or inner text
                         content = await post_content.inner_text()
                    else:
                        # Fallback for older layouts
                        content_div = await page.query_selector("div[data-test-id='post-content']")
                        if content_div:
                            content = await content_div.inner_text()
                except Exception as e:
                    logger.warning(f"Failed to extract reddit content: {e}")

                # Extract Subreddit
                subreddit = ""
                try:
                    if "reddit.com/r/" in url:
                        parts = url.split("/r/")
                        if len(parts) > 1:
                            subreddit = parts[1].split("/")[0]
                except:
                    pass

                return {
                    "platform": "reddit",
                    "url": url,
                    "title": title,
                    "content": content,
                    "subreddit": subreddit,
                    "meta": {
                        "scraped_at": "now"
                    }
                }
                
            except Exception as e:
                logger.error(f"Reddit scrape error: {str(e)}")
                raise e
            finally:
                await browser.close()
