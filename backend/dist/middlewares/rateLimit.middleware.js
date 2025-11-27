"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitByPlan = rateLimitByPlan;
const redis_1 = require("../utils/redis");
const auth_types_1 = require("../types/auth.types");
const logger_1 = require("../utils/logger");
/**
 * Rate limit based on user's plan
 */
async function rateLimitByPlan(req, res, next) {
    try {
        if (!req.user) {
            // Anonymous users get very strict limits
            const ip = req.ip || req.socket.remoteAddress || 'unknown';
            return await rateLimitByIP(ip, 3, req, res, next); // 3 requests per minute
        }
        const userId = req.user.id;
        const plan = req.user.plan;
        const limits = auth_types_1.PLAN_LIMITS[plan];
        const currentMinute = Math.floor(Date.now() / 60000); // Current minute
        const key = `ratelimit:${userId}:${currentMinute}`;
        const current = await redis_1.redis.incr(key);
        await redis_1.redis.expire(key, 60); // Expire after 60 seconds
        if (current > limits.rateLimit) {
            logger_1.logger.warn({
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
                upgrade: plan === auth_types_1.Plan.FREE ? 'Upgrade to Starter for 10 req/min' : undefined,
            });
            return;
        }
        // Add rate limit info to response headers
        res.setHeader('X-RateLimit-Limit', limits.rateLimit.toString());
        res.setHeader('X-RateLimit-Remaining', (limits.rateLimit - current).toString());
        res.setHeader('X-RateLimit-Reset', new Date((currentMinute + 1) * 60000).toISOString());
        next();
    }
    catch (error) {
        logger_1.logger.error({ error: error.message }, 'Rate limit middleware error');
        next(); // Don't block on rate limit errors
    }
}
/**
 * Rate limit by IP address (for anonymous users)
 */
async function rateLimitByIP(ip, limit, req, res, next) {
    const currentMinute = Math.floor(Date.now() / 60000);
    const key = `ratelimit:ip:${ip}:${currentMinute}`;
    const current = await redis_1.redis.incr(key);
    await redis_1.redis.expire(key, 60);
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
