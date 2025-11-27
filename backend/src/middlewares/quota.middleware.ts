// FILE: src/middlewares/quota.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { PLAN_LIMITS, Plan } from '../types/auth.types';
import { logger } from '../utils/logger';

/**
 * Check if user has exceeded monthly quota
 */
export async function checkQuota(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            // Anonymous users: no quotas, rate limit handles it
            next();
            return;
        }

        const userId = req.user.id;
        const plan = req.user.plan as Plan;
        const limits = PLAN_LIMITS[plan];

        // Check if using AI extraction
        const options = req.body.options || {};
        const useAI = options.useAI === true;

        // Check page quota
        const hasPageQuota = await UserService.checkQuota(userId, 'page');
        if (!hasPageQuota) {
            const usage = await UserService.getUsage(userId);

            res.status(403).json({
                success: false,
                error: 'Monthly page quota exceeded',
                quota: limits.quota,
                used: usage.pagesScraped,
                resetAt: getNextMonthDate(),
                upgrade: plan === Plan.FREE
                    ? 'Upgrade to Starter for 1,000 pages/month'
                    : plan === Plan.STARTER
                        ? 'Upgrade to Pro for 10,000 pages/month'
                        : 'Contact us for Enterprise plan',
            });
            return;
        }

        // Check AI quota if using AI
        if (useAI) {
            const hasAIQuota = await UserService.checkQuota(userId, 'ai');
            if (!hasAIQuota) {
                const usage = await UserService.getUsage(userId);

                res.status(403).json({
                    success: false,
                    error: 'Monthly AI extraction quota exceeded',
                    quota: limits.aiQuota,
                    used: usage.aiExtractions,
                    resetAt: getNextMonthDate(),
                });
                return;
            }
        }

        // Add quota info to response headers
        const usage = await UserService.getUsage(userId);
        res.setHeader('X-Quota-Limit', limits.quota.toString());
        res.setHeader('X-Quota-Remaining', Math.max(0, limits.quota - usage.pagesScraped).toString());
        res.setHeader('X-Quota-Reset', getNextMonthDate());

        next();
    } catch (error: any) {
        logger.error({ error: error.message }, 'Quota middleware error');
        next(); // Don't block on quota check errors
    }
}

function getNextMonthDate(): string {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toISOString();
}
