"use strict";
// FILE: src/utils/llm/BaseLLMProvider.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseLLMProvider = void 0;
/**
 * Abstract base class for LLM providers
 * Allows swapping between OpenAI, Anthropic, Google, or custom providers
 */
class BaseLLMProvider {
    config;
    constructor(config) {
        this.config = {
            temperature: 0.1, // Low for consistent extraction
            maxTokens: 4000,
            ...config,
        };
    }
    /**
     * Truncate HTML to fit in context window
     */
    truncateHTML(html, maxLength = 8000) {
        if (html.length <= maxLength)
            return html;
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
    buildPrompt(html, userPrompt) {
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
exports.BaseLLMProvider = BaseLLMProvider;
