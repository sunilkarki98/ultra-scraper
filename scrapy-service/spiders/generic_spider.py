"""
Generic Spider for Universal Web Scraping
Extracts common data from static HTML websites
"""
import scrapy
from typing import Dict, Any, List
import json


class GenericSpider(scrapy.Spider):
    """
    Universal spider that extracts common data from any website
    Can be configured with custom selectors via spider arguments
    """
    name = 'generic'
    
    # Custom settings per spider
    custom_settings = {
        'ROBOTSTXT_OBEY': True,
        'DOWNLOAD_DELAY': 0.5,
    }

    def __init__(self, url: str = None, proxy: str = None, user_agent: str = None, 
                 ignore_robots: bool = False, max_content_length: int = 20000, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        self.start_urls = [url] if url else []
        self.proxy = proxy
        self.user_agent = user_agent
        self.max_content_length = max_content_length
        
        # Override robots.txt setting if requested
        if ignore_robots:
            self.custom_settings['ROBOTSTXT_OBEY'] = False

    def start_requests(self):
        """Generate initial requests with custom settings"""
        for url in self.start_urls:
            yield scrapy.Request(
                url=url,
                callback=self.parse,
                errback=self.errback_handler,
                dont_filter=True,
            )

    def parse(self, response):
        """
        Main parsing logic - extracts standard data from page
        """
        # Extract title
        title = self._extract_title(response)
        
        # Extract description
        description = self._extract_description(response)
        
        # Extract H1 tags
        h1 = self._extract_h1(response)
        
        # Extract main content
        content = self._extract_content(response)
        
        # Extract links
        links = self._extract_links(response)
        
        # Extract JSON-LD structured data
        json_ld = self._extract_json_ld(response)
        
        # Extract lead data (emails, phones, social links)
        leads = self._extract_leads(response, content)
        
        # Yield the scraped item
        yield {
            'url': response.url,
            'title': title,
            'description': description,
            'h1': h1,
            'content': content[:self.max_content_length] if content else '',
            'links': links,
            'jsonLd': json_ld,
            'leads': leads,
        }

    def _extract_title(self, response) -> str:
        """Extract page title"""
        title = response.css('title::text').get()
        if not title:
            title = response.xpath('//meta[@property="og:title"]/@content').get()
        return title.strip() if title else ''

    def _extract_description(self, response) -> str:
        """Extract meta description"""
        description = response.xpath('//meta[@name="description"]/@content').get()
        if not description:
            description = response.xpath('//meta[@property="og:description"]/@content').get()
        return description.strip() if description else ''

    def _extract_h1(self, response) -> str:
        """Extract first H1 tag"""
        h1 = response.css('h1::text').get()
        return h1.strip() if h1 else ''

    def _extract_content(self, response) -> str:
        """
        Extract main text content from page
        Tries to find main content area, falls back to body text
        """
        # Try common content selectors
        content_selectors = [
            'main ::text',
            'article ::text',
            '[role="main"] ::text',
            '.content ::text',
            '#content ::text',
            'body ::text',
        ]
        
        for selector in content_selectors:
            texts = response.css(selector).getall()
            if texts:
                # Join and clean text
                content = ' '.join(text.strip() for text in texts if text.strip())
                if len(content) > 100:  # Ensure we got substantial content
                    return content
        
        # Fallback: get all text
        texts = response.xpath('//body//text()').getall()
        content = ' '.join(text.strip() for text in texts if text.strip())
        return content

    def _extract_links(self, response) -> List[str]:
        """Extract all links from page"""
        links = response.css('a::attr(href)').getall()
        # Convert relative URLs to absolute
        absolute_links = [response.urljoin(link) for link in links]
        # Remove duplicates and empty links
        unique_links = list(set(link for link in absolute_links if link))
        return unique_links[:100]  # Limit to 100 links

    def _extract_json_ld(self, response) -> List[Dict[str, Any]]:
        """Extract JSON-LD structured data"""
        json_ld_scripts = response.xpath('//script[@type="application/ld+json"]/text()').getall()
        json_ld_data = []
        
        for script in json_ld_scripts:
            try:
                data = json.loads(script)
                json_ld_data.append(data)
            except json.JSONDecodeError:
                self.logger.warning(f'Failed to parse JSON-LD: {script[:100]}')
                continue
        
        return json_ld_data

    def _extract_leads(self, response, content: str) -> Dict[str, List[str]]:
        """
        Extract lead generation data (emails, phones, social links)
        Note: Email/phone extraction is done in pipeline to avoid duplication
        """
        # Extract social media links
        social_links = []
        social_domains = [
            'facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com',
            'youtube.com', 'tiktok.com', 'pinterest.com', 'github.com'
        ]
        
        all_links = response.css('a::attr(href)').getall()
        for link in all_links:
            if any(domain in link for domain in social_domains):
                social_links.append(link)
        
        return {
            'emails': [],  # Extracted in pipeline
            'phones': [],  # Extracted in pipeline
            'socialLinks': list(set(social_links)),
        }

    def errback_handler(self, failure):
        """Handle request failures"""
        self.logger.error(f'Request failed: {failure.request.url}')
        self.logger.error(f'Error: {failure.value}')
        
        # Yield error result
        yield {
            'url': failure.request.url,
            'error': str(failure.value),
            'success': False,
        }
