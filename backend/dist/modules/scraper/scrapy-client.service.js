"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ScrapyClientService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrapyClientService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const config_1 = __importDefault(require("../../config"));
let ScrapyClientService = ScrapyClientService_1 = class ScrapyClientService {
    httpService;
    logger = new common_1.Logger(ScrapyClientService_1.name);
    scrapyServiceUrl;
    timeout;
    enabled;
    constructor(httpService) {
        this.httpService = httpService;
        this.scrapyServiceUrl = config_1.default.scrapy?.serviceUrl || 'http://localhost:8001';
        this.timeout = config_1.default.scrapy?.timeout || 30000;
        this.enabled = config_1.default.scrapy?.enabled !== false;
        if (this.enabled) {
            this.logger.log(`Scrapy service enabled at ${this.scrapyServiceUrl}`);
        }
        else {
            this.logger.warn('Scrapy service is disabled');
        }
    }
    /**
     * Check if Scrapy service is healthy
     */
    async healthCheck() {
        if (!this.enabled) {
            return false;
        }
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.scrapyServiceUrl}/health`, {
                timeout: 5000,
            }));
            return response.status === 200;
        }
        catch (error) {
            this.logger.error(`Scrapy service health check failed: ${error.message}`);
            return false;
        }
    }
    /**
     * Scrape a URL using Scrapy
     * Returns a ScrapeResult matching the baseScraper interface
     */
    async scrape(url, options = {}) {
        const startTime = Date.now();
        if (!this.enabled) {
            throw new common_1.HttpException('Scrapy service is disabled', common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        try {
            // Step 1: Submit scrape job
            this.logger.log(`Submitting scrape job to Scrapy service: ${url}`);
            const submitResponse = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.scrapyServiceUrl}/scrape`, {
                url,
                proxy: options.proxy,
                userAgent: options.userAgent,
                ignoreRobotsTxt: options.ignoreRobotsTxt || false,
                maxContentLength: options.maxContentLength || 20000,
            }, { timeout: 5000 }));
            const jobId = submitResponse.data.jobId;
            this.logger.log(`Scrapy job created: ${jobId}`);
            // Step 2: Poll for job completion
            const result = await this.pollJobStatus(jobId);
            // Step 3: Transform to ScrapeResult format
            if (result.status === 'completed' && result.result) {
                return {
                    success: true,
                    data: result.result,
                    metadata: {
                        url,
                        timestamp: new Date().toISOString(),
                        executionTimeMs: Date.now() - startTime,
                        proxyUsed: options.proxy,
                        retriesAttempted: 0,
                    },
                };
            }
            else {
                return {
                    success: false,
                    error: result.error || 'Scrape failed',
                    metadata: {
                        url,
                        timestamp: new Date().toISOString(),
                        executionTimeMs: Date.now() - startTime,
                        proxyUsed: options.proxy,
                        retriesAttempted: 0,
                    },
                };
            }
        }
        catch (error) {
            this.logger.error(`Scrapy scrape failed for ${url}: ${error.message}`);
            return {
                success: false,
                error: error.message || 'Unknown Scrapy error',
                metadata: {
                    url,
                    timestamp: new Date().toISOString(),
                    executionTimeMs: Date.now() - startTime,
                    proxyUsed: options.proxy,
                    retriesAttempted: 0,
                },
            };
        }
    }
    /**
     * Poll job status until completion or timeout
     */
    async pollJobStatus(jobId) {
        const maxAttempts = 60; // 60 attempts * 500ms = 30 seconds max
        const pollInterval = 500; // 500ms between polls
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.scrapyServiceUrl}/job/${jobId}`, { timeout: 5000 }));
                const status = response.data;
                // Check if job is complete
                if (status.status === 'completed' || status.status === 'failed') {
                    return status;
                }
                // Wait before next poll
                await this.sleep(pollInterval);
            }
            catch (error) {
                this.logger.error(`Failed to poll job status: ${error.message}`);
                // Continue polling even on error
            }
        }
        // Timeout
        throw new Error('Job polling timeout (30s)');
    }
    /**
     * Get service statistics
     */
    async getStats() {
        if (!this.enabled) {
            return { enabled: false };
        }
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.scrapyServiceUrl}/stats`, {
                timeout: 5000,
            }));
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to get Scrapy stats: ${error.message}`);
            return { error: error.message };
        }
    }
    /**
     * Utility: Sleep for specified milliseconds
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
exports.ScrapyClientService = ScrapyClientService;
exports.ScrapyClientService = ScrapyClientService = ScrapyClientService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], ScrapyClientService);
