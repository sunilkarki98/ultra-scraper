"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
// FILE: src/services/user.service.ts
const redis_1 = require("../utils/redis");
const nanoid_1 = require("nanoid");
const auth_types_1 = require("../types/auth.types");
class UserService {
    /**
     * Create a new user
     */
    static async createUser(email, name, plan = auth_types_1.Plan.FREE) {
        const userId = (0, nanoid_1.nanoid)();
        const user = {
            id: userId,
            email,
            name: name || email.split('@')[0],
            plan,
            status: auth_types_1.UserStatus.ACTIVE,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await redis_1.redis.set(`user:${userId}`, JSON.stringify(user));
        await redis_1.redis.set(`user:email:${email}`, userId);
        return user;
    }
    /**
     * Get user by ID
     */
    static async getUserById(userId) {
        const data = await redis_1.redis.get(`user:${userId}`);
        return data ? JSON.parse(data) : null;
    }
    /**
     * Get user by email
     */
    static async getUserByEmail(email) {
        const userId = await redis_1.redis.get(`user:email:${email}`);
        if (!userId)
            return null;
        return this.getUserById(userId);
    }
    /**
     * Create API key for user
     */
    static async createApiKey(userId, name = "Default Key") {
        const key = `sk_${(0, nanoid_1.nanoid)(32)}`;
        const apiKey = {
            id: (0, nanoid_1.nanoid)(),
            key,
            name,
            userId,
            createdAt: new Date().toISOString(),
            isActive: true,
        };
        await redis_1.redis.set(`apikey:${key}`, JSON.stringify(apiKey));
        await redis_1.redis.sadd(`user:${userId}:apikeys`, key);
        return apiKey;
    }
    /**
     * Get API key details
     */
    static async getApiKey(key) {
        const data = await redis_1.redis.get(`apikey:${key}`);
        return data ? JSON.parse(data) : null;
    }
    /**
     * Validate API key and return user
     */
    static async validateApiKey(key) {
        const apiKey = await this.getApiKey(key);
        if (!apiKey || !apiKey.isActive)
            return null;
        // Update last used timestamp
        apiKey.lastUsedAt = new Date().toISOString();
        await redis_1.redis.set(`apikey:${key}`, JSON.stringify(apiKey));
        return this.getUserById(apiKey.userId);
    }
    /**
     * Track usage for a user
     */
    static async trackUsage(userId, type, amount = 1) {
        const month = new Date().toISOString().slice(0, 7); // "2024-01"
        const key = `usage:${userId}:${month}`;
        const fieldMap = {
            page: 'pagesScraped',
            ai: 'aiExtractions',
            api: 'apiCalls',
        };
        await redis_1.redis.hincrby(key, fieldMap[type], amount);
        await redis_1.redis.expire(key, 60 * 60 * 24 * 90); // Keep for 90 days
    }
    /**
     * Get usage for current month
     */
    static async getUsage(userId) {
        const month = new Date().toISOString().slice(0, 7);
        const key = `usage:${userId}:${month}`;
        const data = await redis_1.redis.hgetall(key);
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
    static async checkQuota(userId, type) {
        const user = await this.getUserById(userId);
        if (!user)
            return false;
        const usage = await this.getUsage(userId);
        const { PLAN_LIMITS } = await Promise.resolve().then(() => __importStar(require('../types/auth.types')));
        const limits = PLAN_LIMITS[user.plan];
        if (type === 'page') {
            return usage.pagesScraped < limits.quota;
        }
        else if (type === 'ai') {
            return usage.aiExtractions < limits.aiQuota;
        }
        return true;
    }
    /**
     * Revoke API key
     */
    static async revokeApiKey(key) {
        const apiKey = await this.getApiKey(key);
        if (!apiKey)
            return false;
        apiKey.isActive = false;
        await redis_1.redis.set(`apikey:${key}`, JSON.stringify(apiKey));
        return true;
    }
    /**
     * List all API keys for user
     */
    static async listApiKeys(userId) {
        const keys = await redis_1.redis.smembers(`user:${userId}:apikeys`);
        const apiKeys = [];
        for (const key of keys) {
            const apiKey = await this.getApiKey(key);
            if (apiKey)
                apiKeys.push(apiKey);
        }
        return apiKeys;
    }
}
exports.UserService = UserService;
