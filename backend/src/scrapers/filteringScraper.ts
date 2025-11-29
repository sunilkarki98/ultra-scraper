// FILE: src/scrapers/filteringScraper.ts
import { BaseScraper } from "./baseScraper";
import { UniversalScraper, ScrapeOptions, ScrapeResult } from "./universalScraper";
import { LLMClient } from "../utils/llm/LLMClient";
import { logger } from "../utils/logger";
import { ProxyService } from "../common/proxy/proxy.service";

/**
 * FilteringScraper: Uses UniversalScraper to extract everything,
 * then applies LLM filtering to return only user-requested data.
 */
export class FilteringScraper extends BaseScraper<ScrapeResult> {
    constructor(proxyService?: ProxyService) {
        super(proxyService);
    }

    protected async scrape(options: ScrapeOptions): Promise<ScrapeResult> {
        if (!this.page) throw new Error("Browser Page not initialized");

        // 1. Use UniversalScraper to extract ALL data
        const universalScraper = new UniversalScraper(this.proxyService);
        const fullData = await universalScraper.run(options);

        if (!fullData.success || !fullData.data) {
            throw new Error("Universal scraper failed to extract data");
        }

        // 2. Build filtering prompt based on user requirements
        const filterPrompt = this.buildFilterPrompt(options);

        // If no filtering needed, return raw data
        if (!filterPrompt) {
            return fullData.data;
        }

        // 3. Use LLM to filter and format the data
        logger.info(`Applying LLM filtering for ${this.page.url()}`);

        const llmClient = new LLMClient({
            provider: options.llmProvider,
            apiKey: options.llmApiKey || "",
            model: options.llmModel,
            endpoint: options.llmEndpoint,
        });

        try {
            // Convert scraped data to a format LLM can process
            const dataContext = this.serializeData(fullData.data);

            // Ask LLM to filter
            const filteredData = await llmClient.extract(dataContext, filterPrompt);

            // Merge with original structure
            return {
                title: filteredData.title || fullData.data.title,
                description: filteredData.description || fullData.data.description,
                h1: filteredData.h1 || fullData.data.h1,
                content: filteredData.content || "",
                links: filteredData.links || [],
                leads: {
                    emails: filteredData.emails || filteredData.leads?.emails || [],
                    phones: filteredData.phones || filteredData.leads?.phones || [],
                    socialLinks: filteredData.socialLinks || filteredData.leads?.socialLinks || [],
                },
                images: filteredData.images || [],
                videos: filteredData.videos || [],
                jsonLd: fullData.data.jsonLd || [],
            };
        } catch (error: any) {
            logger.error(`LLM filtering failed: ${error.message}`);
            // Fallback to raw data if LLM fails
            return fullData.data;
        }
    }

    /**
     * Build filtering prompt based on content selectors or custom prompt
     */
    private buildFilterPrompt(options: ScrapeOptions): string | null {
        // Priority 1: Custom user prompt
        if (options.aiPrompt) {
            return options.aiPrompt;
        }

        // Priority 2: Content selectors from URL scrape
        if (options.contentSelectors) {
            const selected = Object.entries(options.contentSelectors)
                .filter(([_, enabled]) => enabled)
                .map(([type]) => type);

            if (selected.length === 0) {
                return null; // No filtering needed
            }

            const parts: string[] = [];

            if (selected.includes('emails')) {
                parts.push("all email addresses");
            }
            if (selected.includes('phones')) {
                parts.push("all phone numbers");
            }
            if (selected.includes('links')) {
                parts.push("all links with their text and URLs");
            }
            if (selected.includes('text')) {
                parts.push("the main text content");
            }
            if (selected.includes('images')) {
                parts.push("all images with their src, alt text, and dimensions");
            }
            if (selected.includes('videos')) {
                parts.push("all videos with their sources and types (HTML5, YouTube, Vimeo, etc.)");
            }
            if (selected.includes('tables')) {
                parts.push("all tables with their data structured as arrays");
            }

            return `From the provided data, extract only: ${parts.join(", ")}. Return the data in a structured JSON format matching the original schema.`;
        }

        // No filtering needed
        return null;
    }

    /**
     * Serialize scraped data into a format LLM can understand
     */
    private serializeData(data: ScrapeResult): string {
        return JSON.stringify({
            title: data.title,
            description: data.description,
            h1: data.h1,
            content: data.content.substring(0, 5000), // Limit content for LLM
            links: data.links.slice(0, 50),
            emails: data.leads.emails,
            phones: data.leads.phones,
            socialLinks: data.leads.socialLinks,
            structuredData: data.jsonLd,
            // HTML snippet for image/video detection
            html: data.content.substring(0, 10000),
        }, null, 2);
    }
}
