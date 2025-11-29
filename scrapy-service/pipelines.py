"""
Scrapy Item Pipelines for Data Processing and Validation
"""
import re
from typing import Any, Dict


class DataValidationPipeline:
    """
    Validates scraped data before passing to next pipeline
    """

    def process_item(self, item: Dict[str, Any], spider) -> Dict[str, Any]:
        # Ensure required fields exist
        if not item.get('url'):
            spider.logger.warning('Item missing URL field')
            item['url'] = ''

        # Clean empty values
        for key, value in item.items():
            if value is None:
                item[key] = ''

        return item


class DataTransformPipeline:
    """
    Transforms and normalizes scraped data to match Ultra-Scraper schema
    """

    def process_item(self, item: Dict[str, Any], spider) -> Dict[str, Any]:
        # Normalize URLs in links
        if 'links' in item and isinstance(item['links'], list):
            item['links'] = [self._normalize_url(link) for link in item['links']]

        # Extract emails from content if not already extracted
        if 'content' in item and 'leads' in item:
            if 'emails' not in item['leads'] or not item['leads']['emails']:
                emails = self._extract_emails(item['content'])
                if 'leads' not in item:
                    item['leads'] = {}
                item['leads']['emails'] = emails

            # Extract phones
            if 'phones' not in item['leads'] or not item['leads']['phones']:
                phones = self._extract_phones(item['content'])
                item['leads']['phones'] = phones

        # Ensure all expected fields exist
        item.setdefault('title', '')
        item.setdefault('description', '')
        item.setdefault('h1', '')
        item.setdefault('content', '')
        item.setdefault('links', [])
        item.setdefault('leads', {'emails': [], 'phones': [], 'socialLinks': []})
        item.setdefault('jsonLd', [])

        return item

    def _normalize_url(self, url: str) -> str:
        """Normalize URL format"""
        if isinstance(url, str):
            return url.strip()
        return ''

    def _extract_emails(self, text: str) -> list:
        """Extract email addresses from text"""
        if not text:
            return []
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        return list(set(emails))  # Remove duplicates

    def _extract_phones(self, text: str) -> list:
        """Extract phone numbers from text"""
        if not text:
            return []
        # Simple phone pattern (can be enhanced)
        phone_pattern = r'[\+\(]?[1-9][0-9 .\-\(\)]{8,}[0-9]'
        phones = re.findall(phone_pattern, text)
        # Clean up phone numbers
        cleaned_phones = [re.sub(r'[^\d+]', '', phone) for phone in phones]
        # Filter valid phones (at least 10 digits)
        valid_phones = [p for p in cleaned_phones if len(p) >= 10]
        return list(set(valid_phones))
