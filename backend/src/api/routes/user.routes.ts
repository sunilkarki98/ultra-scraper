// FILE: src/api/routes/user.routes.ts
import { Router } from 'express';
import { UserService } from '../../services/user.service';
import { authenticateAPIKey, authenticateJWT } from '../../middlewares/auth.middleware';
import { PLAN_LIMITS, Plan } from '../../types/auth.types';

const router = Router();

/**
 * Register new user (public)
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Check if user exists
        const existing = await UserService.getUserByEmail(email);
        if (existing) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Create user
        const user = await UserService.createUser(email, password, name);

        // Create first API key
        const apiKey = await UserService.createApiKey(user.id, 'Default Key');

        // Auto-login
        const login = await UserService.login(email, password);

        res.status(201).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                plan: user.plan,
                role: user.role,
            },
            token: login?.token,
            apiKey: {
                key: apiKey.key,
                name: apiKey.name,
            },
            message: 'User created successfully.',
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Login user (public)
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const result = await UserService.login(email, password);
        if (!result) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({
            success: true,
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                plan: result.user.plan,
                role: result.user.role,
            },
            token: result.token,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get current user info (protected)
 */
router.get('/me', authenticateJWT, async (req, res) => {
    try {
        const usage = await UserService.getUsage(req.user.id);
        const limits = PLAN_LIMITS[req.user.plan as Plan];

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
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * List API keys (protected)
 */
router.get('/keys', authenticateAPIKey, async (req, res) => {
    try {
        const keys = await UserService.listApiKeys(req.user.id);

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
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Create new API key (protected)
 */
router.post('/keys', authenticateAPIKey, async (req, res) => {
    try {
        const { name } = req.body;
        const apiKey = await UserService.createApiKey(req.user.id, name || 'New Key');

        res.status(201).json({
            success: true,
            apiKey: {
                key: apiKey.key,
                name: apiKey.name,
                createdAt: apiKey.createdAt,
            },
            message: 'API key created. Save it now - it won\'t be shown again!',
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Revoke API key (protected)
 */
router.delete('/keys/:key', authenticateAPIKey, async (req, res) => {
    try {
        const { key } = req.params;

        // Verify key belongs to user
        const apiKey = await UserService.getApiKey(key);
        if (!apiKey || apiKey.userId !== req.user.id) {
            return res.status(404).json({ error: 'API key not found' });
        }

        await UserService.revokeApiKey(key);

        res.json({
            success: true,
            message: 'API key revoked',
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get usage stats (protected)
 */
router.get('/usage', authenticateAPIKey, async (req, res) => {
    try {
        const usage = await UserService.getUsage(req.user.id);

        res.json({
            success: true,
            usage,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Helper to mask API key
function maskApiKey(key: string): string {
    if (key.length < 12) return key;
    return key.slice(0, 8) + '...' + key.slice(-4);
}

export default router;
