// FILE: src/utils/llm/OpenAIProvider.ts
import { BaseLLMProvider, LLMResponse } from "./BaseLLMProvider";
import { logger } from "../logger";

export class OpenAIProvider extends BaseLLMProvider {
    private readonly baseURL = "https://api.openai.com/v1/chat/completions";

    async extract(html: string, prompt: string): Promise<any> {
        const fullPrompt = this.buildPrompt(html, prompt);
        const response = await this.callAPI(fullPrompt);

        try {
            // Parse JSON from response
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return JSON.parse(response.content);
        } catch (error) {
            logger.error("Failed to parse LLM response as JSON", { response: response.content });
            throw new Error("LLM did not return valid JSON");
        }
    }

    protected async callAPI(prompt: string): Promise<LLMResponse> {
        const response = await fetch(this.baseURL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.config.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: this.config.model || "gpt-4o-mini",
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
            throw new Error(`OpenAI API error: ${response.status} - ${error}`);
        }

        const data = await response.json();

        return {
            content: data.choices[0].message.content,
            usage: {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens,
                totalTokens: data.usage.total_tokens,
            },
        };
    }
}
