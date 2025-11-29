import logging
from playwright.async_api import async_playwright
from . import BaseSocialScraper

logger = logging.getLogger(__name__)

class QuoraScraper(BaseSocialScraper):
    async def scrape(self, url: str, options: dict = None):
        logger.info(f"Starting Quora scrape for {url}")
        
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
                
                # Quora is very dynamic and class names are obfuscated.
                # We rely on generic structure or JSON-LD if available.
                
                content = ""
                
                # Attempt to get the first answer or the question details
                try:
                    # Try to find JSON-LD which Quora often uses
                    json_ld = await page.evaluate(() => {
                        const script = document.querySelector('script[type="application/ld+json"]');
                        return script ? script.innerText : null;
                    });
                    
                    if (json_ld) {
                        import json
                        data = json.loads(json_ld)
                        if 'mainEntity' in data:
                            # It's a Q&A page
                            question = data['mainEntity']
                            content = f"Question: {question.get('name', '')}\n"
                            if 'acceptedAnswer' in question:
                                answer = question['acceptedAnswer']
                                content += f"Top Answer: {answer.get('text', '')}"
                            elif 'suggestedAnswer' in question:
                                # array of answers
                                answers = question['suggestedAnswer']
                                if isinstance(answers, list) and len(answers) > 0:
                                     content += f"Top Answer: {answers[0].get('text', '')}"
                    
                except Exception as e:
                    logger.warning(f"Quora JSON-LD extraction failed: {e}")

                if not content:
                     # Fallback to body text (messy but better than nothing)
                     content = await page.inner_text()
                     content = content[:2000] # Truncate

                return {
                    "platform": "quora",
                    "url": url,
                    "title": title,
                    "content": content,
                    "meta": {
                        "scraped_at": "now"
                    }
                }
                
            except Exception as e:
                logger.error(f"Quora scrape error: {str(e)}")
                raise e
            finally:
                await browser.close()
