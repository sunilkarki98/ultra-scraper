# How the Business Listing Service Works

## Overview
The Business Listing Service provides a **100% legal** way to find business information (name, address, phone, website) for any location and business type.

## Architecture

```
User Dashboard (Frontend)
    ↓
Backend API (/business/search)
    ↓
Business Data Client
    ↓
Business Data Service (Microservice - Port 8003)
    ↓
    ├─→ OpenStreetMap (OSM) Overpass API [FREE]
    └─→ Google Places API [PAID - requires key]
```

## Step-by-Step Workflow

### 1. User Input (Frontend)
User fills in the **Business Search Form**:
- **Business Type**: e.g., "Restaurants", "Hotels", "Hospitals"
- **Location**: e.g., "Kathmandu", "New York City"
- **Source**: Choose between:
  - **OpenStreetMap (Free)**: Open data, no API key needed
  - **Google Places**: Requires your own Google API key

### 2. Frontend → Backend
The form sends a POST request to:
```
POST /business/search
{
  "query": "Restaurants",
  "location": "Kathmandu",
  "source": "osm",
  "apiKey": "optional-for-google"
}
```

### 3. Backend → Microservice
The `BusinessController` receives the request and calls `BusinessDataClient`:

```typescript
businessClient.search("Restaurants", "Kathmandu", "osm")
```

The client makes an HTTP POST to the microservice:
```
POST http://localhost:8003/search
```

### 4. Microservice Processing

#### If source = "osm":
The `OSMScraper` queries the **Overpass API** with this query:

```overpassql
[out:json][timeout:25];
area["name"="Kathmandu"]->.searchArea;
(
  node[amenity=restaurant](area.searchArea);
  way[amenity=restaurant](area.searchArea);
);
out body;
```

This returns all publicly available OpenStreetMap data for restaurants in Kathmandu.

#### If source = "google":
The `GooglePlacesScraper` calls the **Google Places Text Search API**:

```
GET https://maps.googleapis.com/maps/api/place/textsearch/json
    ?query=Restaurants in Kathmandu
    &key=YOUR_API_KEY
```

### 5. Data Extraction
The scrapers extract:
- **Name**: Business name
- **Address**: Full address
- **Phone**: Contact number (better coverage with Google)
- **Website**: URL
- **Coordinates**: Latitude/Longitude

### 6. Response to Frontend
The microservice returns JSON:

```json
{
  "success": true,
  "data": [
    {
      "name": "Fire and Ice Pizzeria",
      "address": "Thamel, Kathmandu",
      "phone": "+977-1-4250210",
      "website": "https://fireandice.com.np",
      "latitude": 27.7172,
      "longitude": 85.3240,
      "source": "OpenStreetMap"
    },
    // ... more results
  ]
}
```

### 7. Display Results
The frontend displays results in a table with:
- Name
- Address
- Phone
- Website (clickable link)
- Export to CSV option

## Why This Is Legal

### OpenStreetMap (OSM)
- ✅ **Open Data License**: ODbL (Open Database License)
- ✅ **Explicitly allows commercial use**
- ✅ **No API key required**
- ✅ **No rate limits for moderate use**

### Google Places API
- ✅ **Official API from Google**
- ✅ **Paid service with clear Terms of Service**
- ✅ **100% compliant as long as you have a valid API key**

## Comparison: OSM vs Google

| Feature | OpenStreetMap | Google Places |
|---------|---------------|---------------|
| **Cost** | Free | Paid (~$17/1000 requests) |
| **Phone Numbers** | Limited | Excellent |
| **Addresses** | Good | Excellent |
| **Coverage** | Community-driven | Google's database |
| **API Key** | Not required | Required |
| **Legal** | ✅ 100% | ✅ 100% |

## Use Cases
1. **Lead Generation**: Find all hotels in a city for sales outreach
2. **Market Research**: Analyze restaurant density in an area
3. **Contact Discovery**: Get phone numbers for B2B prospecting
4. **Competitor Analysis**: List all competitors in your industry/location

## Running the Service

### Start the Microservice
```bash
cd business-data-service
pip install -r requirements.txt
python app.py
```

Service runs on: `http://localhost:8003`

### Test with cURL
```bash
curl -X POST http://localhost:8003/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Restaurants",
    "location": "Kathmandu",
    "source": "osm"
  }'
```

### Production Deployment
Add to `docker-compose.yml`:
```yaml
business-data:
  build: ./business-data-service
  ports:
    - "8003:8003"
  environment:
    - LOG_LEVEL=info
```
