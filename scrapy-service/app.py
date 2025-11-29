"""
FastAPI App for Scrapy Microservice
Provides HTTP API endpoints to trigger Scrapy spiders
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional, Dict, Any, List
import asyncio
import uuid
import logging
from datetime import datetime
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
from multiprocessing import Process, Queue
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Ultra-Scraper Scrapy Service",
    description="High-performance static site scraping with Scrapy",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory job storage (in production, use Redis or database)
jobs_db: Dict[str, Dict[str, Any]] = {}


# Request/Response Models
class ScrapeRequest(BaseModel):
    url: HttpUrl
    proxy: Optional[str] = None
    userAgent: Optional[str] = None
    ignoreRobotsTxt: Optional[bool] = False
    maxContentLength: Optional[int] = 20000


class ScrapeResponse(BaseModel):
    jobId: str
    status: str
    message: str


class JobStatusResponse(BaseModel):
    jobId: str
    status: str  # pending, running, completed, failed
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    createdAt: str
    completedAt: Optional[str] = None


# Helper function to run spider in separate process
def run_spider(url: str, options: Dict[str, Any], result_queue: Queue):
    """
    Run Scrapy spider in a separate process
    This is necessary because Scrapy's Twisted reactor can only run once per process
    """
    try:
        from spiders.generic_spider import GenericSpider
        from scrapy.crawler import CrawlerRunner
        from twisted.internet import reactor
        from scrapy.utils.log import configure_logging
        
        # Configure Scrapy logging
        configure_logging({'LOG_LEVEL': 'INFO'})
        
        # Get Scrapy settings
        settings = get_project_settings()
        
        # Create crawler
        runner = CrawlerRunner(settings)
        
        # Storage for scraped items
        scraped_items = []
        
        def item_scraped(item, response, spider):
            """Callback when item is scraped"""
            scraped_items.append(dict(item))
        
        # Create crawler with callbacks
        crawler = runner.create_crawler(GenericSpider)
        crawler.signals.connect(item_scraped, signal=scrapy.signals.item_scraped)
        
        # Start crawling
        deferred = runner.crawl(
            crawler,
            url=str(url),
            proxy=options.get('proxy'),
            user_agent=options.get('userAgent'),
            ignore_robots=options.get('ignoreRobotsTxt', False),
            max_content_length=options.get('maxContentLength', 20000),
        )
        
        # Add callback for when crawl is done
        def crawl_done(_):
            """Called when crawl completes"""
            if scraped_items:
                result_queue.put({'success': True, 'data': scraped_items[0]})
            else:
                result_queue.put({'success': False, 'error': 'No data extracted'})
            reactor.stop()
        
        def crawl_error(failure):
            """Called when crawl fails"""
            result_queue.put({'success': False, 'error': str(failure.value)})
            reactor.stop()
        
        deferred.addCallback(crawl_done)
        deferred.addErrback(crawl_error)
        
        # Run reactor
        reactor.run(installSignalHandlers=False)
        
    except Exception as e:
        logger.error(f"Spider error: {str(e)}")
        result_queue.put({'success': False, 'error': str(e)})


async def process_scrape_job(job_id: str, url: str, options: Dict[str, Any]):
    """
    Process scrape job asynchronously
    """
    try:
        logger.info(f"Starting scrape job {job_id} for {url}")
        
        # Update job status
        jobs_db[job_id]['status'] = 'running'
        
        # Create queue for inter-process communication
        result_queue = Queue()
        
        # Run spider in separate process
        process = Process(target=run_spider, args=(url, options, result_queue))
        process.start()
        
        # Wait for result with timeout (30 seconds)
        process.join(timeout=30)
        
        if process.is_alive():
            # Timeout - kill process
            process.terminate()
            process.join()
            raise Exception("Scraping timeout (30s)")
        
        # Get result from queue
        if not result_queue.empty():
            result = result_queue.get()
            
            if result.get('success'):
                jobs_db[job_id]['status'] = 'completed'
                jobs_db[job_id]['result'] = result.get('data')
                jobs_db[job_id]['completedAt'] = datetime.utcnow().isoformat()
                logger.info(f"Job {job_id} completed successfully")
            else:
                jobs_db[job_id]['status'] = 'failed'
                jobs_db[job_id]['error'] = result.get('error', 'Unknown error')
                jobs_db[job_id]['completedAt'] = datetime.utcnow().isoformat()
                logger.error(f"Job {job_id} failed: {result.get('error')}")
        else:
            jobs_db[job_id]['status'] = 'failed'
            jobs_db[job_id]['error'] = 'No result from spider'
            jobs_db[job_id]['completedAt'] = datetime.utcnow().isoformat()
            
    except Exception as e:
        logger.error(f"Job {job_id} error: {str(e)}")
        jobs_db[job_id]['status'] = 'failed'
        jobs_db[job_id]['error'] = str(e)
        jobs_db[job_id]['completedAt'] = datetime.utcnow().isoformat()


# API Endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Ultra-Scraper Scrapy Service",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/scrape", response_model=ScrapeResponse)
async def scrape(request: ScrapeRequest, background_tasks: BackgroundTasks):
    """
    Trigger a scrape job
    Returns immediately with job ID, job runs in background
    """
    # Generate job ID
    job_id = str(uuid.uuid4())
    
    # Create job record
    jobs_db[job_id] = {
        'jobId': job_id,
        'url': str(request.url),
        'status': 'pending',
        'result': None,
        'error': None,
        'createdAt': datetime.utcnow().isoformat(),
        'completedAt': None,
    }
    
    # Prepare options
    options = {
        'proxy': request.proxy,
        'userAgent': request.userAgent,
        'ignoreRobotsTxt': request.ignoreRobotsTxt,
        'maxContentLength': request.maxContentLength,
    }
    
    # Add job to background tasks
    background_tasks.add_task(process_scrape_job, job_id, str(request.url), options)
    
    logger.info(f"Created scrape job {job_id} for {request.url}")
    
    return ScrapeResponse(
        jobId=job_id,
        status="pending",
        message=f"Scrape job created. Check status at /job/{job_id}"
    )


@app.get("/job/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """
    Get status of a scrape job
    """
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs_db[job_id]
    
    return JobStatusResponse(
        jobId=job['jobId'],
        status=job['status'],
        result=job.get('result'),
        error=job.get('error'),
        createdAt=job['createdAt'],
        completedAt=job.get('completedAt'),
    )


@app.get("/stats")
async def get_stats():
    """
    Get service statistics
    """
    total_jobs = len(jobs_db)
    completed = sum(1 for job in jobs_db.values() if job['status'] == 'completed')
    failed = sum(1 for job in jobs_db.values() if job['status'] == 'failed')
    running = sum(1 for job in jobs_db.values() if job['status'] == 'running')
    pending = sum(1 for job in jobs_db.values() if job['status'] == 'pending')
    
    return {
        "total_jobs": total_jobs,
        "completed": completed,
        "failed": failed,
        "running": running,
        "pending": pending,
        "success_rate": f"{(completed / total_jobs * 100):.2f}%" if total_jobs > 0 else "0%"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
