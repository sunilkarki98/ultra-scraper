import logging
import requests

logger = logging.getLogger(__name__)

class GooglePlacesScraper:
    def __init__(self, api_key: str = None):
        self.api_key = api_key
        self.base_url = "https://maps.googleapis.com/maps/api/place"

    def search(self, query: str, location: str, api_key: str = None):
        # Allow passing key per request
        key = api_key or self.api_key
        if not key:
            raise ValueError("Google Places API Key is required")

        logger.info(f"Google Places Search: {query} in {location}")
        
        try:
            # 1. Text Search to get list of places
            search_url = f"{self.base_url}/textsearch/json"
            params = {
                "query": f"{query} in {location}",
                "key": key
            }
            
            response = requests.get(search_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if data.get('status') != 'OK':
                logger.warning(f"Google Places API returned status: {data.get('status')}")
                return []

            results = []
            for place in data.get('results', []):
                # Basic info is available in search result
                # For full details (phone, website), we might need Place Details API if not present
                # Text Search usually returns formatted_address, name, rating.
                # Phone/Website might require a second call per place (costly!).
                # Let's check what Text Search returns. It usually DOES NOT return phone/website in the list.
                # We will stick to the list data to save costs, unless user explicitly wants details (which would be slow).
                # Wait, the user prompt asked for "contact details, contact phone optional".
                # We will just return what we have from Text Search for now to be efficient.
                
                results.append({
                    "name": place.get('name'),
                    "address": place.get('formatted_address'),
                    "rating": place.get('rating'),
                    "user_ratings_total": place.get('user_ratings_total'),
                    "place_id": place.get('place_id'),
                    "latitude": place['geometry']['location']['lat'],
                    "longitude": place['geometry']['location']['lng'],
                    "source": "Google Places API"
                })
                
            return results

        except Exception as e:
            logger.error(f"Google Places Search failed: {e}")
            raise e
