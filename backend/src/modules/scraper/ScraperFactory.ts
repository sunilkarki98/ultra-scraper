import { Injectable, Logger } from '@nestjs/common';
import { ScraperStrategy, WorkerResult } from './strategies/ScraperStrategy';
import { SocialMediaStrategy } from './strategies/SocialMediaStrategy';
import { SearchEngineStrategy } from './strategies/SearchEngineStrategy';
import { GeneralWebStrategy } from './strategies/GeneralWebStrategy';
import { StealthStrategy } from './strategies/StealthStrategy';
import { LLMStrategy } from './strategies/LLMStrategy';
import { ProxyService } from '../../common/proxy/proxy.service';
import { ScrapyClientService } from './scrapy-client.service';
import { WebsiteAnalyzerService } from './website-analyzer.service';

@Injectable()
export class ScraperFactory {
    private readonly logger = new Logger(ScraperFactory.name);
    private strategies: ScraperStrategy[] = [];

    constructor(
        private proxyService: ProxyService,
        private scrapyClient: ScrapyClientService,
        private websiteAnalyzer: WebsiteAnalyzerService
    ) {
        // Initialize strategies
        // Note: In a real NestJS app, these should ideally be injected via DI,
        // but for simplicity in this refactor, we instantiate them here.
        this.strategies = [
            new LLMStrategy(),
            new SocialMediaStrategy(proxyService),
            new SearchEngineStrategy(proxyService),
            new GeneralWebStrategy(proxyService, scrapyClient, websiteAnalyzer),
            new StealthStrategy(proxyService)
        ];

        // Sort by priority (descending)
        this.strategies.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Get the best matching strategy for the given URL and options
     */
    async getStrategy(url: string, options: any): Promise<ScraperStrategy> {
        for (const strategy of this.strategies) {
            if (await strategy.canHandle(url, options)) {
                return strategy;
            }
        }
        // Fallback to StealthStrategy if nothing else matches (though GeneralWebStrategy should catch most)
        return this.strategies.find(s => s.name === 'StealthStrategy')!;
    }

    /**
     * Execute the scraping job using the best strategy with fallback logic
     */
    async execute(url: string, options: any): Promise<WorkerResult> {
        const strategy = await this.getStrategy(url, options);
        this.logger.log(`🎯 Selected Strategy: ${strategy.name} for ${url}`);

        try {
            const result = await strategy.execute(url, options);

            // If successful, return immediately
            if (result.success) {
                return result;
            }

            // If failed, check if we should fallback
            // Logic: If GeneralWebStrategy failed, try StealthStrategy
            if (strategy.name === 'GeneralWebStrategy' && !result.success) {
                this.logger.warn(`⚠️ GeneralWebStrategy failed. Falling back to StealthStrategy.`);
                const stealthStrategy = this.strategies.find(s => s.name === 'StealthStrategy');
                if (stealthStrategy) {
                    return await stealthStrategy.execute(url, options);
                }
            }

            return result;

        } catch (error: any) {
            this.logger.error(`Strategy execution failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
}
