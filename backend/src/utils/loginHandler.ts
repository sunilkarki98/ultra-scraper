import { Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { createCursor } from 'ghost-cursor';

interface LoginCredentials {
    username: string;
    password: string;
    loginUrl?: string;
    usernameSelector?: string;
    passwordSelector?: string;
    submitSelector?: string;
    successUrl?: string;
}

interface LoginResult {
    success: boolean;
    cookies?: any[];
    error?: string;
    requires2FA?: boolean;
}

export class LoginHandler {
    private readonly logger = new Logger(LoginHandler.name);

    /**
     * Perform login on a page
     */
    async login(page: Page, credentials: LoginCredentials): Promise<LoginResult> {
        try {
            this.logger.log(`🔐 Attempting login for ${credentials.username}...`);

            // Navigate to login page if provided
            if (credentials.loginUrl) {
                this.logger.log(`Navigating to login page: ${credentials.loginUrl}`);
                await page.goto(credentials.loginUrl, { waitUntil: 'networkidle2', timeout: 30000 });
                await this.randomDelay(1000, 2000);
            }

            // Auto-detect login form if selectors not provided
            const selectors = await this.detectLoginForm(page, credentials);

            // Fill username
            await this.humanType(page, selectors.usernameSelector, credentials.username);
            await this.randomDelay(500, 1500);

            // Fill password
            await this.humanType(page, selectors.passwordSelector, credentials.password);
            await this.randomDelay(500, 1500);

            // Submit form
            await this.submitForm(page, selectors.submitSelector);

            // Wait for navigation or success
            await Promise.race([
                page.waitForNavigation({ timeout: 15000, waitUntil: 'networkidle2' }).catch(() => { }),
                new Promise(resolve => setTimeout(resolve, 15000))
            ]);

            // Check for 2FA
            const requires2FA = await this.detect2FA(page);
            if (requires2FA) {
                this.logger.warn('⚠️ 2FA detected - cannot proceed automatically');
                return { success: false, requires2FA: true, error: '2FA required' };
            }

            // Verify login success
            const isLoggedIn = await this.verifyLogin(page, credentials.successUrl);

            if (isLoggedIn) {
                // Get cookies for future requests
                const cookies = await page.cookies();
                this.logger.log('✅ Login successful');
                return { success: true, cookies };
            } else {
                this.logger.error('❌ Login failed - could not verify success');
                return { success: false, error: 'Login verification failed' };
            }

        } catch (error: any) {
            this.logger.error(`Login failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Auto-detect login form selectors
     */
    private async detectLoginForm(page: Page, credentials: LoginCredentials) {
        const detected = await page.evaluate(() => {
            // Common patterns for username/email fields
            const usernameInputs = [
                'input[name="username"]',
                'input[name="email"]',
                'input[type="email"]',
                'input[id="username"]',
                'input[id="email"]',
                'input[placeholder*="email" i]',
                'input[placeholder*="username" i]',
                'input[autocomplete="username"]'
            ];

            // Common patterns for password fields
            const passwordInputs = [
                'input[type="password"]',
                'input[name="password"]',
                'input[id="password"]'
            ];

            // Common patterns for submit buttons
            const submitButtons = [
                'button[type="submit"]',
                'input[type="submit"]',
                'button:contains("Log in")',
                'button:contains("Sign in")',
                'button:contains("Login")',
                'button[id*="login" i]',
                'button[class*="login" i]'
            ];

            let usernameSelector = '';
            let passwordSelector = '';
            let submitSelector = '';

            // Find username field
            for (const selector of usernameInputs) {
                if (document.querySelector(selector)) {
                    usernameSelector = selector;
                    break;
                }
            }

            // Find password field
            for (const selector of passwordInputs) {
                if (document.querySelector(selector)) {
                    passwordSelector = selector;
                    break;
                }
            }

            // Find submit button
            for (const selector of submitButtons) {
                const element = document.querySelector(selector);
                if (element && element.textContent?.toLowerCase().includes('log')) {
                    submitSelector = selector;
                    break;
                }
            }

            // Fallback: just find the first submit button
            if (!submitSelector) {
                const submitBtn = document.querySelector('button[type="submit"], input[type="submit"]');
                if (submitBtn) {
                    submitSelector = 'button[type="submit"], input[type="submit"]';
                }
            }

            return { usernameSelector, passwordSelector, submitSelector };
        });

        // Use provided selectors or detected ones
        return {
            usernameSelector: credentials.usernameSelector || detected.usernameSelector,
            passwordSelector: credentials.passwordSelector || detected.passwordSelector,
            submitSelector: credentials.submitSelector || detected.submitSelector
        };
    }

    /**
     * Type text with human-like behavior using Ghost Cursor
     */
    private async humanType(page: Page, selector: string, text: string) {
        try {
            await page.waitForSelector(selector, { timeout: 10000 });

            // Use Ghost Cursor for clicking
            const cursor = createCursor(page);
            const element = await page.$(selector);

            if (element) {
                const box = await element.boundingBox();
                if (box) {
                    await cursor.click(selector);
                }
            }

            await this.randomDelay(200, 500);

            // Type with random delays between keystrokes
            await page.focus(selector);
            for (const char of text) {
                await page.keyboard.type(char);
                await this.randomDelay(50, 150); // Human-like typing speed
            }

        } catch (error: any) {
            this.logger.error(`Failed to type in ${selector}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Submit form with human-like behavior
     */
    private async submitForm(page: Page, submitSelector: string) {
        try {
            await page.waitForSelector(submitSelector, { timeout: 10000 });

            const cursor = createCursor(page);
            await cursor.click(submitSelector);

            this.logger.log('Form submitted');
        } catch (error: any) {
            // Fallback: try pressing Enter
            this.logger.warn('Submit button click failed, trying Enter key');
            await page.keyboard.press('Enter');
        }
    }

    /**
     * Detect if 2FA is required
     */
    private async detect2FA(page: Page): Promise<boolean> {
        const has2FA = await page.evaluate(() => {
            const text = document.body.textContent?.toLowerCase() || '';
            return (
                text.includes('two-factor') ||
                text.includes('2fa') ||
                text.includes('verification code') ||
                text.includes('authenticator') ||
                document.querySelector('input[name*="code"]') !== null ||
                document.querySelector('input[name*="otp"]') !== null
            );
        });
        return has2FA;
    }

    /**
     * Verify login was successful
     */
    private async verifyLogin(page: Page, successUrl?: string): Promise<boolean> {
        // Method 1: Check if URL changed to success URL
        if (successUrl) {
            const currentUrl = page.url();
            if (currentUrl.includes(successUrl)) {
                return true;
            }
        }

        // Method 2: Check for common success indicators
        const isLoggedIn = await page.evaluate(() => {
            const text = document.body.textContent?.toLowerCase() || '';

            // Check for logout button/link
            const hasLogout = !!document.querySelector(
                'a[href*="logout"], button:contains("Logout"), button:contains("Sign Out")'
            );

            // Check for user profile elements
            const hasProfile = !!document.querySelector(
                '[class*="profile"], [class*="avatar"], [id*="user-menu"]'
            );

            // Check for error messages
            const hasError = text.includes('incorrect') ||
                text.includes('invalid') ||
                text.includes('wrong password') ||
                text.includes('failed');

            return (hasLogout || hasProfile) && !hasError;
        });

        return isLoggedIn;
    }

    /**
     * Load saved session cookies
     */
    async loadSession(page: Page, cookies: any[]): Promise<void> {
        if (cookies && cookies.length > 0) {
            this.logger.log('🍪 Loading saved session cookies...');
            await page.setCookie(...cookies);
        }
    }

    /**
     * Random delay helper
     */
    private randomDelay(min: number, max: number): Promise<void> {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        return new Promise(resolve => setTimeout(resolve, delay));
    }
}
