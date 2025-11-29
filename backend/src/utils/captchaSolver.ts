import { Logger } from '@nestjs/common';
import config from '../config';
import { Page } from 'puppeteer';

interface CaptchaDetectionResult {
    hasCaptcha: boolean;
    type?: 'recaptcha_v2' | 'recaptcha_v3' | 'hcaptcha' | 'funcaptcha';
    siteKey?: string;
    dataS?: string; // for reCAPTCHA v3
}

interface CaptchaSolution {
    success: boolean;
    solution?: string;
    error?: string;
}

export class CaptchaSolver {
    private readonly logger = new Logger(CaptchaSolver.name);
    private readonly apiKey: string;
    private readonly solver: any;
    private readonly enabled: boolean;

    constructor() {
        this.apiKey = config.services.captchaApiKey || '';
        this.enabled = !!this.apiKey;

        if (this.enabled) {
            // Dynamically import 2captcha
            const Captcha = require('2captcha');
            this.solver = new Captcha.Solver(this.apiKey);
            this.logger.log('🔐 Captcha Solver initialized with 2captcha');
        } else {
            this.logger.warn('⚠️ Captcha Solver disabled - no API key provided');
        }
    }

    /**
     * Detect if a page has a captcha
     */
    async detectCaptcha(page: Page): Promise<CaptchaDetectionResult> {
        try {
            const detection = await page.evaluate(() => {
                // Check for reCAPTCHA v2
                const recaptchaV2 = document.querySelector('iframe[src*="recaptcha/api2/anchor"]');
                if (recaptchaV2) {
                    const siteKey = document.querySelector('[data-sitekey]')?.getAttribute('data-sitekey');
                    return { hasCaptcha: true, type: 'recaptcha_v2', siteKey };
                }

                // Check for reCAPTCHA v3
                const recaptchaV3Script = Array.from(document.querySelectorAll('script')).find(
                    s => s.src.includes('recaptcha/releases') || s.innerHTML.includes('grecaptcha')
                );
                if (recaptchaV3Script) {
                    const siteKey = document.querySelector('[data-sitekey]')?.getAttribute('data-sitekey');
                    const dataS = document.querySelector('[data-s]')?.getAttribute('data-s');
                    return { hasCaptcha: true, type: 'recaptcha_v3', siteKey, dataS };
                }

                // Check for hCaptcha
                const hcaptcha = document.querySelector('iframe[src*="hcaptcha.com"]');
                if (hcaptcha) {
                    const siteKey = document.querySelector('[data-sitekey]')?.getAttribute('data-sitekey');
                    return { hasCaptcha: true, type: 'hcaptcha', siteKey };
                }

                // Check for FunCaptcha
                const funcaptcha = document.querySelector('iframe[src*="arkoselabs"]');
                if (funcaptcha) {
                    const siteKey = document.querySelector('[data-public-key]')?.getAttribute('data-public-key');
                    return { hasCaptcha: true, type: 'funcaptcha', siteKey };
                }

                return { hasCaptcha: false };
            });

            if (detection.hasCaptcha) {
                this.logger.log(`🔍 Captcha detected: ${detection.type} (siteKey: ${detection.siteKey})`);
            }

            return detection as CaptchaDetectionResult;
        } catch (error: any) {
            this.logger.error(`Failed to detect captcha: ${error.message}`);
            return { hasCaptcha: false };
        }
    }

    /**
     * Solve a captcha challenge
     */
    async solveCaptcha(
        url: string,
        captchaInfo: CaptchaDetectionResult
    ): Promise<CaptchaSolution> {
        if (!this.enabled) {
            return { success: false, error: 'Captcha solver not enabled (no API key)' };
        }

        if (!captchaInfo.hasCaptcha || !captchaInfo.siteKey) {
            return { success: false, error: 'No captcha detected or siteKey missing' };
        }

        try {
            this.logger.log(`🔓 Solving ${captchaInfo.type} captcha...`);
            const startTime = Date.now();

            let solution: string;

            switch (captchaInfo.type) {
                case 'recaptcha_v2':
                    const recaptchaResult = await this.solver.recaptcha({
                        pageurl: url,
                        googlekey: captchaInfo.siteKey,
                    });
                    solution = recaptchaResult.data;
                    break;

                case 'recaptcha_v3':
                    const recaptchaV3Result = await this.solver.recaptcha({
                        pageurl: url,
                        googlekey: captchaInfo.siteKey,
                        version: 'v3',
                        action: captchaInfo.dataS || 'submit',
                        min_score: 0.3,
                    });
                    solution = recaptchaV3Result.data;
                    break;

                case 'hcaptcha':
                    const hcaptchaResult = await this.solver.hcaptcha({
                        pageurl: url,
                        sitekey: captchaInfo.siteKey,
                    });
                    solution = hcaptchaResult.data;
                    break;

                case 'funcaptcha':
                    const funcaptchaResult = await this.solver.funcaptcha({
                        pageurl: url,
                        publickey: captchaInfo.siteKey,
                    });
                    solution = funcaptchaResult.data;
                    break;

                default:
                    return { success: false, error: `Unsupported captcha type: ${captchaInfo.type}` };
            }

            const elapsed = Date.now() - startTime;
            this.logger.log(`✅ Captcha solved in ${elapsed}ms`);

            return { success: true, solution };

        } catch (error: any) {
            this.logger.error(`❌ Captcha solving failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Inject captcha solution into the page
     */
    async injectSolution(
        page: Page,
        captchaInfo: CaptchaDetectionResult,
        solution: string
    ): Promise<boolean> {
        try {
            this.logger.log('💉 Injecting captcha solution...');

            const injected = await page.evaluate(
                ({ type, solution }) => {
                    if (type === 'recaptcha_v2' || type === 'recaptcha_v3') {
                        // Find the textarea where reCAPTCHA stores the response
                        const textarea = document.querySelector('textarea[name="g-recaptcha-response"]') as HTMLTextAreaElement;
                        if (textarea) {
                            textarea.value = solution;
                            textarea.innerHTML = solution;

                            // Trigger callback if exists
                            if ((window as any).___grecaptcha_cfg?.clients) {
                                const client = Object.values((window as any).___grecaptcha_cfg.clients)[0] as any;
                                if (client?.callback) {
                                    client.callback(solution);
                                }
                            }
                            return true;
                        }
                    } else if (type === 'hcaptcha') {
                        const textarea = document.querySelector('textarea[name="h-captcha-response"]') as HTMLTextAreaElement;
                        if (textarea) {
                            textarea.value = solution;
                            textarea.innerHTML = solution;
                            return true;
                        }
                    }
                    return false;
                },
                { type: captchaInfo.type, solution }
            );

            if (injected) {
                this.logger.log('✅ Solution injected successfully');
                // Wait for page to process
                await page.waitForTimeout(2000);
                return true;
            } else {
                this.logger.warn('⚠️ Failed to inject solution - textarea not found');
                return false;
            }

        } catch (error: any) {
            this.logger.error(`Failed to inject solution: ${error.message}`);
            return false;
        }
    }

    /**
     * Full captcha solving workflow
     */
    async handleCaptcha(page: Page, url: string): Promise<boolean> {
        if (!this.enabled) {
            this.logger.warn('Captcha detected but solver is disabled');
            return false;
        }

        // Detect
        const detection = await this.detectCaptcha(page);
        if (!detection.hasCaptcha) {
            return true; // No captcha, success
        }

        // Solve
        const result = await this.solveCaptcha(url, detection);
        if (!result.success || !result.solution) {
            return false;
        }

        // Inject
        const injected = await this.injectSolution(page, detection, result.solution);
        return injected;
    }
}
