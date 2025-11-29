// FILE: src/scrapers/aiScraper.ts
import { BaseScraper } from "./baseScraper";
import { ScrapeOptions, ScrapeResult } from "./universalScraper";
import { LLMClient } from "../utils/llm/LLMClient";
import { logger } from "../utils/logger";
import { ProxyService } from "../common/proxy/proxy.service";

export class AIScraper extends BaseScraper<ScrapeResult> {
    constructor(proxyService?: ProxyService) {
        super(proxyService);
    }
    protected async scrape(options: ScrapeOptions): Promise<ScrapeResult> {
        if (!this.page) throw new Error("Browser Page not initialized");

        const { hydrationDelay = 2000, aiPrompt = "Extract all relevant data" } = options;

        // 1. Wait for page to hydrate (same as UniversalScraper)
        if (hydrationDelay) {
            await this.randomDelay(hydrationDelay);
        }

        // 2. Get HTML
        const html = await this.page.content();
        const pageUrl = this.page.url();

        logger.info(`Using AI extraction for ${pageUrl}`);

        // 3. Create LLM client with user config
        const llmClient = new LLMClient({
            provider: options.llmProvider,
            apiKey: options.llmApiKey || "",
            model: options.llmModel,
            endpoint: options.llmEndpoint,
        });

        // 4. Extract data using LLM
        try {
            const extractedData = await llmClient.extract(html, aiPrompt);

            // 5. Normalize to match ScrapeResult interface
            const result: ScrapeResult = {
                title: extractedData.title || (await this.page.title()) || "",
                description: extractedData.description || "",
                h1: extractedData.h1 || extractedData.heading || "",
                content: extractedData.content || JSON.stringify(extractedData),
                links: extractedData.links || [],
                leads: {
                    emails: extractedData.emails || extractedData.leads?.emails || [],
                    phones: extractedData.phones || extractedData.leads?.phones || [],
                    socialLinks: extractedData.socialLinks || extractedData.social_links || [],
                },
                jsonLd: extractedData.structured_data || [],
            };

            // Validation
            if (!result.title && !result.content) {
                throw new Error("LLM extraction returned empty data");
            }

            logger.info(`AI extraction successful: ${result.title}`);
            return result;
        } catch (error: any) {
            logger.error(`AI extraction failed: ${error.message}`);
            throw new Error(`AI extraction failed: ${error.message}`);
        }
    }
}
