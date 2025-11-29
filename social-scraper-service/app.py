import os
import logging
from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel, HttpUrl
from typing import Optional, Dict, Any
from scrapers.twitter import TwitterScraper
from scrapers.linkedin import LinkedInScraper

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Social Media Scraper Service", version="1.0.0")

# Models
class ScrapeRequest(BaseModel):
    url: HttpUrl
    options: Optional[Dict[str, Any]] = {}

class ScrapeResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# Scraper Instances
twitter_scraper = TwitterScraper()
linkedin_scraper = LinkedInScraper()

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "social-scraper-service"}

# API Scrapers
from scrapers.api.reddit_api import RedditApiScraper
from scrapers.api.twitter_api import TwitterApiScraper

reddit_api_scraper = RedditApiScraper()
twitter_api_scraper = TwitterApiScraper()

@app.post("/scrape/twitter", response_model=ScrapeResponse)
async def scrape_twitter(request: ScrapeRequest):
    try:
        logger.info(f"Scraping Twitter URL: {request.url}")
        
        # Check for API Mode
        if request.options.get("mode") == "api":
            logger.info("Using Official Twitter API")
            data = await twitter_api_scraper.scrape(str(request.url), request.options)
        else:
            # Default to Scraper Mode
            data = await twitter_scraper.scrape(str(request.url), request.options)
            
        return {"success": True, "data": data}
    except Exception as e:
        logger.error(f"Twitter scrape failed: {str(e)}")
        return {"success": False, "error": str(e)}

@app.post("/scrape/reddit", response_model=ScrapeResponse)
async def scrape_reddit(request: ScrapeRequest):
    try:
        logger.info(f"Scraping Reddit URL: {request.url}")
        
        # Check for API Mode
        if request.options.get("mode") == "api":
            logger.info("Using Official Reddit API")
            data = await reddit_api_scraper.scrape(str(request.url), request.options)
        else:
            # Default to Scraper Mode
            data = await reddit_scraper.scrape(str(request.url), request.options)
            
        return {"success": True, "data": data}
    except Exception as e:
        logger.error(f"Reddit scrape failed: {str(e)}")
        return {"success": False, "error": str(e)}

@app.post("/scrape/linkedin", response_model=ScrapeResponse)
async def scrape_linkedin(request: ScrapeRequest):
    try:
        logger.info(f"Scraping LinkedIn URL: {request.url}")
        data = await linkedin_scraper.scrape(str(request.url), request.options)
        return {"success": True, "data": data}
    except Exception as e:
        logger.error(f"LinkedIn scrape failed: {str(e)}")
        return {"success": False, "error": str(e)}

# New Scrapers
from scrapers.reddit import RedditScraper
from scrapers.quora import QuoraScraper

reddit_scraper = RedditScraper()
quora_scraper = QuoraScraper()



@app.post("/scrape/quora", response_model=ScrapeResponse)
async def scrape_quora(request: ScrapeRequest):
    try:
        logger.info(f"Scraping Quora URL: {request.url}")
        data = await quora_scraper.scrape(str(request.url), request.options)
        return {"success": True, "data": data}
    except Exception as e:
        logger.error(f"Quora scrape failed: {str(e)}")
        return {"success": False, "error": str(e)}

# New Scrapers (FB, Insta, TikTok)
from scrapers.facebook import FacebookScraper
from scrapers.instagram import InstagramScraper
from scrapers.tiktok import TikTokScraper

facebook_scraper = FacebookScraper()
instagram_scraper = InstagramScraper()
tiktok_scraper = TikTokScraper()

@app.post("/scrape/facebook", response_model=ScrapeResponse)
async def scrape_facebook(request: ScrapeRequest):
    try:
        logger.info(f"Scraping Facebook URL: {request.url}")
        data = await facebook_scraper.scrape(str(request.url), request.options)
        return {"success": True, "data": data}
    except Exception as e:
        logger.error(f"Facebook scrape failed: {str(e)}")
        return {"success": False, "error": str(e)}

@app.post("/scrape/instagram", response_model=ScrapeResponse)
async def scrape_instagram(request: ScrapeRequest):
    try:
        logger.info(f"Scraping Instagram URL: {request.url}")
        data = await instagram_scraper.scrape(str(request.url), request.options)
        return {"success": True, "data": data}
    except Exception as e:
        logger.error(f"Instagram scrape failed: {str(e)}")
        return {"success": False, "error": str(e)}

@app.post("/scrape/tiktok", response_model=ScrapeResponse)
async def scrape_tiktok(request: ScrapeRequest):
    try:
        logger.info(f"Scraping TikTok URL: {request.url}")
        data = await tiktok_scraper.scrape(str(request.url), request.options)
        return {"success": True, "data": data}
    except Exception as e:
        logger.error(f"TikTok scrape failed: {str(e)}")
        return {"success": False, "error": str(e)}

# Telegram Scraper
# Telegram Scraper
from scrapers.telegram import TelegramScraper
from scrapers.telegram_api import TelegramApiScraper

telegram_scraper = TelegramScraper()
telegram_api_scraper = TelegramApiScraper()

@app.post("/scrape/telegram", response_model=ScrapeResponse)
async def scrape_telegram(request: ScrapeRequest):
    try:
        logger.info(f"Scraping Telegram URL: {request.url}")
        
        # Check for API Mode
        if request.options.get("mode") == "api":
            logger.info("Using Official Telegram API (Telethon)")
            data = await telegram_api_scraper.scrape(str(request.url), request.options)
        else:
            # Default to Web Scraper Mode
            data = await telegram_scraper.scrape(str(request.url), request.options)
            
        return {"success": True, "data": data}
    except Exception as e:
        logger.error(f"Telegram scrape failed: {str(e)}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
