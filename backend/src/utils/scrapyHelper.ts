
import axios from 'axios';
import { logger } from '../utils/logger';

export interface ScrapyJobResponse {
    jobId: string;
    status: string;
    message: string;
}

export interface ScrapyJobStatus {
    jobId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: any;
    error?: string;
    createdAt: string;
    completedAt?: string;
}

export class ScrapyHelper {
    private readonly serviceUrl: string;
    private readonly timeout: number;

    constructor(serviceUrl: string = 'http://localhost:8001', timeout: number = 30000) {
        this.serviceUrl = serviceUrl;
        this.timeout = timeout;
    }

    /**
     * Check if Scrapy service is reachable
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.serviceUrl}/health`, { timeout: 2000 });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    /**
     * Submit a job and wait for completion (polling)
     */
    async scrape(url: string, options: any = {}): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            // 1. Submit Job
            const submitResponse = await axios.post<ScrapyJobResponse>(
                `${this.serviceUrl}/scrape`,
                {
                    url,
                    proxy: options.proxy,
                    userAgent: options.userAgent,
                    ignoreRobotsTxt: options.ignoreRobotsTxt || false,
                    maxContentLength: options.maxContentLength || 20000,
                },
                { timeout: 5000 }
            );

            const jobId = submitResponse.data.jobId;
            logger.info(`Scrapy job submitted: ${jobId}`);

            // 2. Poll for completion
            return await this.pollJob(jobId);

        } catch (error: any) {
            logger.error(`Scrapy execution failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    private async pollJob(jobId: string): Promise<{ success: boolean; data?: any; error?: string }> {
        const maxAttempts = 60; // 30 seconds
        const interval = 500;

        for (let i = 0; i < maxAttempts; i++) {
            try {
                const response = await axios.get<ScrapyJobStatus>(
                    `${this.serviceUrl}/job/${jobId}`,
                    { timeout: 5000 }
                );

                const status = response.data;

                if (status.status === 'completed') {
                    return { success: true, data: status.result };
                }

                if (status.status === 'failed') {
                    return { success: false, error: status.error || 'Scrapy job failed' };
                }

                await new Promise(resolve => setTimeout(resolve, interval));
            } catch (error) {
                // Ignore polling errors and retry
            }
        }

        return { success: false, error: 'Scrapy job timed out' };
    }
}
