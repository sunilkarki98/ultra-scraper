/**
 * API Configuration
 * Centralized configuration for API endpoints and URLs
 */

export const API_CONFIG = {
    /**
     * Backend API base URL
     * Uses environment variable in production, falls back to localhost in development
     */
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',

    /**
     * Frontend URL for OAuth callbacks
     */
    frontendURL: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3001',
};

/**
 * OAuth endpoints
 */
export const OAUTH_ENDPOINTS = {
    google: `${API_CONFIG.baseURL}/auth/google`,
    github: `${API_CONFIG.baseURL}/auth/github`,
};
