"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIScraper = void 0;
// FILE: src/scrapers/aiScraper.ts
const baseScraper_1 = require("./baseScraper");
const LLMClient_1 = require("../utils/llm/LLMClient");
const logger_1 = require("../utils/logger");
class AIScraper extends baseScraper_1.BaseScraper {
    async scrape(options) {
        if (!this.page)
            throw new Error("Browser Page not initialized");
        const { hydrationDelay = 2000, aiPrompt = "Extract all relevant data" } = options;
        // 1. Wait for page to hydrate (same as UniversalScraper)
        if (hydrationDelay) {
            await this.randomDelay(hydrationDelay);
        }
        // 2. Get HTML
        const html = await this.page.content();
        const pageUrl = this.page.url();
        logger_1.logger.info(`Using AI extraction for ${pageUrl}`);
        // 3. Create LLM client with user config
        const llmClient = new LLMClient_1.LLMClient({
            provider: options.llmProvider,
            apiKey: options.llmApiKey || "",
            model: options.llmModel,
            endpoint: options.llmEndpoint,
        });
        // 4. Extract data using LLM
        try {
            const extractedData = await llmClient.extract(html, aiPrompt);
            // 5. Normalize to match ScrapeResult interface
            const result = {
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
            logger_1.logger.info(`AI extraction successful: ${result.title}`);
            return result;
        }
        catch (error) {
            logger_1.logger.error(`AI extraction failed: ${error.message}`);
            throw new Error(`AI extraction failed: ${error.message}`);
        }
    }
}
exports.AIScraper = AIScraper;
