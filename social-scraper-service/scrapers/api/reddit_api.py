import logging
import praw
from .. import BaseSocialScraper

logger = logging.getLogger(__name__)

class RedditApiScraper(BaseSocialScraper):
    async def scrape(self, url: str, options: dict = None):
        logger.info(f"Starting Reddit API scrape for {url}")
        
        client_id = options.get("client_id")
        client_secret = options.get("client_secret")
        user_agent = options.get("user_agent", "ultra-scraper:v1.0")

        if not client_id or not client_secret:
            raise ValueError("Missing client_id or client_secret for Reddit API")

        try:
            reddit = praw.Reddit(
                client_id=client_id,
                client_secret=client_secret,
                user_agent=user_agent
            )

            # Determine if URL is a post, subreddit, or user
            # Simple heuristic: check URL structure
            if "/comments/" in url:
                submission = reddit.submission(url=url)
                return {
                    "platform": "reddit",
                    "mode": "api",
                    "url": url,
                    "title": submission.title,
                    "content": submission.selftext,
                    "subreddit": submission.subreddit.display_name,
                    "score": submission.score,
                    "num_comments": submission.num_comments,
                    "author": str(submission.author),
                    "created_utc": submission.created_utc
                }
            elif "/r/" in url:
                # Subreddit scraping (top 5 hot posts)
                sub_name = url.split("/r/")[1].split("/")[0]
                subreddit = reddit.subreddit(sub_name)
                posts = []
                for post in subreddit.hot(limit=5):
                    posts.append({
                        "title": post.title,
                        "url": post.url,
                        "score": post.score
                    })
                return {
                    "platform": "reddit",
                    "mode": "api",
                    "url": url,
                    "subreddit": sub_name,
                    "posts": posts
                }
            else:
                 raise ValueError("Unsupported Reddit URL format for API")

        except Exception as e:
            logger.error(f"Reddit API scrape error: {str(e)}")
            raise e
