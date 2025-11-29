import { api } from "../client";
import { ENDPOINTS } from "../endpoints";
import { ApiKey, Job } from "../../../types/user";

interface KeysResponse {
    success: boolean;
    keys: ApiKey[];
}

interface CreateKeyResponse {
    success: boolean;
    apiKey: ApiKey;
}

interface ScrapeResponse {
    success: boolean;
    jobId: string;
}

interface Webhook {
    id: string;
    url: string;
    events: string[];
    isActive: boolean;
    createdAt: string;
}

interface WebhooksResponse {
    success: boolean;
    webhooks: Webhook[];
}

interface CreateWebhookResponse {
    success: boolean;
    webhook: Webhook & { secret: string };
}

interface LlmKeysResponse {
    success: boolean;
    llmKeys: {
        openai: string;
        anthropic: string;
        gemini: string;
    };
}

export const userService = {
    // API Keys
    getKeys: async () => {
        return api.get<KeysResponse>(ENDPOINTS.USER.KEYS);
    },

    createKey: async (name: string) => {
        return api.post<CreateKeyResponse>(ENDPOINTS.USER.KEYS, { name });
    },

    revokeKey: async (keyId: string) => {
        return api.delete(`${ENDPOINTS.USER.KEYS}/${keyId}`);
    },

    // Scraping
    scrape: async (url: string, options?: any) => {
        return api.post<ScrapeResponse>(ENDPOINTS.USER.SCRAPE, { url, options });
    },

    getJobs: async (limit = 20) => {
        return api.get<{ success: boolean; data: Job[] }>(`${ENDPOINTS.USER.JOBS}?limit=${limit}`);
    },

    // Webhooks
    getWebhooks: async () => {
        return api.get<WebhooksResponse>(ENDPOINTS.USER.WEBHOOKS);
    },

    createWebhook: async (url: string, events: string[]) => {
        return api.post<CreateWebhookResponse>(ENDPOINTS.USER.WEBHOOKS, { url, events });
    },

    deleteWebhook: async (id: string) => {
        return api.delete(`${ENDPOINTS.USER.WEBHOOKS}/${id}`);
    },

    // LLM Settings
    getLlmKeys: async () => {
        return api.get<LlmKeysResponse>(ENDPOINTS.USER.LLM);
    },

    updateLlmKey: async (provider: string, apiKey: string) => {
        return api.put(ENDPOINTS.USER.LLM, { provider, apiKey });
    },
};
