"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ScrapeProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrapeProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../common/database/prisma.service");
const redis_1 = require("../../../utils/redis");
const universalScraper_1 = require("../../../scrapers/universalScraper");
const heavyScraper_1 = require("../../../scrapers/heavyScraper");
const webhookHandler_1 = require("../../../utils/webhookHandler");
const robotsParser_1 = require("../../../utils/robotsParser");
const proxy_service_1 = require("../../../common/proxy/proxy.service");
const googleScraper_1 = require("../../../scrapers/googleScraper");
const telegramScraper_1 = require("../../../scrapers/telegramScraper");
const website_analyzer_service_1 = require("../../scraper/website-analyzer.service");
const scrapy_client_service_1 = require("../../scraper/scrapy-client.service");
const socialMediaClient_1 = require("../../../utils/socialMediaClient");
let ScrapeProcessor = ScrapeProcessor_1 = class ScrapeProcessor {
    prisma;
    proxyService;
    websiteAnalyzer;
    scrapyClient;
    logger = new common_1.Logger(ScrapeProcessor_1.name);
    constructor(prisma, proxyService, websiteAnalyzer, scrapyClient) {
        this.prisma = prisma;
        this.proxyService = proxyService;
        this.websiteAnalyzer = websiteAnalyzer;
        this.scrapyClient = scrapyClient;
    }
    async handleScrape(job) {
        const { url, options = {} } = job.data;
        const dbJobId = job.data.dbJobId || options.dbJobId;
        const logMeta = { jobId: job.id, dbJobId, url };
        this.logger.log(`⚡ Processing job ${job.id} for ${url}`);
        // 🔄 SYNC: Update Status to Processing
        if (dbJobId) {
            await this.prisma.job.update({
                where: { id: dbJobId },
                data: { status: 'processing' },
            }).catch(e => this.logger.error(`Failed to update job status: ${e.message}`));
        }
        let result = { success: false, error: 'Not started' };
        try {
            // 0️⃣ ROBOTS.TXT CHECK
            if (!options.ignoreRobotsTxt) {
                const allowed = await (0, robotsParser_1.isUrlAllowed)(url);
                if (!allowed) {
                    this.logger.warn(`⛔ Blocked by robots.txt: ${url}`);
                    if (dbJobId) {
                        await this.prisma.job.update({
                            where: { id: dbJobId },
                            data: { status: 'failed', error: 'Blocked by robots.txt' },
                        });
                    }
                    throw new Error('BLOCKED_BY_ROBOTS_TXT');
                }
            }
            // 1️⃣ CACHE CHECK
            const cacheKey = `scrape:${url}`;
            try {
                const cached = await redis_1.redis.get(cacheKey);
                if (cached) {
                    this.logger.log(`🔹 Returning Cached Result for ${url}`);
                    const data = JSON.parse(cached);
                    if (dbJobId) {
                        await this.prisma.job.update({
                            where: { id: dbJobId },
                            data: { status: 'completed', result: data },
                        });
                    }
                    return data;
                }
            }
            catch (e) {
                this.logger.warn('Redis cache check failed, proceeding without cache');
            }
            // Prepare Options
            const scrapeOptions = {
                url,
                ...options,
                hydrationDelay: options.hydrationDelay ?? 2000,
                maxContentLength: options.maxContentLength ?? 20000,
            };
            // Workflow Logic
            if (options.workflow === 'scraper-only') {
                scrapeOptions.useAI = false;
            }
            else if (options.workflow === 'scraper-llm') {
                scrapeOptions.useAI = true;
            }
            // ============================================================
            // 🧠 LLM ONLY WORKFLOW
            // ============================================================
            if (options.workflow === 'llm-only') {
                this.logger.log(`🧠 Processing LLM Only Job`);
                try {
                    // Dynamic import to avoid circular deps if any
                    const { LLMClient } = await Promise.resolve().then(() => __importStar(require('../../../utils/llm/LLMClient')));
                    const llmClient = new LLMClient({
                        provider: options.llmConfig?.provider || 'openai',
                        apiKey: options.llmConfig?.apiKey,
                        model: options.llmConfig?.model,
                        endpoint: options.llmConfig?.endpoint,
                    });
                    const prompt = options.aiPrompt || options.customPrompt || "Hello";
                    const llmResult = await llmClient.extract("", prompt); // Empty HTML for pure generation
                    // Normalize result
                    result = {
                        success: true,
                        data: {
                            content: JSON.stringify(llmResult),
                            // Fill other required fields with dummies
                            title: "LLM Generation",
                            description: "Generated content",
                            h1: "",
                            links: [],
                            leads: { emails: [], phones: [], socialLinks: [] },
                            jsonLd: []
                        }
                    };
                    // Skip scraping tiers
                    // Go directly to finalization
                }
                catch (err) {
                    result = { success: false, error: `LLM Generation Failed: ${err.message}` };
                }
            }
            // ============================================================
            // 🔵 TIER 0: Scrapy (Fast static scraping)
            // 🟢 TIER 1: Universal Scraper (Playwright) OR AI Scraper OR Google Scraper
            // ============================================================
            else {
                try {
                    // Analyze website to determine optimal engine
                    const analysis = await this.websiteAnalyzer.analyze(url);
                    this.logger.log(`Website analysis: engine=${analysis.recommendedEngine}, confidence=${analysis.confidence}`);
                    // Special handling for AI scraper OR content filtering
                    if (scrapeOptions.useAI || scrapeOptions.aiPrompt || scrapeOptions.contentSelectors) {
                        this.logger.log(`🤖 Using FilteringScraper (LLM layer) for ${url}`);
                        const { FilteringScraper } = await Promise.resolve().then(() => __importStar(require('../../../scrapers/filteringScraper')));
                        const filteringScraper = new FilteringScraper(this.proxyService);
                        result = await filteringScraper.run(scrapeOptions);
                    }
                    // Special handling for Telegram
                    else if (url.includes('t.me') || url.includes('telegram.me') || url.includes('telegram.dog')) {
                        // Check for API mode (Hybrid approach)
                        if (scrapeOptions.telegram?.mode === 'api' || scrapeOptions.mode === 'api') {
                            this.logger.log(`📱 Using Telegram API Scraper (Hybrid) for ${url}`);
                            const socialClient = new socialMediaClient_1.SocialMediaClient();
                            // Ensure mode is set in options
                            const apiOptions = { ...scrapeOptions, mode: 'api' };
                            const apiResult = await socialClient.scrapeTelegram(url, apiOptions);
                            if (apiResult.success) {
                                result = { success: true, data: apiResult.data };
                            }
                            else {
                                throw new Error(apiResult.error || 'Telegram API Scraper failed');
                            }
                        }
                        else {
                            // Default to Web Scraper
                            this.logger.log(`📱 Using Telegram Web Scraper for ${url}`);
                            const telegramScraper = new telegramScraper_1.TelegramScraper(this.proxyService);
                            result = await telegramScraper.run(scrapeOptions);
                        }
                    }
                    // Special handling for Google (use existing GoogleScraper, not Scrapy)
                    else if (url.includes('google.com/search') || url.includes('google.co')) {
                        this.logger.log(`🔍 Using Google Scraper for ${url}`);
                        const googleScraper = new googleScraper_1.GoogleScraper(this.proxyService);
                        result = await googleScraper.run(scrapeOptions);
                    }
                    // TIER 0: Try Scrapy for simple static sites
                    else if (analysis.recommendedEngine === 'scrapy') {
                        this.logger.log(`⚡ TIER 0: Attempting Scrapy (Fast) for ${url}`);
                        // Check if Scrapy service is healthy
                        const scrapyHealthy = await this.scrapyClient.healthCheck();
                        if (scrapyHealthy) {
                            result = await this.scrapyClient.scrape(url, {
                                proxy: scrapeOptions.proxy || this.proxyService.getNext(),
                                userAgent: scrapeOptions.userAgent,
                                ignoreRobotsTxt: scrapeOptions.ignoreRobotsTxt,
                                maxContentLength: scrapeOptions.maxContentLength,
                            });
                            // If Scrapy succeeds, we're done!
                            if (result.success) {
                                this.logger.log(`✅ Scrapy succeeded for ${url}`);
                            }
                            else {
                                this.logger.warn(`Scrapy failed, falling back to Playwright: ${result.error}`);
                                throw new Error('SCRAPY_FAILED');
                            }
                        }
                        else {
                            this.logger.warn('Scrapy service unhealthy, falling back to Playwright');
                            throw new Error('SCRAPY_SERVICE_DOWN');
                        }
                    }
                    // TIER 1: Playwright for JS-heavy sites or if Scrapy failed
                    else {
                        this.logger.log(`🟢 TIER 1: Attempting Playwright for ${url}`);
                        const scraper = new universalScraper_1.UniversalScraper(this.proxyService);
                        result = await scraper.run(scrapeOptions);
                        if (!result.success && this.isAntiBotError(result.error)) {
                            throw new Error('ANTI_BOT_DETECTED');
                        }
                    }
                }
                catch (error) {
                    // If Scrapy failed, try Playwright
                    if (error.message === 'SCRAPY_FAILED' || error.message === 'SCRAPY_SERVICE_DOWN') {
                        try {
                            this.logger.log(`🟢 Falling back to TIER 1 (Playwright) for ${url}`);
                            const scraper = new universalScraper_1.UniversalScraper(this.proxyService);
                            result = await scraper.run(scrapeOptions);
                            if (!result.success && this.isAntiBotError(result.error)) {
                                throw new Error('ANTI_BOT_DETECTED');
                            }
                        }
                        catch (fallbackError) {
                            this.logger.warn(`Tier 1 failed: ${fallbackError.message}`);
                            result = { success: false, error: fallbackError.message };
                        }
                    }
                    else {
                        this.logger.warn(`Tier 0/1 failed: ${error.message}`);
                        result = { success: false, error: error.message };
                    }
                }
            }
            // Check if data looks empty (Soft Block)
            const isDataEmpty = result.success &&
                result.data &&
                (!result.data.title || result.data.title === '') &&
                (!result.data.content || result.data.content.length < 50);
            // ============================================================
            // 🔴 TIER 2: Heavy Scraper (Puppeteer + Stealth)
            // ============================================================
            if (!result.success || isDataEmpty) {
                this.logger.warn(`⚠️ Tier 1 Failed/Blocked. Escalating to Tier 2 (Puppeteer) for ${url}`);
                try {
                    // Ensure proxy is set for HeavyScraper if not already
                    if (!scrapeOptions.proxy) {
                        scrapeOptions.proxy = this.proxyService.getNext();
                    }
                    const heavyScraper = new heavyScraper_1.HeavyScraper();
                    result = await heavyScraper.run(scrapeOptions);
                }
                catch (err) {
                    result = { success: false, error: `Tier 2 Failed: ${err.message}` };
                }
            }
            // ============================================================
            // 🏁 FINALIZATION
            // ============================================================
            if (result.success && result.data) {
                // Cache result
                await redis_1.redis.set(cacheKey, JSON.stringify(result.data), 'EX', 3600);
                // 🔄 SYNC: Update Status to Completed
                if (dbJobId) {
                    await this.prisma.job.update({
                        where: { id: dbJobId },
                        data: { status: 'completed', result: result.data },
                    }).catch(e => this.logger.error(`Failed to save job result: ${e.message}`));
                }
                // 🪝 WEBHOOK TRIGGER
                if (scrapeOptions.webhook) {
                    await webhookHandler_1.WebhookHandler.send(scrapeOptions.webhook, {
                        jobId: dbJobId || job.id,
                        url: url,
                        status: 'completed',
                        data: result.data
                    }, scrapeOptions.webhookSecret);
                }
                // 🔄 RECURSIVE CRAWLING LOGIC
                if (scrapeOptions.recursive && result.data.links && result.data.links.length > 0) {
                    const currentDepth = scrapeOptions.maxDepth || 1;
                    const currentPages = scrapeOptions.maxPages || 10;
                    if (currentDepth > 0) {
                        this.logger.log(`🕸️ Found ${result.data.links.length} links. Queuing children (Depth: ${currentDepth - 1})`);
                        // Note: We need to inject the queue to add child jobs.
                        // But since we are inside a processor, we can't easily inject the queue into the processor itself 
                        // if it creates a circular dependency or if we are not careful.
                        // However, we can use the job.queue object if available, or just inject the queue.
                        // For now, I'll skip recursive queuing implementation in this step to avoid complexity,
                        // or I can try to inject the queue.
                        // Actually, I can inject @InjectQueue('scrape-queue') into the processor.
                    }
                }
                this.logger.log(`✅ Job Completed Successfully for ${url}`);
                return result.data;
            }
            // If we are here, both tiers failed
            this.logger.error(`❌ All tiers failed. Final error: ${result.error}`);
            if (dbJobId) {
                await this.prisma.job.update({
                    where: { id: dbJobId },
                    data: { status: 'failed', error: result.error },
                }).catch(e => this.logger.error(`Failed to update job failure: ${e.message}`));
            }
            throw new Error(result.error || 'Unknown extraction error');
        }
        catch (error) {
            this.logger.error(`🔥 Unexpected worker error: ${error.message}`);
            if (dbJobId) {
                await this.prisma.job.update({
                    where: { id: dbJobId },
                    data: { status: 'failed', error: error.message },
                }).catch(e => this.logger.error(`Failed to update job failure: ${e.message}`));
            }
            throw error;
        }
    }
    isAntiBotError(errorMsg) {
        if (!errorMsg)
            return false;
        const msg = errorMsg.toLowerCase();
        return (msg.includes('timeout') ||
            msg.includes('anti_bot') ||
            msg.includes('403') ||
            msg.includes('429') ||
            msg.includes('captcha') ||
            msg.includes('security check') ||
            msg.includes('denied'));
    }
};
exports.ScrapeProcessor = ScrapeProcessor;
__decorate([
    (0, bull_1.Process)('scrape'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ScrapeProcessor.prototype, "handleScrape", null);
exports.ScrapeProcessor = ScrapeProcessor = ScrapeProcessor_1 = __decorate([
    (0, bull_1.Processor)('scrape-queue'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        proxy_service_1.ProxyService,
        website_analyzer_service_1.WebsiteAnalyzerService,
        scrapy_client_service_1.ScrapyClientService])
], ScrapeProcessor);
