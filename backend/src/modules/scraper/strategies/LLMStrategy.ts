import { ScraperStrategy, WorkerResult } from './ScraperStrategy';
import { LLMClient } from '../../../utils/llm/LLMClient';
import { Logger } from '@nestjs/common';

export class LLMStrategy implements ScraperStrategy {
    name = 'LLMStrategy';
    priority = 20; // Highest priority if explicitly requested

    private readonly logger = new Logger(LLMStrategy.name);

    async canHandle(url: string, options: any): Promise<boolean> {
        return options.workflow === 'llm-only';
    }

    async execute(url: string, options: any): Promise<WorkerResult> {
        this.logger.log(`🧠 Processing LLM Only Job`);

        try {
            const llmClient = new LLMClient({
                provider: options.llmConfig?.provider,
                apiKey: options.llmConfig?.apiKey,
                model: options.llmConfig?.model,
                endpoint: options.llmConfig?.endpoint,
            });

            const prompt = options.aiPrompt || options.customPrompt || "Hello";
            const llmResult = await llmClient.extract("", prompt); // Empty HTML for pure generation

            return {
                success: true,
                data: {
                    content: JSON.stringify(llmResult),
                    // Fill other required fields with dummies
                    title: "LLM Generation",
                    description: "Generated content",
                    h1: "",
                    links: [],
                    leads: { emails: [], phones: [], socialLinks: [] },
                    images: [],
                    videos: [],
                    jsonLd: []
                }
            };
        } catch (err: any) {
            this.logger.error(`LLM Strategy Failed: ${err.message}`);
            return { success: false, error: `LLM Generation Failed: ${err.message}` };
        }
    }
}
