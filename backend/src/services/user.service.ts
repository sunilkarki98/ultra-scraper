// FILE: src/services/user.service.ts
import { redis } from "../utils/redis";
import prisma from "../utils/prisma";
import { nanoid } from "nanoid";
import { User, ApiKey, Plan, UserStatus, UsageRecord } from "../types/auth.types";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';

export class UserService {
    /**
     * Create a new user
     */
    static async createUser(email: string, password?: string, name?: string, plan: Plan = Plan.FREE): Promise<User> {
        let passwordHash;
        if (password) {
            passwordHash = await bcrypt.hash(password, 10);
        }

        const dbUser = await prisma.user.create({
            data: {
                email,
                name: name || email.split('@')[0],
                passwordHash,
                role: 'user',
                plan,
                status: 'active',
            },
        });

        return this.mapDbUserToUser(dbUser);
    }

    /**
     * Validate password
     */
    static async validatePassword(user: User, password: string): Promise<boolean> {
        if (!user.passwordHash) return false;
        return bcrypt.compare(password, user.passwordHash);
    }

    /**
     * Login user and return JWT
     */
    static async login(email: string, password: string): Promise<{ user: User; token: string } | null> {
        const user = await this.getUserByEmail(email);
        if (!user) return null;

        const isValid = await this.validatePassword(user, password);
        if (!isValid) return null;

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return { user, token };
    }

    /**
     * Get user by ID
     */
    static async getUserById(userId: string): Promise<User | null> {
        // Try cache first
        const cached = await redis.get(`user:${userId}`);
        if (cached) return JSON.parse(cached);

        // Fetch from DB
        const dbUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!dbUser) return null;

        const user = this.mapDbUserToUser(dbUser);

        // Cache for 5 minutes
        await redis.setex(`user:${userId}`, 300, JSON.stringify(user));

        return user;
    }

    /**
     * Get user by email
     */
    static async getUserByEmail(email: string): Promise<User | null> {
        const dbUser = await prisma.user.findUnique({ where: { email } });
        if (!dbUser) return null;
        return this.mapDbUserToUser(dbUser);
    }

    /**
     * Create API key for user
     */
    static async createApiKey(userId: string, name: string = "Default Key"): Promise<ApiKey> {
        const key = `sk_${nanoid(32)}`;

        const dbApiKey = await prisma.apiKey.create({
            data: {
                key,
                name,
                userId,
                isActive: true,
            },
        });

        return this.mapDbApiKeyToApiKey(dbApiKey);
    }

    /**
     * Get API key details
     */
    static async getApiKey(key: string): Promise<ApiKey | null> {
        // Try cache first
        const cached = await redis.get(`apikey:${key}`);
        if (cached) return JSON.parse(cached);

        // Fetch from DB
        const dbApiKey = await prisma.apiKey.findUnique({ where: { key } });
        if (!dbApiKey) return null;

        const apiKey = this.mapDbApiKeyToApiKey(dbApiKey);

        // Cache for 5 minutes
        await redis.setex(`apikey:${key}`, 300, JSON.stringify(apiKey));

        return apiKey;
    }

    /**
     * Validate API key and return user
     */
    static async validateApiKey(key: string): Promise<User | null> {
        const apiKey = await this.getApiKey(key);
        if (!apiKey || !apiKey.isActive) return null;

        // Update last used timestamp
        await prisma.apiKey.update({
            where: { key },
            data: { lastUsedAt: new Date() },
        });

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

        const fieldMap = {
            page: 'pagesScraped',
            ai: 'aiExtractions',
            api: 'apiCalls',
        };

        // Update or create usage record
        await prisma.usage.upsert({
            where: {
                userId_month: {
                    userId,
                    month,
                },
            },
            update: {
                [fieldMap[type]]: { increment: amount },
            },
            create: {
                userId,
                month,
                [fieldMap[type]]: amount,
            },
        });
    }

    /**
     * Get usage for current month
     */
    static async getUsage(userId: string): Promise<UsageRecord> {
        const month = new Date().toISOString().slice(0, 7);

        const dbUsage = await prisma.usage.findUnique({
            where: {
                userId_month: {
                    userId,
                    month,
                },
            },
        });

        if (!dbUsage) {
            return {
                userId,
                month,
                pagesScraped: 0,
                aiExtractions: 0,
                apiCalls: 0,
                bandwidthMB: 0,
            };
        }

        return {
            userId,
            month,
            pagesScraped: dbUsage.pagesScraped,
            aiExtractions: dbUsage.aiExtractions,
            apiCalls: dbUsage.apiCalls,
            bandwidthMB: dbUsage.bandwidthMB,
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
        const apiKey = await prisma.apiKey.findUnique({ where: { key } });
        if (!apiKey) return false;

        await prisma.apiKey.update({
            where: { key },
            data: { isActive: false },
        });

        // Invalidate cache
        await redis.del(`apikey:${key}`);

        return true;
    }

    /**
     * List all API keys for user
     */
    static async listApiKeys(userId: string): Promise<ApiKey[]> {
        const dbApiKeys = await prisma.apiKey.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        return dbApiKeys.map(this.mapDbApiKeyToApiKey);
    }

    /**
     * Helper: Map Prisma User to User type
     */
    private static mapDbUserToUser(dbUser: any): User {
        return {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            passwordHash: dbUser.passwordHash,
            role: dbUser.role as 'admin' | 'user',
            plan: dbUser.plan as Plan,
            status: dbUser.status as UserStatus,
            createdAt: dbUser.createdAt.toISOString(),
            updatedAt: dbUser.updatedAt.toISOString(),
        };
    }

    /**
     * Helper: Map Prisma ApiKey to ApiKey type
     */
    private static mapDbApiKeyToApiKey(dbApiKey: any): ApiKey {
        return {
            id: dbApiKey.id,
            key: dbApiKey.key,
            name: dbApiKey.name,
            userId: dbApiKey.userId,
            lastUsedAt: dbApiKey.lastUsedAt?.toISOString(),
            createdAt: dbApiKey.createdAt.toISOString(),
            isActive: dbApiKey.isActive,
        };
    }
}
