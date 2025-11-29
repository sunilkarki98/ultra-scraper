"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialMediaClient = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("./logger");
class SocialMediaClient {
    serviceUrl;
    constructor(serviceUrl = 'http://localhost:8002') {
        this.serviceUrl = serviceUrl;
    }
    async scrapeTwitter(url, options = {}) {
        try {
            const response = await axios_1.default.post(`${this.serviceUrl}/scrape/twitter`, {
                url,
                options
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Social Media Client (Twitter) failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async scrapeLinkedIn(url, options = {}) {
        try {
            const response = await axios_1.default.post(`${this.serviceUrl}/scrape/linkedin`, {
                url,
                options
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Social Media Client (LinkedIn) failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async scrapeReddit(url, options = {}) {
        try {
            const response = await axios_1.default.post(`${this.serviceUrl}/scrape/reddit`, {
                url,
                options
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Social Media Client (Reddit) failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async scrapeQuora(url, options = {}) {
        try {
            const response = await axios_1.default.post(`${this.serviceUrl}/scrape/quora`, {
                url,
                options
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Social Media Client (Quora) failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async scrapeFacebook(url, options = {}) {
        try {
            const response = await axios_1.default.post(`${this.serviceUrl}/scrape/facebook`, {
                url,
                options
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Social Media Client (Facebook) failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async scrapeInstagram(url, options = {}) {
        try {
            const response = await axios_1.default.post(`${this.serviceUrl}/scrape/instagram`, {
                url,
                options
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Social Media Client (Instagram) failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async scrapeTikTok(url, options = {}) {
        try {
            const response = await axios_1.default.post(`${this.serviceUrl}/scrape/tiktok`, {
                url,
                options
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Social Media Client (TikTok) failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async scrapeTelegram(url, options = {}) {
        try {
            const response = await axios_1.default.post(`${this.serviceUrl}/scrape/telegram`, {
                url,
                options
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Social Media Client (Telegram) failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
}
exports.SocialMediaClient = SocialMediaClient;
