# Ultra-Scraper Scrapy Service

Fast, lightweight web scraping service powered by Scrapy for static HTML websites.

## Features

- ⚡ **High Performance**: 10-100x faster than browser automation for static sites
- 🔄 **Proxy Rotation**: Built-in proxy support with automatic rotation
- 🎭 **User-Agent Randomization**: Avoid detection with rotating user agents
- 📊 **Structured Data**: Automatic JSON-LD extraction
- 📧 **Lead Generation**: Email, phone, and social media extraction
- 🐳 **Docker Ready**: Containerized for easy deployment

## Quick Start

### Local Development

1. **Install dependencies**:
```bash
pip install -r requirements.txt
```

2. **Run the service**:
```bash
uvicorn app:app --reload --port 8001
```

3. **Test the service**:
```bash
curl http://localhost:8001/health
```

### Docker Deployment

1. **Build the image**:
```bash
docker build -t ultra-scraper-scrapy .
```

2. **Run the container**:
```bash
docker run -d -p 8001:8001 --name scrapy-service ultra-scraper-scrapy
```

## API Endpoints

### POST /scrape
Trigger a scrape job

**Request**:
```json
{
  "url": "https://example.com",
  "proxy": "http://user:pass@proxy.com:8080",
  "userAgent": "Custom User Agent",
  "ignoreRobotsTxt": false,
  "maxContentLength": 20000
}
```

**Response**:
```json
{
  "jobId": "uuid-here",
  "status": "pending",
  "message": "Scrape job created. Check status at /job/{jobId}"
}
```

### GET /job/{jobId}
Get job status and results

**Response**:
```json
{
  "jobId": "uuid-here",
  "status": "completed",
  "result": {
    "url": "https://example.com",
    "title": "Example Domain",
    "description": "Example site description",
    "h1": "Main Heading",
    "content": "Page content...",
    "links": ["https://..."],
    "jsonLd": [...],
    "leads": {
      "emails": ["info@example.com"],
      "phones": ["+1234567890"],
      "socialLinks": ["https://twitter.com/example"]
    }
  },
  "createdAt": "2025-11-29T08:00:00Z",
  "completedAt": "2025-11-29T08:00:05Z"
}
```

### GET /health
Health check endpoint

### GET /stats
Service statistics

## Configuration

Edit `settings.py` to customize Scrapy behavior:

- `CONCURRENT_REQUESTS`: Number of concurrent requests (default: 16)
- `DOWNLOAD_DELAY`: Delay between requests (default: 0.5s)
- `ROBOTSTXT_OBEY`: Respect robots.txt (default: True)
- `DOWNLOAD_TIMEOUT`: Request timeout (default: 30s)

## Architecture

```
scrapy-service/
├── app.py                 # FastAPI server
├── settings.py            # Scrapy configuration
├── middlewares.py         # Proxy & User-Agent rotation
├── pipelines.py          # Data processing
├── spiders/
│   └── generic_spider.py # Universal scraper
├── requirements.txt
└── Dockerfile
```

## Performance

- **Static Sites**: 100-1000 pages/minute
- **Memory Usage**: ~50MB per 1000 pages
- **CPU Usage**: Low (async I/O)

## Limitations

- ❌ No JavaScript execution (use Playwright for JS-heavy sites)
- ❌ No screenshot capability
- ✅ Best for static HTML content

## Integration with Ultra-Scraper

This service is designed to work alongside the main Ultra-Scraper NestJS backend. The backend will automatically route simple static sites to this service for faster processing.

## License

Part of the Ultra-Scraper project.
