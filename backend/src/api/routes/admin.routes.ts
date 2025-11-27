// FILE: src/api/routes/admin.routes.ts
import { Router } from 'express';
import { UserService } from '../../services/user.service';
import { redis } from '../../utils/redis';
import { scrapeQueue } from '../../jobs/queue';
import { Plan, PLAN_LIMITS } from '../../types/auth.types';

const router = Router();

// Simple admin auth (hardcoded for now - replace with proper auth)
const ADMIN_KEY = process.env.ADMIN_API_KEY || 'admin_secret_key_change_me';

function requireAdmin(req: any, res: any, next: any) {
    const key = req.headers['x-admin-key'];
    if (key !== ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

/**
 * GET /admin/stats
 * Get system-wide statistics
 */
router.get('/stats', requireAdmin, async (req, res) => {
    try {
        // Get all user keys
        const userKeys = await redis.keys('user:*');
        const users = await Promise.all(
            userKeys
                .filter(k => !k.includes(':email:') && !k.includes(':apikeys'))
                .map(async k => {
                    const data = await redis.get(k);
                    return data ? JSON.parse(data) : null;
                })
        );

        const validUsers = users.filter(u => u !== null);

        // Plan distribution
        const planCounts = validUsers.reduce((acc: any, user: any) => {
            acc[user.plan] = (acc[user.plan] || 0) + 1;
            return acc;
        }, {});

        // Calculate MRR (Monthly Recurring Revenue)
        const planPrices: Record<Plan, number> = {
            [Plan.FREE]: 0,
            [Plan.STARTER]: 19,
            [Plan.PRO]: 99,
            [Plan.ENTERPRISE]: 499,
        };

        const mrr = validUsers.reduce((total, user: any) => {
            return total + (planPrices[user.plan as Plan] || 0);
        }, 0);

        // Queue stats
        const queueStats = {
            waiting: await scrapeQueue.getWaitingCount(),
            active: await scrapeQueue.getActiveCount(),
            completed: await scrapeQueue.getCompletedCount(),
            failed: await scrapeQueue.getFailedCount(),
        };

        // Get current month usage across all users
        const month = new Date().toISOString().slice(0, 7);
        const usageKeys = await redis.keys(`usage:*:${month}`);
        let totalPages = 0;
        let totalAI = 0;

        for (const key of usageKeys) {
            const usage = await redis.hgetall(key);
            totalPages += parseInt(usage.pagesScraped || '0');
            totalAI += parseInt(usage.aiExtractions || '0');
        }

        res.json({
            success: true,
            stats: {
                users: {
                    total: validUsers.length,
                    byPlan: planCounts,
                    active: validUsers.filter((u: any) => u.status === 'active').length,
                },
                revenue: {
                    mrr: `$${mrr.toLocaleString()}`,
                    arr: `$${(mrr * 12).toLocaleString()}`,
                },
                usage: {
                    totalPages,
                    totalAI,
                    month,
                },
                queue: queueStats,
            },
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /admin/users
 * List all users with their usage
 */
router.get('/users', requireAdmin, async (req, res) => {
    try {
        const userKeys = await redis.keys('user:*');
        const users = await Promise.all(
            userKeys
                .filter(k => !k.includes(':email:') && !k.includes(':apikeys'))
                .map(async k => {
                    const data = await redis.get(k);
                    return data ? JSON.parse(data) : null;
                })
        );

        const validUsers = users.filter(u => u !== null);

        // Get usage for each user
        const usersWithUsage = await Promise.all(
            validUsers.map(async (user: any) => {
                const usage = await UserService.getUsage(user.id);
                const limits = PLAN_LIMITS[user.plan as Plan];

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    plan: user.plan,
                    status: user.status,
                    createdAt: user.createdAt,
                    usage: {
                        pages: usage.pagesScraped,
                        ai: usage.aiExtractions,
                        percentage: Math.round((usage.pagesScraped / limits.quota) * 100),
                    },
                    limits: {
                        pages: limits.quota,
                        ai: limits.aiQuota,
                    },
                };
            })
        );

        // Sort by creation date (newest first)
        usersWithUsage.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        res.json({
            success: true,
            users: usersWithUsage,
            total: usersWithUsage.length,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /admin/users/:id/plan
 * Change user's plan
 */
router.patch('/users/:id/plan', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { plan } = req.body;

        if (!Object.values(Plan).includes(plan)) {
            return res.status(400).json({ error: 'Invalid plan' });
        }

        const user = await UserService.getUserById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update user plan
        user.plan = plan;
        user.updatedAt = new Date().toISOString();
        await redis.set(`user:${id}`, JSON.stringify(user));

        res.json({
            success: true,
            message: `User plan updated to ${plan}`,
            user: {
                id: user.id,
                email: user.email,
                plan: user.plan,
            },
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /admin/users/:id/status
 * Suspend/activate user
 */
router.patch('/users/:id/status', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'suspended', 'deleted'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const user = await UserService.getUserById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.status = status;
        user.updatedAt = new Date().toISOString();
        await redis.set(`user:${id}`, JSON.stringify(user));

        res.json({
            success: true,
            message: `User ${status}`,
            user: {
                id: user.id,
                email: user.email,
                status: user.status,
            },
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /admin/users/:id/usage
 * Reset user's monthly usage
 */
router.delete('/users/:id/usage', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const month = new Date().toISOString().slice(0, 7);
        const key = `usage:${id}:${month}`;

        await redis.del(key);

        res.json({
            success: true,
            message: 'Usage reset for current month',
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
