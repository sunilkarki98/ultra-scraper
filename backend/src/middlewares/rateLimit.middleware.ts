// FILE: src/middlewares/rateLimit.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { redis } from '../utils/redis';
import { PLAN_LIMITS, Plan } from '../types/auth.types';
import { logger } from '../utils/logger';

/**
 * Rate limit based on user's plan
 */
export async function rateLimitByPlan(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            // Anonymous users get very strict limits
            const ip = req.ip || req.socket.remoteAddress || 'unknown';
            return await rateLimitByIP(ip, 3, req, res, next); // 3 requests per minute
        }

        const userId = req.user.id;
        const plan = req.user.plan as Plan;
        const limits = PLAN_LIMITS[plan];

        const currentMinute = Math.floor(Date.now() / 60000); // Current minute
        const key = `ratelimit:${userId}:${currentMinute}`;

        const current = await redis.incr(key);
        await redis.expire(key, 60); // Expire after 60 seconds

        if (current > limits.rateLimit) {
            logger.warn({
                userId,
                plan,
                limit: limits.rateLimit,
                current,
            }, 'Rate limit exceeded');

            res.status(429).json({
                success: false,
                error: 'Rate limit exceeded',
                limit: limits.rateLimit,
                current: current,
                resetAt: new Date((currentMinute + 1) * 60000).toISOString(),
                upgrade: plan === Plan.FREE ? 'Upgrade to Starter for 10 req/min' : undefined,
            });
            return;
        }

        // Add rate limit info to response headers
        res.setHeader('X-RateLimit-Limit', limits.rateLimit.toString());
        res.setHeader('X-RateLimit-Remaining', (limits.rateLimit - current).toString());
        res.setHeader('X-RateLimit-Reset', new Date((currentMinute + 1) * 60000).toISOString());

        next();
    } catch (error: any) {
        logger.error({ error: error.message }, 'Rate limit middleware error');
        next(); // Don't block on rate limit errors
    }
}

/**
 * Rate limit by IP address (for anonymous users)
 */
async function rateLimitByIP(
    ip: string,
    limit: number,
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const currentMinute = Math.floor(Date.now() / 60000);
    const key = `ratelimit:ip:${ip}:${currentMinute}`;

    const current = await redis.incr(key);
    await redis.expire(key, 60);

    if (current > limit) {
        res.status(429).json({
            success: false,
            error: 'Rate limit exceeded. Please sign up for an API key for higher limits.',
            limit: limit,
            current: current,
        });
        return;
    }

    next();
}
