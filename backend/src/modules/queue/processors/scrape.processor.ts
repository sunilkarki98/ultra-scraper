import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { redis } from '../../../utils/redis';
import { WebhookHandler } from '../../../utils/webhookHandler';
import { isUrlAllowed } from '../../../utils/robotsParser';
import { ScraperFactory } from '../../scraper/ScraperFactory';

interface ScrapeOptions {
    url: string;
    hydrationDelay?: number;
    maxContentLength?: number;
    useAI?: boolean;
    webhook?: string;
    webhookSecret?: string;
    recursive?: boolean;
    maxDepth?: number;
    maxPages?: number;
    ignoreRobotsTxt?: boolean;
    [key: string]: any;
}

interface WorkerResult {
    success: boolean;
    data?: any;
    error?: string;
}

@Processor('scrape-queue')
export class ScrapeProcessor {
    private readonly logger = new Logger(ScrapeProcessor.name);

    constructor(
        private prisma: PrismaService,
        private scraperFactory: ScraperFactory,
    ) { }

    @Process('scrape')
    async handleScrape(job: Job) {
        const { url, options = {} } = job.data;
        const dbJobId = job.data.dbJobId || options.dbJobId;

        this.logger.log(`⚡ Processing job ${job.id} for ${url}`);

        // 🔄 SYNC: Update Status to Processing
        if (dbJobId) {
            await this.prisma.job.update({
                where: { id: dbJobId },
                data: { status: 'processing' },
            }).catch(e => this.logger.error(`Failed to update job status: ${e.message}`));
        }

        let result: WorkerResult = { success: false, error: 'Not started' };

        try {
            // 0️⃣ ROBOTS.TXT CHECK
            if (!options.ignoreRobotsTxt) {
                const allowed = await isUrlAllowed(url);
                if (!allowed) {
                    this.logger.warn(`⛔ Blocked by robots.txt: ${url}`);
                    if (dbJobId) {
                        await this.prisma.job.update({
                            where: { id: dbJobId },
                            data: { status: 'failed', error: 'Blocked by robots.txt' },
                        });
                    }
                    throw new Error('BLOCKED_BY_ROBOTS_TXT');
                }
            }

            // 1️⃣ CACHE CHECK
            const cacheKey = `scrape:${url}`;
            try {
                const cached = await redis.get(cacheKey);
                if (cached) {
                    this.logger.log(`🔹 Returning Cached Result for ${url}`);
                    const data = JSON.parse(cached);
                    if (dbJobId) {
                        await this.prisma.job.update({
                            where: { id: dbJobId },
                            data: { status: 'completed', result: data },
                        });
                    }
                    return data;
                }
            } catch (e) {
                this.logger.warn('Redis cache check failed, proceeding without cache');
            }

            // Prepare Options
            const scrapeOptions: ScrapeOptions = {
                url,
                ...options,
                hydrationDelay: options.hydrationDelay ?? 2000,
                maxContentLength: options.maxContentLength ?? 20000,
            };

            // ============================================================
            // 🏭 STRATEGY PATTERN EXECUTION
            // ============================================================
            result = await this.scraperFactory.execute(url, scrapeOptions);

            // ============================================================
            // 🏁 FINALIZATION
            // ============================================================
            if (result.success && result.data) {
                // Cache result
                await redis.set(cacheKey, JSON.stringify(result.data), 'EX', 3600);

                // 🔄 SYNC: Update Status to Completed
                if (dbJobId) {
                    await this.prisma.job.update({
                        where: { id: dbJobId },
                        data: { status: 'completed', result: result.data },
                    }).catch(e => this.logger.error(`Failed to save job result: ${e.message}`));
                }

                // 🪝 WEBHOOK TRIGGER
                if (scrapeOptions.webhook) {
                    await WebhookHandler.send(
                        scrapeOptions.webhook,
                        {
                            jobId: dbJobId || job.id,
                            url: url,
                            status: 'completed',
                            data: result.data
                        },
                        scrapeOptions.webhookSecret
                    );
                }

                this.logger.log(`✅ Job Completed Successfully for ${url}`);
                return result.data;
            }

            // If we are here, execution failed
            this.logger.error(`❌ Execution failed. Final error: ${result.error}`);

            if (dbJobId) {
                await this.prisma.job.update({
                    where: { id: dbJobId },
                    data: { status: 'failed', error: result.error },
                }).catch(e => this.logger.error(`Failed to update job failure: ${e.message}`));
            }

            throw new Error(result.error || 'Unknown extraction error');

        } catch (error: any) {
            this.logger.error(`🔥 Unexpected worker error: ${error.message}`);
            if (dbJobId) {
                await this.prisma.job.update({
                    where: { id: dbJobId },
                    data: { status: 'failed', error: error.message },
                }).catch(e => this.logger.error(`Failed to update job failure: ${e.message}`));
            }
            throw error;
        }
    }
}
