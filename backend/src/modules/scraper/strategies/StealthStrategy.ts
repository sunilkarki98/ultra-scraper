import { ScraperStrategy, WorkerResult } from './ScraperStrategy';
import { HeavyScraper } from '../../../scrapers/heavyScraper';
import { ProxyService } from '../../../common/proxy/proxy.service';
import { Logger } from '@nestjs/common';

export class StealthStrategy implements ScraperStrategy {
    name = 'StealthStrategy';
    priority = 1; // Lowest priority, last resort

    private readonly logger = new Logger(StealthStrategy.name);
    private readonly heavyScraper: HeavyScraper;

    constructor(private proxyService: ProxyService) {
        this.heavyScraper = new HeavyScraper();
    }

    async canHandle(url: string, options: any): Promise<boolean> {
        // Can handle any URL as a fallback
        return true;
    }

    async execute(url: string, options: any): Promise<WorkerResult> {
        this.logger.log(`🛡️ Using Stealth Strategy (Heavy Scraper) for ${url}`);

        try {
            // Ensure proxy is set
            if (!options.proxy) {
                options.proxy = this.proxyService.getNext();
            }

            const result = await this.heavyScraper.run(options);

            return {
                success: result.success,
                data: result.data,
                error: result.error
            };

        } catch (error: any) {
            this.logger.error(`Stealth Strategy failed: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }
}
