import { ScraperStrategy, WorkerResult } from './ScraperStrategy';
import { SocialMediaClient } from '../../../utils/socialMediaClient';
import { TelegramScraper } from '../../../scrapers/telegramScraper';
import { ProxyService } from '../../../common/proxy/proxy.service';
import { Logger } from '@nestjs/common';

export class SocialMediaStrategy implements ScraperStrategy {
    name = 'SocialMediaStrategy';
    priority = 10; // High priority for social media domains

    private readonly logger = new Logger(SocialMediaStrategy.name);
    private readonly socialClient: SocialMediaClient;
    private readonly telegramScraper: TelegramScraper;

    constructor(private proxyService: ProxyService) {
        this.socialClient = new SocialMediaClient();
        this.telegramScraper = new TelegramScraper(proxyService);
    }

    async canHandle(url: string, options: any): Promise<boolean> {
        const domain = new URL(url).hostname;
        return (
            domain.includes('t.me') ||
            domain.includes('telegram.me') ||
            domain.includes('telegram.dog') ||
            domain.includes('twitter.com') ||
            domain.includes('x.com') ||
            domain.includes('linkedin.com') ||
            domain.includes('facebook.com') ||
            domain.includes('instagram.com') ||
            domain.includes('tiktok.com') ||
            domain.includes('reddit.com') ||
            domain.includes('quora.com')
        );
    }

    async execute(url: string, options: any): Promise<WorkerResult> {
        const domain = new URL(url).hostname;

        // ============================================================
        // 📱 TELEGRAM (Hybrid: API + Web Fallback)
        // ============================================================
        if (domain.includes('t.me') || domain.includes('telegram.me') || domain.includes('telegram.dog')) {
            // Check for API mode (Hybrid approach)
            if (options.telegram?.mode === 'api' || options.mode === 'api') {
                this.logger.log(`📱 Using Telegram API Scraper (Hybrid) for ${url}`);
                const apiResult = await this.socialClient.scrapeTelegram(url, { ...options, mode: 'api' });

                if (apiResult.success) {
                    return { success: true, data: apiResult.data };
                } else {
                    this.logger.warn(`Telegram API failed: ${apiResult.error}. Falling back to Web Scraper.`);
                }
            }

            // Default / Fallback to Web Scraper
            this.logger.log(`📱 Using Telegram Web Scraper for ${url}`);
            const result = await this.telegramScraper.run(options);
            return {
                success: result.success,
                data: result.data,
                error: result.error
            };
        }

        // ============================================================
        // 🐦 TWITTER / X
        // ============================================================
        if (domain.includes('twitter.com') || domain.includes('x.com')) {
            this.logger.log(`🐦 Using Twitter Scraper for ${url}`);
            const result = await this.socialClient.scrapeTwitter(url, options);
            return { success: result.success, data: result.data, error: result.error };
        }

        // ============================================================
        // 💼 LINKEDIN
        // ============================================================
        if (domain.includes('linkedin.com')) {
            this.logger.log(`💼 Using LinkedIn Scraper for ${url}`);
            const result = await this.socialClient.scrapeLinkedIn(url, options);
            return { success: result.success, data: result.data, error: result.error };
        }

        // ============================================================
        // 📘 FACEBOOK
        // ============================================================
        if (domain.includes('facebook.com')) {
            this.logger.log(`📘 Using Facebook Scraper for ${url}`);
            const result = await this.socialClient.scrapeFacebook(url, options);
            return { success: result.success, data: result.data, error: result.error };
        }

        // ============================================================
        // 📸 INSTAGRAM
        // ============================================================
        if (domain.includes('instagram.com')) {
            this.logger.log(`📸 Using Instagram Scraper for ${url}`);
            const result = await this.socialClient.scrapeInstagram(url, options);
            return { success: result.success, data: result.data, error: result.error };
        }

        // ============================================================
        // 🎵 TIKTOK
        // ============================================================
        if (domain.includes('tiktok.com')) {
            this.logger.log(`🎵 Using TikTok Scraper for ${url}`);
            const result = await this.socialClient.scrapeTikTok(url, options);
            return { success: result.success, data: result.data, error: result.error };
        }

        // ============================================================
        // 👽 REDDIT
        // ============================================================
        if (domain.includes('reddit.com')) {
            this.logger.log(`👽 Using Reddit Scraper for ${url}`);
            const result = await this.socialClient.scrapeReddit(url, options);
            return { success: result.success, data: result.data, error: result.error };
        }

        // ============================================================
        // ❓ QUORA
        // ============================================================
        if (domain.includes('quora.com')) {
            this.logger.log(`❓ Using Quora Scraper for ${url}`);
            const result = await this.socialClient.scrapeQuora(url, options);
            return { success: result.success, data: result.data, error: result.error };
        }

        return { success: false, error: 'Unsupported social media domain' };
    }
}
