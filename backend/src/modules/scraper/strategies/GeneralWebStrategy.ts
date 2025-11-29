import { ScraperStrategy, WorkerResult } from './ScraperStrategy';
import { ScrapyClientService } from '../../scraper/scrapy-client.service';
import { UniversalScraper } from '../../../scrapers/universalScraper';
import { ProxyService } from '../../../common/proxy/proxy.service';
import { WebsiteAnalyzerService } from '../../scraper/website-analyzer.service';
import { Logger } from '@nestjs/common';

export class GeneralWebStrategy implements ScraperStrategy {
    name = 'GeneralWebStrategy';
    priority = 5; // Medium priority, fallback for others

    private readonly logger = new Logger(GeneralWebStrategy.name);
    private readonly universalScraper: UniversalScraper;

    constructor(
        private proxyService: ProxyService,
        private scrapyClient: ScrapyClientService,
        private websiteAnalyzer: WebsiteAnalyzerService
    ) {
        this.universalScraper = new UniversalScraper(proxyService);
    }

    async canHandle(url: string, options: any): Promise<boolean> {
        // This is the catch-all strategy for standard web pages
        return true;
    }

    async execute(url: string, options: any): Promise<WorkerResult> {
        // Analyze website to determine optimal engine
        const analysis = await this.websiteAnalyzer.analyze(url);
        this.logger.log(`Website analysis: engine=${analysis.recommendedEngine}, confidence=${analysis.confidence}`);

        // ============================================================
        // ⚡ TIER 0: Scrapy (Fast static scraping)
        // ============================================================
        if (analysis.recommendedEngine === 'scrapy') {
            this.logger.log(`⚡ TIER 0: Attempting Scrapy (Fast) for ${url}`);

            try {
                // Check if Scrapy service is healthy
                const scrapyHealthy = await this.scrapyClient.healthCheck();

                if (scrapyHealthy) {
                    const result = await this.scrapyClient.scrape(url, {
                        proxy: options.proxy || this.proxyService.getNext(),
                        userAgent: options.userAgent,
                        ignoreRobotsTxt: options.ignoreRobotsTxt,
                        maxContentLength: options.maxContentLength,
                    });

                    // If Scrapy succeeds, we're done!
                    if (result.success) {
                        this.logger.log(`✅ Scrapy succeeded for ${url}`);
                        return { success: true, data: result.data };
                    } else {
                        this.logger.warn(`Scrapy failed, falling back to Playwright: ${result.error}`);
                        // Fall through to Tier 1
                    }
                } else {
                    this.logger.warn('Scrapy service unhealthy, falling back to Playwright');
                    // Fall through to Tier 1
                }
            } catch (error: any) {
                this.logger.warn(`Tier 0 failed: ${error.message}, falling back to Playwright`);
                // Fall through to Tier 1
            }
        }

        // ============================================================
        // 🟢 TIER 1: Playwright (Universal Scraper)
        // ============================================================
        this.logger.log(`🟢 TIER 1: Attempting Playwright for ${url}`);
        try {
            const result = await this.universalScraper.run(options);

            if (!result.success && this.isAntiBotError(result.error)) {
                throw new Error('ANTI_BOT_DETECTED');
            }

            return {
                success: result.success,
                data: result.data,
                error: result.error
            };

        } catch (error: any) {
            if (error.message === 'ANTI_BOT_DETECTED') {
                // Re-throw to let the processor try the StealthStrategy
                throw error;
            }
            return { success: false, error: error.message };
        }
    }

    private isAntiBotError(errorMsg?: string): boolean {
        if (!errorMsg) return false;
        const msg = errorMsg.toLowerCase();
        return (
            msg.includes('timeout') ||
            msg.includes('anti_bot') ||
            msg.includes('403') ||
            msg.includes('429') ||
            msg.includes('captcha') ||
            msg.includes('security check') ||
            msg.includes('denied')
        );
    }
}
