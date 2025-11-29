import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../common/database/prisma.service';
import { SecurityGuard } from '../../utils/security';
import { UserService } from '../user/user.service';

@Injectable()
export class ScraperService {
    constructor(
        private prisma: PrismaService,
        @InjectQueue('scrape-queue') private scrapeQueue: Queue,
        private userService: UserService,
    ) { }

    async triggerScrape(url: string, options: any, userId?: string) {
        // 🛡️ SECURITY CHECK
        const isSafe = await SecurityGuard.isSafeUrl(url);
        if (!isSafe) {
            throw new Error('Forbidden: The provided URL is restricted or resolves to a private network.');
        }

        // 💾 PERSISTENCE: Create Job Record
        const jobRecord = await this.prisma.job.create({
            data: {
                url,
                userId,
                status: 'pending',
            },
        });

        // Add to Queue
        const jobId = Buffer.from(url).toString('base64');
        const job = await this.scrapeQueue.add('scrape', { url, options, dbJobId: jobRecord.id }, { jobId });

        // Track usage
        if (userId) {
            await this.userService.trackUsage(userId, 'api');
            await this.userService.trackUsage(userId, 'page');
            if (options?.useAI) {
                await this.userService.trackUsage(userId, 'ai');
            }
        }

        return {
            jobId: jobRecord.id,
            queueId: job.id,
            statusUrl: `/api/scraper/job/${jobRecord.id}`,
        };
    }

    async getJobStatus(id: string) {
        const jobRecord = await this.prisma.job.findUnique({ where: { id } });
        if (!jobRecord) {
            return null;
        }
        return jobRecord;
    }

    async getUserJobs(userId: string, limit: number = 20, offset: number = 0) {
        return this.prisma.job.findMany({
            where: { userId },
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' },
        });
    }
}
