class BaseSocialScraper:
    async def scrape(self, url: str, options: dict = None):
        raise NotImplementedError("Subclasses must implement scrape method")
