import logging
import tweepy
from .. import BaseSocialScraper

logger = logging.getLogger(__name__)

class TwitterApiScraper(BaseSocialScraper):
    async def scrape(self, url: str, options: dict = None):
        logger.info(f"Starting Twitter API scrape for {url}")
        
        bearer_token = options.get("bearer_token")
        
        if not bearer_token:
             # Fallback to API Key/Secret if provided (for OAuth 1.1, but Bearer is standard for v2)
             consumer_key = options.get("api_key")
             consumer_secret = options.get("api_secret")
             if not consumer_key or not consumer_secret:
                 raise ValueError("Missing bearer_token or api_key/secret for Twitter API")

        try:
            client = tweepy.Client(bearer_token=bearer_token)

            # Extract Tweet ID from URL
            # https://twitter.com/user/status/1234567890
            tweet_id = None
            if "status/" in url:
                tweet_id = url.split("status/")[1].split("?")[0].split("/")[0]
            
            if tweet_id:
                response = client.get_tweet(tweet_id, tweet_fields=["created_at", "public_metrics", "author_id"])
                tweet = response.data
                
                if not tweet:
                    raise ValueError("Tweet not found or accessible")

                return {
                    "platform": "twitter",
                    "mode": "api",
                    "url": url,
                    "content": tweet.text,
                    "created_at": str(tweet.created_at),
                    "metrics": tweet.public_metrics,
                    "author_id": tweet.author_id
                }
            else:
                 # Could implement User lookup here
                 raise ValueError("Unsupported Twitter URL format for API (only single tweets supported)")

        except Exception as e:
            logger.error(f"Twitter API scrape error: {str(e)}")
            raise e
