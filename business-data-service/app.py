import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from scrapers.osm import OSMScraper
from scrapers.google_places import GooglePlacesScraper

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Business Data Service", version="1.0.0")

# Models
class SearchRequest(BaseModel):
    query: str
    location: str
    source: str = "osm" # osm or google
    api_key: Optional[str] = None # For Google

class BusinessResult(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    rating: Optional[float] = None
    source: str

class SearchResponse(BaseModel):
    success: bool
    data: List[BusinessResult] = []
    error: Optional[str] = None

# Scraper Instances
osm_scraper = OSMScraper()
google_scraper = GooglePlacesScraper()

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "business-data-service"}

@app.post("/search", response_model=SearchResponse)
async def search_business(request: SearchRequest):
    try:
        logger.info(f"Searching: {request.query} in {request.location} via {request.source}")
        
        results = []
        if request.source == "osm":
            results = osm_scraper.search(request.query, request.location)
        elif request.source == "google":
            results = google_scraper.search(request.query, request.location, request.api_key)
        else:
            return {"success": False, "error": "Invalid source. Use 'osm' or 'google'."}
            
        return {"success": True, "data": results}
        
    except Exception as e:
        logger.error(f"Search failed: {str(e)}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
