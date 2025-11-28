// FILE: src/types/auth.types.ts

export enum Plan {
    FREE = 'free',
    STARTER = 'starter',
    PRO = 'pro',
    ENTERPRISE = 'enterprise'
}

export enum UserStatus {
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
    DELETED = 'deleted'
}

export interface User {
    id: string;
    email: string;
    name?: string;
    passwordHash?: string; // Optional for now to support legacy
    role: 'admin' | 'user';
    plan: Plan;
    status: UserStatus;
    createdAt: string;
    updatedAt: string;
}

export interface ApiKey {
    id: string;
    key: string;
    name: string;
    userId: string;
    lastUsedAt?: string;
    createdAt: string;
    expiresAt?: string;
    isActive: boolean;
}

export interface UsageRecord {
    userId: string;
    month: string; // Format: "2024-01"
    pagesScraped: number;
    aiExtractions: number;
    apiCalls: number;
    bandwidthMB: number;
}

export interface PlanLimits {
    quota: number; // Pages per month
    rateLimit: number; // Requests per minute
    aiQuota: number; // AI extractions per month
    priority: number; // Lower = higher priority (1-10)
    features: string[];
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
    [Plan.FREE]: {
        quota: 100,
        rateLimit: 5,
        aiQuota: 10,
        priority: 10,
        features: ['basic_scraping']
    },
    [Plan.STARTER]: {
        quota: 1000,
        rateLimit: 10,
        aiQuota: 100,
        priority: 5,
        features: ['basic_scraping', 'webhooks', 'ai_extraction']
    },
    [Plan.PRO]: {
        quota: 10000,
        rateLimit: 50,
        aiQuota: 1000,
        priority: 2,
        features: ['basic_scraping', 'webhooks', 'ai_extraction', 'recursive_crawl', 'priority_support']
    },
    [Plan.ENTERPRISE]: {
        quota: Infinity,
        rateLimit: 200,
        aiQuota: Infinity,
        priority: 1,
        features: ['basic_scraping', 'webhooks', 'ai_extraction', 'recursive_crawl', 'priority_support', 'dedicated_resources', 'sla']
    }
};
