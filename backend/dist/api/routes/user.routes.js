"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// FILE: src/api/routes/user.routes.ts
const express_1 = require("express");
const user_service_1 = require("../../services/user.service");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const auth_types_1 = require("../../types/auth.types");
const router = (0, express_1.Router)();
/**
 * Register new user (public)
 */
router.post('/register', async (req, res) => {
    try {
        const { email, name } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        // Check if user exists
        const existing = await user_service_1.UserService.getUserByEmail(email);
        if (existing) {
            return res.status(409).json({ error: 'Email already registered' });
        }
        // Create user
        const user = await user_service_1.UserService.createUser(email, name);
        // Create first API key
        const apiKey = await user_service_1.UserService.createApiKey(user.id, 'Default Key');
        res.status(201).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                plan: user.plan,
            },
            apiKey: {
                key: apiKey.key,
                name: apiKey.name,
            },
            message: 'User created successfully. Save your API key - it won\'t be shown again!',
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * Get current user info (protected)
 */
router.get('/me', auth_middleware_1.authenticateAPIKey, async (req, res) => {
    try {
        const usage = await user_service_1.UserService.getUsage(req.user.id);
        const limits = auth_types_1.PLAN_LIMITS[req.user.plan];
        res.json({
            success: true,
            user: {
                id: req.user.id,
                email: req.user.email,
                name: req.user.name,
                plan: req.user.plan,
                status: req.user.status,
            },
            limits: {
                pagesPerMonth: limits.quota,
                aiExtractionsPerMonth: limits.aiQuota,
                requestsPerMinute: limits.rateLimit,
            },
            usage: {
                pagesScraped: usage.pagesScraped,
                aiExtractions: usage.aiExtractions,
                apiCalls: usage.apiCalls,
                month: usage.month,
            },
            percentage: {
                pages: Math.min(100, (usage.pagesScraped / limits.quota) * 100).toFixed(1),
                ai: limits.aiQuota === Infinity ? 0 : Math.min(100, (usage.aiExtractions / limits.aiQuota) * 100).toFixed(1),
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * List API keys (protected)
 */
router.get('/keys', auth_middleware_1.authenticateAPIKey, async (req, res) => {
    try {
        const keys = await user_service_1.UserService.listApiKeys(req.user.id);
        res.json({
            success: true,
            keys: keys.map(k => ({
                id: k.id,
                name: k.name,
                key: maskApiKey(k.key),
                createdAt: k.createdAt,
                lastUsedAt: k.lastUsedAt,
                isActive: k.isActive,
            })),
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * Create new API key (protected)
 */
router.post('/keys', auth_middleware_1.authenticateAPIKey, async (req, res) => {
    try {
        const { name } = req.body;
        const apiKey = await user_service_1.UserService.createApiKey(req.user.id, name || 'New Key');
        res.status(201).json({
            success: true,
            apiKey: {
                key: apiKey.key,
                name: apiKey.name,
                createdAt: apiKey.createdAt,
            },
            message: 'API key created. Save it now - it won\'t be shown again!',
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * Revoke API key (protected)
 */
router.delete('/keys/:key', auth_middleware_1.authenticateAPIKey, async (req, res) => {
    try {
        const { key } = req.params;
        // Verify key belongs to user
        const apiKey = await user_service_1.UserService.getApiKey(key);
        if (!apiKey || apiKey.userId !== req.user.id) {
            return res.status(404).json({ error: 'API key not found' });
        }
        await user_service_1.UserService.revokeApiKey(key);
        res.json({
            success: true,
            message: 'API key revoked',
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * Get usage stats (protected)
 */
router.get('/usage', auth_middleware_1.authenticateAPIKey, async (req, res) => {
    try {
        const usage = await user_service_1.UserService.getUsage(req.user.id);
        res.json({
            success: true,
            usage,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Helper to mask API key
function maskApiKey(key) {
    if (key.length < 12)
        return key;
    return key.slice(0, 8) + '...' + key.slice(-4);
}
exports.default = router;
