"""
Scrapy Middlewares for Proxy Rotation and User-Agent Management
"""
import random
from scrapy import signals
from scrapy.downloadermiddlewares.httpproxy import HttpProxyMiddleware


class ProxyRotationMiddleware:
    """
    Rotates proxies for each request
    Proxies are injected via request meta or from environment
    """

    def __init__(self):
        self.proxies = []
        self.current_proxy_index = 0

    @classmethod
    def from_crawler(cls, crawler):
        middleware = cls()
        crawler.signals.connect(middleware.spider_opened, signal=signals.spider_opened)
        return middleware

    def spider_opened(self, spider):
        # Get proxies from spider settings or environment
        if hasattr(spider, 'proxies') and spider.proxies:
            self.proxies = spider.proxies
        elif hasattr(spider, 'proxy') and spider.proxy:
            self.proxies = [spider.proxy]

    def process_request(self, request, spider):
        # Check if proxy is already set in request meta
        if 'proxy' in request.meta:
            return None

        # Rotate proxy if available
        if self.proxies:
            proxy = self.proxies[self.current_proxy_index % len(self.proxies)]
            request.meta['proxy'] = proxy
            self.current_proxy_index += 1
            spider.logger.debug(f'Using proxy: {proxy}')

        return None


class RandomUserAgentMiddleware:
    """
    Rotates User-Agent headers to avoid detection
    """

    USER_AGENTS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ]

    def process_request(self, request, spider):
        # Use custom user agent if provided
        if hasattr(spider, 'user_agent') and spider.user_agent:
            request.headers['User-Agent'] = spider.user_agent
        else:
            # Random selection
            request.headers['User-Agent'] = random.choice(self.USER_AGENTS)
        return None
