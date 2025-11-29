export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export const ENDPOINTS = {
    AUTH: {
        LOGIN: "/auth/login",
        SIGNUP: "/auth/signup",
        ME: "/user/profile",
    },
    USER: {
        KEYS: "/user/api-keys",
        JOBS: "/scraper/jobs",
        SCRAPE: "/scraper/trigger",
        WEBHOOKS: "/settings/webhooks",
        LLM: "/settings/llm",
    },
    ADMIN: {
        PROXIES: "/admin/proxies",
        RATE_LIMITS: "/admin/rate-limits",
        LLM_CONFIGS: "/admin/llm-configs",
        USERS: "/admin/users",
        QUEUE: {
            STATS: "/admin/queues/stats",
            JOBS: (status: string) => `/admin/queues/jobs/${status}`,
            RETRY: (jobId: string) => `/admin/queues/jobs/${jobId}/retry`,
            CLEAN: (status: string) => `/admin/queues/jobs/${status}`,
        },
    },
} as const;
