"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrapyHelper = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class ScrapyHelper {
    serviceUrl;
    timeout;
    constructor(serviceUrl = 'http://localhost:8001', timeout = 30000) {
        this.serviceUrl = serviceUrl;
        this.timeout = timeout;
    }
    /**
     * Check if Scrapy service is reachable
     */
    async healthCheck() {
        try {
            const response = await axios_1.default.get(`${this.serviceUrl}/health`, { timeout: 2000 });
            return response.status === 200;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Submit a job and wait for completion (polling)
     */
    async scrape(url, options = {}) {
        try {
            // 1. Submit Job
            const submitResponse = await axios_1.default.post(`${this.serviceUrl}/scrape`, {
                url,
                proxy: options.proxy,
                userAgent: options.userAgent,
                ignoreRobotsTxt: options.ignoreRobotsTxt || false,
                maxContentLength: options.maxContentLength || 20000,
            }, { timeout: 5000 });
            const jobId = submitResponse.data.jobId;
            logger_1.logger.info(`Scrapy job submitted: ${jobId}`);
            // 2. Poll for completion
            return await this.pollJob(jobId);
        }
        catch (error) {
            logger_1.logger.error(`Scrapy execution failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async pollJob(jobId) {
        const maxAttempts = 60; // 30 seconds
        const interval = 500;
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const response = await axios_1.default.get(`${this.serviceUrl}/job/${jobId}`, { timeout: 5000 });
                const status = response.data;
                if (status.status === 'completed') {
                    return { success: true, data: status.result };
                }
                if (status.status === 'failed') {
                    return { success: false, error: status.error || 'Scrapy job failed' };
                }
                await new Promise(resolve => setTimeout(resolve, interval));
            }
            catch (error) {
                // Ignore polling errors and retry
            }
        }
        return { success: false, error: 'Scrapy job timed out' };
    }
}
exports.ScrapyHelper = ScrapyHelper;
