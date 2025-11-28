// FILE: src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';

// ... existing imports

/**
 * Authenticate JWT from Authorization header
 */
export async function authenticateJWT(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ success: false, error: 'Authorization header required' });
            return;
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({ success: false, error: 'Bearer token required' });
            return;
        }

        const decoded: any = jwt.verify(token, JWT_SECRET);
        const user = await UserService.getUserById(decoded.id);

        if (!user || user.status !== 'active') {
            res.status(403).json({ success: false, error: 'Invalid or inactive user' });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(403).json({ success: false, error: 'Invalid token' });
    }
}

// ... existing code

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
