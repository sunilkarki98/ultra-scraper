

import axios from 'axios';
import { logger } from './logger';

export class SocialMediaClient {
    private readonly serviceUrl: string;

    constructor(serviceUrl: string = 'http://localhost:8002') {
        this.serviceUrl = serviceUrl;
    }

    async scrapeTwitter(url: string, options: any = {}) {
        try {
            const response = await axios.post(`${this.serviceUrl}/scrape/twitter`, {
                url,
                options
            });
            return response.data;
        } catch (error: any) {
            logger.error(`Social Media Client (Twitter) failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async scrapeLinkedIn(url: string, options: any = {}) {
        try {
            const response = await axios.post(`${this.serviceUrl}/scrape/linkedin`, {
                url,
                options
            });
            return response.data;
        } catch (error: any) {
            logger.error(`Social Media Client (LinkedIn) failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async scrapeReddit(url: string, options: any = {}) {
        try {
            const response = await axios.post(`${this.serviceUrl}/scrape/reddit`, {
                url,
                options
            });
            return response.data;
        } catch (error: any) {
            logger.error(`Social Media Client (Reddit) failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async scrapeQuora(url: string, options: any = {}) {
        try {
            const response = await axios.post(`${this.serviceUrl}/scrape/quora`, {
                url,
                options
            });
            return response.data;
        } catch (error: any) {
            logger.error(`Social Media Client (Quora) failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async scrapeFacebook(url: string, options: any = {}) {
        try {
            const response = await axios.post(`${this.serviceUrl}/scrape/facebook`, {
                url,
                options
            });
            return response.data;
        } catch (error: any) {
            logger.error(`Social Media Client (Facebook) failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async scrapeInstagram(url: string, options: any = {}) {
        try {
            const response = await axios.post(`${this.serviceUrl}/scrape/instagram`, {
                url,
                options
            });
            return response.data;
        } catch (error: any) {
            logger.error(`Social Media Client (Instagram) failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async scrapeTikTok(url: string, options: any = {}) {
        try {
            const response = await axios.post(`${this.serviceUrl}/scrape/tiktok`, {
                url,
                options
            });
            return response.data;
        } catch (error: any) {
            logger.error(`Social Media Client (TikTok) failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async scrapeTelegram(url: string, options: any = {}) {
        try {
            const response = await axios.post(`${this.serviceUrl}/scrape/telegram`, {
                url,
                options
            });
            return response.data;
        } catch (error: any) {
            logger.error(`Social Media Client (Telegram) failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
}
