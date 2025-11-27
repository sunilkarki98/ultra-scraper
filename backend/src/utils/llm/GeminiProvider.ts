// FILE: src/utils/llm/GeminiProvider.ts
import { BaseLLMProvider, LLMResponse } from "./BaseLLMProvider";
import { logger } from "../logger";

export class GeminiProvider extends BaseLLMProvider {
    private readonly baseURL = "https://generativelanguage.googleapis.com/v1beta/models";

    async extract(html: string, prompt: string): Promise<any> {
        const fullPrompt = this.buildPrompt(html, prompt);
        const response = await this.callAPI(fullPrompt);

        try {
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
        const model = this.config.model || "gemini-2.0-flash-exp";
        const url = `${this.baseURL}/${model}:generateContent?key=${this.config.apiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: this.config.temperature,
                    maxOutputTokens: this.config.maxTokens,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${error}`);
        }

        const data = await response.json();

        return {
            content: data.candidates[0].content.parts[0].text,
            usage: {
                promptTokens: data.usageMetadata?.promptTokenCount || 0,
                completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
                totalTokens: data.usageMetadata?.totalTokenCount || 0,
            },
        };
    }
}
