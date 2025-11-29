from telethon.sync import TelegramClient
from telethon.tl.functions.channels import GetFullChannelRequest
from telethon.tl.types import MessageMediaPhoto, MessageMediaDocument
from telethon.errors import SessionPasswordNeededError
import os
import logging
import re

logger = logging.getLogger(__name__)

class TelegramApiScraper:
    """
    Telegram scraper using official Telethon API
    Provides full access to channel data, message history, and media
    """
    
    def __init__(self):
        # API credentials from environment
        self.api_id = os.getenv('TELEGRAM_API_ID')
        self.api_hash = os.getenv('TELEGRAM_API_HASH')
        
        if not self.api_id or not self.api_hash:
            logger.warning("Telegram API credentials not configured. API mode will not work.")
            logger.warning("Get credentials from https://my.telegram.org/apps")
        
        self.session_name = os.getenv('TELEGRAM_SESSION_NAME', 'telegram_scraper_bot')
    
    def extract_username(self, url: str) -> str:
        """
        Extract username/channel ID from Telegram URL
        Supports: t.me/username, t.me/s/username, t.me/+invite_code
        """
        # Remove protocol and www
        clean_url = url.replace('https://', '').replace('http://', '').replace('www.', '')
        
        # Handle different URL formats
        if '/s/' in clean_url:
            # t.me/s/username or t.me/s/username/123 (post)
            match = re.search(r't\.me/s/([^/]+)', clean_url)
            if match:
                return match.group(1)
        elif '/+' in clean_url or 'joinchat/' in clean_url:
            # Private invite link
            return clean_url.split('t.me/')[-1]
        else:
            # t.me/username or t.me/username/123
            match = re.search(r't\.me/([^/]+)', clean_url)
            if match:
                return match.group(1)
        
        raise ValueError(f"Invalid Telegram URL: {url}")
    
    def parse_reactions(self, reactions):
        """Parse message reactions"""
        if not reactions:
            return []
        
        result = []
        for reaction in reactions.results:
            result.append({
                'emoji': reaction.reaction.emoticon if hasattr(reaction.reaction, 'emoticon') else str(reaction.reaction),
                'count': reaction.count
            })
        return result
    
    def parse_media(self, media):
        """Parse media information"""
        if not media:
            return None
        
        if isinstance(media, MessageMediaPhoto):
            return {
                'type': 'photo',
                'has_spoiler': hasattr(media, 'spoiler') and media.spoiler
            }
        elif isinstance(media, MessageMediaDocument):
            return {
                'type': 'document',
                'mime_type': media.document.mime_type if hasattr(media.document, 'mime_type') else None,
                'size': media.document.size if hasattr(media.document, 'size') else None
            }
        else:
            return {
                'type': type(media).__name__
            }
    
    async def scrape(self, url: str, options: dict = None):
        """
        Scrape Telegram channel using official API
        
        Args:
            url: Telegram channel URL
            options: {
                'limit': Number of messages to fetch (default: 100)
                'phone': Phone number for authentication (optional)
                'password': 2FA password if enabled (optional)
                'download_media': Whether to download media (default: False)
            }
        
        Returns:
            dict: Comprehensive channel and message data
        """
        if not self.api_id or not self.api_hash:
            raise ValueError("Telegram API credentials not configured. Set TELEGRAM_API_ID and TELEGRAM_API_HASH environment variables.")
        
        logger.info(f"Starting Telegram API scrape for {url}")
        
        options = options or {}
        username = self.extract_username(url)
        limit = options.get('limit', 100)
        phone = options.get('phone')
        password = options.get('password')
        
        try:
            async with TelegramClient(self.session_name, self.api_id, self.api_hash) as client:
                # Authenticate if phone provided
                if phone:
                    logger.info("Authenticating with phone number")
                    await client.start(phone=phone)
                    
                    # Handle 2FA if needed
                    if password:
                        try:
                            await client.sign_in(password=password)
                        except SessionPasswordNeededError:
                            logger.error("2FA password required but incorrect")
                            raise
                else:
                    # Use bot mode or try to access public channel without auth
                    await client.start()
                
                # Get channel entity
                logger.info(f"Fetching channel: {username}")
                entity = await client.get_entity(username)
                
                # Get full channel information
                try:
                    full_channel = await client(GetFullChannelRequest(entity))
                    channel_info = {
                        'id': entity.id,
                        'username': entity.username,
                        'title': entity.title,
                        'participants_count': full_channel.full_chat.participants_count,
                        'about': full_channel.full_chat.about,
                        'verified': entity.verified if hasattr(entity, 'verified') else False,
                        'restricted': entity.restricted if hasattr(entity, 'restricted') else False,
                        'scam': entity.scam if hasattr(entity, 'scam') else False,
                        'fake': entity.fake if hasattr(entity, 'fake') else False,
                    }
                except Exception as e:
                    logger.warning(f"Could not fetch full channel info: {e}")
                    channel_info = {
                        'id': entity.id,
                        'username': entity.username if hasattr(entity, 'username') else None,
                        'title': entity.title
                    }
                
                # Extract messages
                logger.info(f"Fetching up to {limit} messages")
                messages = []
                
                async for message in client.iter_messages(entity, limit=limit):
                    message_data = {
                        'id': message.id,
                        'date': message.date.isoformat() if message.date else None,
                        'text': message.text or '',
                        'views': message.views or 0,
                        'forwards': message.forwards or 0,
                        'replies': message.replies.replies if message.replies else 0,
                        'reactions': self.parse_reactions(message.reactions),
                        'media': self.parse_media(message.media),
                        'edit_date': message.edit_date.isoformat() if message.edit_date else None,
                        'pinned': message.pinned,
                        'from_id': message.from_id.user_id if message.from_id and hasattr(message.from_id, 'user_id') else None,
                    }
                    
                    messages.append(message_data)
                
                logger.info(f"Successfully fetched {len(messages)} messages")
                
                return {
                    'platform': 'telegram',
                    'mode': 'api',
                    'url': url,
                    'channel': channel_info,
                    'messages': messages,
                    'total_messages': len(messages),
                    'meta': {
                        'api_used': 'telethon',
                        'authenticated': bool(phone)
                    }
                }
        
        except Exception as e:
            logger.error(f"Telegram API scrape failed: {str(e)}")
            raise Exception(f"Telegram API scraping failed: {str(e)}")
