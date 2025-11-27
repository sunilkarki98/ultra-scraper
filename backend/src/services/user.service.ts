// FILE: src/services/user.service.ts
import { redis } from "../utils/redis";
import { nanoid } from "nanoid";
import { User, ApiKey, Plan, UserStatus, UsageRecord } from "../types/auth.types";

export class UserService {
    /**
     * Create a new user
     */
    static async createUser(email: string, name?: string, plan: Plan = Plan.FREE): Promise<User> {
        const userId = nanoid();
        const user: User = {
            id: userId,
            email,
            name: name || email.split('@')[0],
            plan,
            status: UserStatus.ACTIVE,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await redis.set(`user:${userId}`, JSON.stringify(user));
        await redis.set(`user:email:${email}`, userId);

        return user;
    }

    /**
     * Get user by ID
     */
    static async getUserById(userId: string): Promise<User | null> {
        const data = await redis.get(`user:${userId}`);
        return data ? JSON.parse(data) : null;
    }

    /**
     * Get user by email
     */
    static async getUserByEmail(email: string): Promise<User | null> {
        const userId = await redis.get(`user:email:${email}`);
        if (!userId) return null;
        return this.getUserById(userId);
    }

    /**
     * Create API key for user
     */
    static async createApiKey(userId: string, name: string = "Default Key"): Promise<ApiKey> {
        const key = `sk_${nanoid(32)}`;
        const apiKey: ApiKey = {
            id: nanoid(),
            key,
            name,
            userId,
            createdAt: new Date().toISOString(),
            isActive: true,
        };

        await redis.set(`apikey:${key}`, JSON.stringify(apiKey));
        await redis.sadd(`user:${userId}:apikeys`, key);

        return apiKey;
    }

    /**
     * Get API key details
     */
    static async getApiKey(key: string): Promise<ApiKey | null> {
        const data = await redis.get(`apikey:${key}`);
        return data ? JSON.parse(data) : null;
    }

    /**
     * Validate API key and return user
     */
    static async validateApiKey(key: string): Promise<User | null> {
        const apiKey = await this.getApiKey(key);
        if (!apiKey || !apiKey.isActive) return null;

        // Update last used timestamp
        apiKey.lastUsedAt = new Date().toISOString();
        await redis.set(`apikey:${key}`, JSON.stringify(apiKey));

        return this.getUserById(apiKey.userId);
    }

    /**
     * Track usage for a user
     */
    static async trackUsage(
        userId: string,
        type: 'page' | 'ai' | 'api',
        amount: number = 1
    ): Promise<void> {
        const month = new Date().toISOString().slice(0, 7); // "2024-01"
        const key = `usage:${userId}:${month}`;

        const fieldMap = {
            page: 'pagesScraped',
            ai: 'aiExtractions',
            api: 'apiCalls',
        };

        await redis.hincrby(key, fieldMap[type], amount);
        await redis.expire(key, 60 * 60 * 24 * 90); // Keep for 90 days
    }

    /**
     * Get usage for current month
     */
    static async getUsage(userId: string): Promise<UsageRecord> {
        const month = new Date().toISOString().slice(0, 7);
        const key = `usage:${userId}:${month}`;

        const data = await redis.hgetall(key);

        return {
            userId,
            month,
            pagesScraped: parseInt(data.pagesScraped || '0'),
            aiExtractions: parseInt(data.aiExtractions || '0'),
            apiCalls: parseInt(data.apiCalls || '0'),
            bandwidthMB: parseFloat(data.bandwidthMB || '0'),
        };
    }

    /**
     * Check if user has exceeded quota
     */
    static async checkQuota(userId: string, type: 'page' | 'ai'): Promise<boolean> {
        const user = await this.getUserById(userId);
        if (!user) return false;

        const usage = await this.getUsage(userId);
        const { PLAN_LIMITS } = await import('../types/auth.types');
        const limits = PLAN_LIMITS[user.plan];

        if (type === 'page') {
            return usage.pagesScraped < limits.quota;
        } else if (type === 'ai') {
            return usage.aiExtractions < limits.aiQuota;
        }

        return true;
    }

    /**
     * Revoke API key
     */
    static async revokeApiKey(key: string): Promise<boolean> {
        const apiKey = await this.getApiKey(key);
        if (!apiKey) return false;

        apiKey.isActive = false;
        await redis.set(`apikey:${key}`, JSON.stringify(apiKey));
        return true;
    }

    /**
     * List all API keys for user
     */
    static async listApiKeys(userId: string): Promise<ApiKey[]> {
        const keys = await redis.smembers(`user:${userId}:apikeys`);
        const apiKeys: ApiKey[] = [];

        for (const key of keys) {
            const apiKey = await this.getApiKey(key);
            if (apiKey) apiKeys.push(apiKey);
        }

        return apiKeys;
    }
}
