// FILE: src/api/routes/auth.routes.ts
import { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import { UserService } from '../../services/user.service';
import jwt from 'jsonwebtoken';
import { logger } from '../../utils/logger';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
);

/**
 * Initiate Google OAuth flow
 */
router.get('/google', (req: Request, res: Response) => {
    const scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
    });

    res.redirect(url);
});

/**
 * Google OAuth callback
 */
router.get('/google/callback', async (req: Request, res: Response) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res.redirect(`${FRONTEND_URL}/dashboard?error=no_code`);
        }

        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code as string);
        oauth2Client.setCredentials(tokens);

        // Get user info from Google
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data } = await oauth2.userinfo.get();

        if (!data.email) {
            return res.redirect(`${FRONTEND_URL}/dashboard?error=no_email`);
        }

        // Find or create user
        let user = await UserService.getUserByEmail(data.email);

        if (!user) {
            // Create new user (no password for OAuth users)
            user = await UserService.createUser(
                data.email,
                undefined, // No password
                data.name || undefined
            );
            logger.info({ email: data.email }, 'New user created via Google OAuth');
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Redirect to frontend with token
        res.redirect(`${FRONTEND_URL}/dashboard?token=${token}`);
    } catch (error: any) {
        logger.error({ error: error.message }, 'Google OAuth callback error');
        res.redirect(`${FRONTEND_URL}/dashboard?error=auth_failed`);
    }
});

/**
 * Initiate GitHub OAuth flow
 */
router.get('/github', (req: Request, res: Response) => {
    const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
    const redirectUri = process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/auth/github/callback';

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=user:email`;

    res.redirect(githubAuthUrl);
});

/**
 * GitHub OAuth callback
 */
router.get('/github/callback', async (req: Request, res: Response) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res.redirect(`${FRONTEND_URL}/dashboard?error=no_code`);
        }

        const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
        const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';

        // Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code,
            }),
        });

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) {
            return res.redirect(`${FRONTEND_URL}/dashboard?error=no_token`);
        }

        // Get user info from GitHub
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            },
        });

        const githubUser = await userResponse.json();

        // Get user emails (GitHub doesn't always return email in user endpoint)
        const emailResponse = await fetch('https://api.github.com/user/emails', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            },
        });

        const emails = await emailResponse.json();
        const primaryEmail = emails.find((e: any) => e.primary)?.email || githubUser.email;

        if (!primaryEmail) {
            return res.redirect(`${FRONTEND_URL}/dashboard?error=no_email`);
        }

        // Find or create user
        let user = await UserService.getUserByEmail(primaryEmail);

        if (!user) {
            user = await UserService.createUser(
                primaryEmail,
                undefined, // No password for OAuth users
                githubUser.name || githubUser.login
            );
            logger.info({ email: primaryEmail }, 'New user created via GitHub OAuth');
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Redirect to frontend with token
        res.redirect(`${FRONTEND_URL}/dashboard?token=${token}`);
    } catch (error: any) {
        logger.error({ error: error.message }, 'GitHub OAuth callback error');
        res.redirect(`${FRONTEND_URL}/dashboard?error=auth_failed`);
    }
});

export default router;
