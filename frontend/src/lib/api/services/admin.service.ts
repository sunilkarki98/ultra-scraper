import { api } from "../client";
import { ENDPOINTS } from "../endpoints";
import { QueueStats } from "../../../types/admin";

interface ProxyStatus {
    url: string;
    failures: number;
    lastUsed: number;
    disabledUntil: number;
}

interface RateLimit {
    id: string;
    path: string;
    limit: number;
    window: number;
}

interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: string;
    plan: string;
    status: string;
    createdAt: string;
}

interface QueueJob {
    id: string;
    name: string;
    data: { url?: string };
    progress: number;
    failedReason?: string;
    timestamp: number;
    finishedOn?: number;
    processedOn?: number;
    attemptsMade: number;
    status: string;
}

export const adminService = {
    // Proxies
    getProxies: async () => {
        return api.get<{ success: boolean; proxies: ProxyStatus[] }>(ENDPOINTS.ADMIN.PROXIES, { isAdmin: true });
    },

    addProxy: async (url: string) => {
        return api.post(ENDPOINTS.ADMIN.PROXIES, { url }, { isAdmin: true });
    },

    deleteProxy: async (url: string) => {
        return api.delete(`${ENDPOINTS.ADMIN.PROXIES}/${encodeURIComponent(url)}`, { isAdmin: true });
    },

    // Rate Limits
    getRateLimits: async () => {
        return api.get<{ success: boolean; limits: RateLimit[] }>(ENDPOINTS.ADMIN.RATE_LIMITS, { isAdmin: true });
    },

    updateRateLimit: async (path: string, limit: number, window: number) => {
        return api.post(ENDPOINTS.ADMIN.RATE_LIMITS, { path, limit, window }, { isAdmin: true });
    },

    updateRateLimitsConfig: async (config: any) => {
        return api.put(ENDPOINTS.ADMIN.RATE_LIMITS, config, { isAdmin: true });
    },

    // LLM Configuration
    getLlmConfigs: async () => {
        return api.get<{ success: boolean; configs: any[] }>(ENDPOINTS.ADMIN.LLM_CONFIGS, { isAdmin: true });
    },

    updateLlmConfig: async (id: string, config: any) => {
        return api.put(`${ENDPOINTS.ADMIN.LLM_CONFIGS}/${id}`, config, { isAdmin: true });
    },

    createLlmConfig: async (config: any) => {
        return api.post(ENDPOINTS.ADMIN.LLM_CONFIGS, config, { isAdmin: true });
    },

    deleteLlmConfig: async (id: string) => {
        return api.delete(`${ENDPOINTS.ADMIN.LLM_CONFIGS}/${id}`, { isAdmin: true });
    },

    // Users
    getUsers: async (page = 1, limit = 20) => {
        return api.get<{ success: boolean; users: AdminUser[]; total: number }>(
            `${ENDPOINTS.ADMIN.USERS}?page=${page}&limit=${limit}`,
            { isAdmin: true }
        );
    },

    updateUser: async (userId: string, data: { plan?: string; status?: string }) => {
        return api.put(`${ENDPOINTS.ADMIN.USERS}/${userId}`, data, { isAdmin: true });
    },

    // Queues
    getQueueStats: async () => {
        return api.get<{ success: boolean; stats: QueueStats }>(ENDPOINTS.ADMIN.QUEUE.STATS, { isAdmin: true });
    },

    getJobs: async (status: string) => {
        return api.get<{ success: boolean; jobs: QueueJob[] }>(ENDPOINTS.ADMIN.QUEUE.JOBS(status), { isAdmin: true });
    },

    retryJob: async (jobId: string) => {
        return api.post(ENDPOINTS.ADMIN.QUEUE.RETRY(jobId), {}, { isAdmin: true });
    },

    cleanQueue: async (status: string) => {
        return api.delete(ENDPOINTS.ADMIN.QUEUE.CLEAN(status), { isAdmin: true });
    },
};
