// FILE: src/utils/llm/BaseLLMProvider.ts

export interface LLMConfig {
    apiKey: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

export interface LLMResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

/**
 * Abstract base class for LLM providers
 * Allows swapping between OpenAI, Anthropic, Google, or custom providers
 */
export abstract class BaseLLMProvider {
    protected config: LLMConfig;

    constructor(config: LLMConfig) {
        this.config = {
            temperature: 0.1, // Low for consistent extraction
            maxTokens: 4000,
            ...config,
        };
    }

    /**
     * Extract structured data from HTML
     */
    abstract extract(html: string, prompt: string): Promise<any>;

    /**
     * Make raw API call to LLM
     */
    protected abstract callAPI(prompt: string): Promise<LLMResponse>;

    /**
     * Truncate HTML to fit in context window
     */
    protected truncateHTML(html: string, maxLength: number = 8000): string {
        if (html.length <= maxLength) return html;

        // Try to truncate at a closing tag to maintain structure
        const truncated = html.substring(0, maxLength);
        const lastClosingTag = truncated.lastIndexOf('</');

        if (lastClosingTag > 0) {
            return truncated.substring(0, lastClosingTag + truncated.substring(lastClosingTag).indexOf('>') + 1);
        }

        return truncated;
    }

    /**
     * Build extraction prompt
     */
    protected buildPrompt(html: string, userPrompt: string): string {
        const truncatedHTML = this.truncateHTML(html);

        return `You are a data extraction expert. Extract information from the following HTML.

HTML:
${truncatedHTML}

TASK: ${userPrompt}

INSTRUCTIONS:
1. Extract ONLY the requested data
2. Return valid JSON only (no markdown, no explanation)
3. Use null for missing data
4. Ensure all keys are lowercase and snake_case

Return the extracted data as JSON:`;
    }
}
