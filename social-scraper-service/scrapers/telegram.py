import logging
from playwright.async_api import async_playwright
from . import BaseSocialScraper

logger = logging.getLogger(__name__)

class TelegramScraper(BaseSocialScraper):
    async def scrape(self, url: str, options: dict = None):
        logger.info(f"Starting Telegram scrape for {url}")
        
        # Ensure we are using the /s/ (preview) URL for channels if possible
        # t.me/channelname -> t.me/s/channelname
        target_url = url
        if "t.me/" in url and "/s/" not in url and "t.me/+" not in url:
             parts = url.split("t.me/")
             if len(parts) > 1:
                 # Check if it's a post link (has another slash)
                 if "/" in parts[1]:
                     # It's a post link, e.g. t.me/durov/123. These usually open in a preview window anyway.
                     pass 
                 else:
                     # It's a channel link, e.g. t.me/durov. Convert to preview.
                     target_url = f"https://t.me/s/{parts[1]}"
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = await context.new_page()
            
            try:
                await page.goto(target_url, timeout=30000)
                await page.wait_for_load_state("domcontentloaded")
                
                title = await page.title()
                
                content = ""
                
                # Extract Channel Info
                try:
                    description = await page.query_selector(".tgme_channel_info_description")
                    if description:
                        content += f"Channel Description: {await description.inner_text()}\n\n"
                except:
                    pass

                # Extract Recent Posts (from preview page)
                try:
                    posts = await page.query_selector_all(".tgme_widget_message_text")
                    if posts:
                        content += "Recent Posts:\n"
                        for i, post in enumerate(posts[:5]): # Get last 5 posts
                            text = await post.inner_text()
                            content += f"--- Post {i+1} ---\n{text}\n\n"
                except:
                    pass

                return {
                    "platform": "telegram",
                    "url": url,
                    "target_url": target_url,
                    "title": title,
                    "content": content,
                    "meta": {
                        "scraped_at": "now"
                    }
                }
                
            except Exception as e:
                logger.error(f"Telegram scrape error: {str(e)}")
                raise e
            finally:
                await browser.close()
