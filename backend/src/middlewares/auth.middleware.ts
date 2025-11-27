// FILE: src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { logger } from '../utils/logger';

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

/**
 * Authenticate API key from request header
 */
export async function authenticateAPIKey(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const apiKey = req.headers['x-api-key'] as string;

        if (!apiKey) {
            res.status(401).json({
                success: false,
                error: 'API key required. Include X-API-Key header.',
            });
            return;
        }

        // Validate API key
        const user = await UserService.validateApiKey(apiKey);

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

        logger.info({ userId: user.id, email: user.email }, 'API key validated');
        next();
    } catch (error: any) {
        logger.error({ error: error.message }, 'Authentication error');
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
}

/**
 * Optional authentication - allows both authenticated and anonymous requests
 */
export async function optionalAuth(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const apiKey = req.headers['x-api-key'] as string;

    if (apiKey) {
        try {
            const user = await UserService.validateApiKey(apiKey);
            if (user && user.status === 'active') {
                req.user = user;
            }
        } catch (error) {
            // Silently ignore authentication errors in optional mode
            logger.warn('Optional auth failed, continuing as anonymous');
        }
    }

    next();
}
