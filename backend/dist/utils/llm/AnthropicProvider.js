"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicProvider = void 0;
// FILE: src/utils/llm/AnthropicProvider.ts
const BaseLLMProvider_1 = require("./BaseLLMProvider");
const logger_1 = require("../logger");
class AnthropicProvider extends BaseLLMProvider_1.BaseLLMProvider {
    baseURL = "https://api.anthropic.com/v1/messages";
    async extract(html, prompt) {
        const fullPrompt = this.buildPrompt(html, prompt);
        const response = await this.callAPI(fullPrompt);
        try {
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return JSON.parse(response.content);
        }
        catch (error) {
            logger_1.logger.error("Failed to parse LLM response as JSON", { response: response.content });
            throw new Error("LLM did not return valid JSON");
        }
    }
    async callAPI(prompt) {
        const response = await fetch(this.baseURL, {
            method: "POST",
            headers: {
                "x-api-key": this.config.apiKey,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: this.config.model || "claude-3-5-sonnet-20241022",
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Anthropic API error: ${response.status} - ${error}`);
        }
        const data = await response.json();
        return {
            content: data.content[0].text,
            usage: {
                promptTokens: data.usage.input_tokens,
                completionTokens: data.usage.output_tokens,
                totalTokens: data.usage.input_tokens + data.usage.output_tokens,
            },
        };
    }
}
exports.AnthropicProvider = AnthropicProvider;
