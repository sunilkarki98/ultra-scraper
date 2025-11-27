"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomProvider = void 0;
// FILE: src/utils/llm/CustomProvider.ts
const BaseLLMProvider_1 = require("./BaseLLMProvider");
const logger_1 = require("../logger");
/**
 * Custom provider for OpenAI-compatible APIs
 * Works with: Ollama, LocalAI, LM Studio, vLLM, any OpenAI-compatible endpoint
 */
class CustomProvider extends BaseLLMProvider_1.BaseLLMProvider {
    baseURL;
    constructor(config) {
        super(config);
        this.baseURL = config.endpoint || "http://localhost:11434/v1/chat/completions";
    }
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
                "Authorization": this.config.apiKey ? `Bearer ${this.config.apiKey}` : "",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: this.config.model || "llama3",
                messages: [
                    {
                        role: "system",
                        content: "You are a data extraction assistant. Always return valid JSON."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens,
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Custom LLM API error: ${response.status} - ${error}`);
        }
        const data = await response.json();
        return {
            content: data.choices[0].message.content,
            usage: data.usage || {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
            },
        };
    }
}
exports.CustomProvider = CustomProvider;
