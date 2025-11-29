import { ScraperStrategy, WorkerResult } from './ScraperStrategy';
import { GoogleScraper } from '../../../scrapers/googleScraper';
import { ProxyService } from '../../../common/proxy/proxy.service';
import { Logger } from '@nestjs/common';

export class SearchEngineStrategy implements ScraperStrategy {
    name = 'SearchEngineStrategy';
    priority = 9; // High priority for search engines

    private readonly logger = new Logger(SearchEngineStrategy.name);
    private readonly googleScraper: GoogleScraper;

    constructor(private proxyService: ProxyService) {
        this.googleScraper = new GoogleScraper(proxyService);
    }

    async canHandle(url: string, options: any): Promise<boolean> {
        const domain = new URL(url).hostname;
        return (
            domain.includes('google.com') ||
            domain.includes('google.co')
        ) && url.includes('/search');
    }

    async execute(url: string, options: any): Promise<WorkerResult> {
        this.logger.log(`🔍 Using Google Scraper for ${url}`);

        try {
            const result = await this.googleScraper.run(options);
            return {
                success: result.success,
                data: result.data,
                error: result.error
            };
        } catch (error: any) {
            this.logger.error(`Google Scraper failed: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }
}
