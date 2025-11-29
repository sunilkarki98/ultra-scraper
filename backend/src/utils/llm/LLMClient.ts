// FILE: src/utils/llm/LLMClient.ts
import { BaseLLMProvider, LLMConfig } from "./BaseLLMProvider";
import { OpenAIProvider } from "./OpenAIProvider";
import { AnthropicProvider } from "./AnthropicProvider";
import { GeminiProvider } from "./GeminiProvider";
import { CustomProvider } from "./CustomProvider";
import config from "../../config";

export type LLMProviderType = "openai" | "anthropic" | "gemini" | "custom" | "grok" | "deepseek" | "mistral";

export interface LLMClientConfig extends LLMConfig {
    provider?: LLMProviderType;
    endpoint?: string; // For custom provider
}

/**
 * Factory class for creating LLM providers
 */
export class LLMClient {
    private provider: BaseLLMProvider;

    constructor(clientConfig?: LLMClientConfig) {
        // Priority: user-provided config > env config > defaults
        const providerType = clientConfig?.provider || this.detectProvider();
        const apiKey = clientConfig?.apiKey || this.getDefaultAPIKey(providerType);

        if (!apiKey && providerType !== "custom") {
            throw new Error(
                `API key required for ${providerType}. ` +
                `Either pass it in options.llmApiKey or set ${providerType.toUpperCase()}_API_KEY env var.`
            );
        }

        const config: LLMClientConfig = {
            apiKey,
            model: clientConfig?.model,
            temperature: clientConfig?.temperature,
            maxTokens: clientConfig?.maxTokens,
            endpoint: clientConfig?.endpoint,
        };

        // Create appropriate provider
        switch (providerType) {
            case "openai":
                this.provider = new OpenAIProvider(config);
                break;
            case "anthropic":
                this.provider = new AnthropicProvider(config);
                break;
            case "gemini":
                this.provider = new GeminiProvider(config);
                break;
            case "custom":
                this.provider = new CustomProvider(config);
                break;
            case "grok":
                this.provider = new OpenAIProvider(config, "https://api.x.ai/v1/chat/completions");
                break;
            case "deepseek":
                this.provider = new OpenAIProvider(config, "https://api.deepseek.com/chat/completions");
                break;
            case "mistral":
                this.provider = new OpenAIProvider(config, "https://api.mistral.ai/v1/chat/completions");
                break;
            default:
                throw new Error(`Unsupported LLM provider: ${providerType}`);
        }
    }

    /**
     * Extract data from HTML
     */
    async extract(html: string, prompt: string): Promise<any> {
        return this.provider.extract(html, prompt);
    }

    /**
     * Detect provider from environment
     */
    private detectProvider(): LLMProviderType {
        if (process.env.OPENAI_API_KEY || process.env.LLM_PROVIDER === "openai") return "openai";
        if (process.env.ANTHROPIC_API_KEY || process.env.LLM_PROVIDER === "anthropic") return "anthropic";
        if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.LLM_PROVIDER === "gemini") return "gemini";
        if (process.env.GROK_API_KEY || process.env.LLM_PROVIDER === "grok") return "grok";
        if (process.env.DEEPSEEK_API_KEY || process.env.LLM_PROVIDER === "deepseek") return "deepseek";
        if (process.env.MISTRAL_API_KEY || process.env.LLM_PROVIDER === "mistral") return "mistral";
        if (process.env.LLM_ENDPOINT || process.env.LLM_PROVIDER === "custom") return "custom";

        // Default to OpenAI if no provider detected
        return "openai";
    }

    /**
     * Get default API key from environment
     */
    private getDefaultAPIKey(provider: LLMProviderType): string {
        switch (provider) {
            case "openai":
                return process.env.OPENAI_API_KEY || "";
            case "anthropic":
                return process.env.ANTHROPIC_API_KEY || "";
            case "gemini":
                return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
            case "grok":
                return process.env.GROK_API_KEY || "";
            case "deepseek":
                return process.env.DEEPSEEK_API_KEY || "";
            case "mistral":
                return process.env.MISTRAL_API_KEY || "";
            case "custom":
                return process.env.LLM_API_KEY || ""; // Optional for local
            default:
                return "";
        }
    }
}
