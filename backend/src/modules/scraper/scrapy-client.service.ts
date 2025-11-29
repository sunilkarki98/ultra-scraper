import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ScrapeResult } from '../../scrapers/baseScraper';
import config from '../../config';

interface ScrapyJobResponse {
    jobId: string;
    status: string;
    message: string;
}

interface ScrapyJobStatus {
    jobId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: any;
    error?: string;
    createdAt: string;
    completedAt?: string;
}

@Injectable()
export class ScrapyClientService {
    private readonly logger = new Logger(ScrapyClientService.name);
    private readonly scrapyServiceUrl: string;
    private readonly timeout: number;
    private readonly enabled: boolean;

    constructor(private readonly httpService: HttpService) {
        this.scrapyServiceUrl = config.scrapy?.serviceUrl || 'http://localhost:8001';
        this.timeout = config.scrapy?.timeout || 30000;
        this.enabled = config.scrapy?.enabled !== false;

        if (this.enabled) {
            this.logger.log(`Scrapy service enabled at ${this.scrapyServiceUrl}`);
        } else {
            this.logger.warn('Scrapy service is disabled');
        }
    }

    /**
     * Check if Scrapy service is healthy
     */
    async healthCheck(): Promise<boolean> {
        if (!this.enabled) {
            return false;
        }

        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.scrapyServiceUrl}/health`, {
                    timeout: 5000,
                })
            );
            return response.status === 200;
        } catch (error: any) {
            this.logger.error(`Scrapy service health check failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Scrape a URL using Scrapy
     * Returns a ScrapeResult matching the baseScraper interface
     */
    async scrape(
        url: string,
        options: {
            proxy?: string;
            userAgent?: string;
            ignoreRobotsTxt?: boolean;
            maxContentLength?: number;
        } = {}
    ): Promise<ScrapeResult> {
        const startTime = Date.now();

        if (!this.enabled) {
            throw new HttpException('Scrapy service is disabled', HttpStatus.SERVICE_UNAVAILABLE);
        }

        try {
            // Step 1: Submit scrape job
            this.logger.log(`Submitting scrape job to Scrapy service: ${url}`);

            const submitResponse = await firstValueFrom(
                this.httpService.post<ScrapyJobResponse>(
                    `${this.scrapyServiceUrl}/scrape`,
                    {
                        url,
                        proxy: options.proxy,
                        userAgent: options.userAgent,
                        ignoreRobotsTxt: options.ignoreRobotsTxt || false,
                        maxContentLength: options.maxContentLength || 20000,
                    },
                    { timeout: 5000 }
                )
            );

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
            } else {
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

        } catch (error: any) {
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
    private async pollJobStatus(jobId: string): Promise<ScrapyJobStatus> {
        const maxAttempts = 60; // 60 attempts * 500ms = 30 seconds max
        const pollInterval = 500; // 500ms between polls

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const response = await firstValueFrom(
                    this.httpService.get<ScrapyJobStatus>(
                        `${this.scrapyServiceUrl}/job/${jobId}`,
                        { timeout: 5000 }
                    )
                );

                const status = response.data;

                // Check if job is complete
                if (status.status === 'completed' || status.status === 'failed') {
                    return status;
                }

                // Wait before next poll
                await this.sleep(pollInterval);

            } catch (error: any) {
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
    async getStats(): Promise<any> {
        if (!this.enabled) {
            return { enabled: false };
        }

        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.scrapyServiceUrl}/stats`, {
                    timeout: 5000,
                })
            );
            return response.data;
        } catch (error: any) {
            this.logger.error(`Failed to get Scrapy stats: ${error.message}`);
            return { error: error.message };
        }
    }

    /**
     * Utility: Sleep for specified milliseconds
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
