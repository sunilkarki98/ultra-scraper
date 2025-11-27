"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateAPIKey = authenticateAPIKey;
exports.optionalAuth = optionalAuth;
const user_service_1 = require("../services/user.service");
const logger_1 = require("../utils/logger");
/**
 * Authenticate API key from request header
 */
async function authenticateAPIKey(req, res, next) {
    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            res.status(401).json({
                success: false,
                error: 'API key required. Include X-API-Key header.',
            });
            return;
        }
        // Validate API key
        const user = await user_service_1.UserService.validateApiKey(apiKey);
        if (!user) {
            res.status(401).json({
                success: false,
                error: 'Invalid or inactive API key',
            });
            return;
        }
        // Check if user is active
        if (user.status !== 'active') {
            res.status(403).json({
                success: false,
                error: `Account is ${user.status}. Please contact support.`,
            });
            return;
        }
        // Attach user to request
        req.user = user;
        logger_1.logger.info({ userId: user.id, email: user.email }, 'API key validated');
        next();
    }
    catch (error) {
        logger_1.logger.error({ error: error.message }, 'Authentication error');
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
}
/**
 * Optional authentication - allows both authenticated and anonymous requests
 */
async function optionalAuth(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
        try {
            const user = await user_service_1.UserService.validateApiKey(apiKey);
            if (user && user.status === 'active') {
                req.user = user;
            }
        }
        catch (error) {
            // Silently ignore authentication errors in optional mode
            logger_1.logger.warn('Optional auth failed, continuing as anonymous');
        }
    }
    next();
}
