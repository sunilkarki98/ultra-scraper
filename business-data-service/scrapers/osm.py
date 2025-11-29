import logging
import requests
import json

logger = logging.getLogger(__name__)

class OSMScraper:
    def __init__(self):
        self.overpass_url = "http://overpass-api.de/api/interpreter"

    def search(self, query: str, location: str):
        logger.info(f"OSM Search: {query} in {location}")
        
        # 1. Construct Overpass QL Query
        # We assume 'query' maps to an amenity or shop type, but for now we'll try to be generic or default to common business types if query is vague.
        # However, the user prompt specifically asked for "restaurants".
        # Let's try to map the query to OSM tags.
        
        osm_tag = "amenity=restaurant" # Default
        if "cafe" in query.lower():
            osm_tag = "amenity=cafe"
        elif "hotel" in query.lower():
            osm_tag = "tourism=hotel"
        elif "hospital" in query.lower():
            osm_tag = "amenity=hospital"
        
        # Overpass Query: Find area by name, then find nodes with tag in that area
        overpass_query = f"""
        [out:json][timeout:25];
        area["name"="{location}"]->.searchArea;
        (
          node[{osm_tag}](area.searchArea);
          way[{osm_tag}](area.searchArea);
          relation[{osm_tag}](area.searchArea);
        );
        out body;
        >;
        out skel qt;
        """

        try:
            response = requests.get(self.overpass_url, params={'data': overpass_query})
            response.raise_for_status()
            data = response.json()
            
            results = []
            for element in data.get('elements', []):
                if 'tags' in element:
                    tags = element['tags']
                    name = tags.get('name')
                    if not name:
                        continue
                        
                    # Extract Address
                    address_parts = []
                    if 'addr:street' in tags: address_parts.append(tags['addr:street'])
                    if 'addr:housenumber' in tags: address_parts.append(tags['addr:housenumber'])
                    if 'addr:city' in tags: address_parts.append(tags['addr:city'])
                    
                    address = ", ".join(address_parts) if address_parts else "Address not available"
                    
                    # Extract Contact
                    phone = tags.get('phone') or tags.get('contact:phone')
                    website = tags.get('website') or tags.get('contact:website')
                    
                    results.append({
                        "name": name,
                        "address": address,
                        "phone": phone,
                        "website": website,
                        "latitude": element.get('lat'),
                        "longitude": element.get('lon'),
                        "source": "OpenStreetMap"
                    })
            
            return results

        except Exception as e:
            logger.error(f"OSM Search failed: {e}")
            raise e
