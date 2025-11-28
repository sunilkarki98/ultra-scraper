// FILE: src/api/controllers/admin.controller.ts
import { Request, Response } from 'express';
import { scrapeQueue } from '../../jobs/queue';
import { logger } from '../../utils/logger';

export class AdminController {
    /**
     * Get queue statistics
     */
    static async getQueueStats(req: Request, res: Response): Promise<void> {
        try {
            const [
                active,
                waiting,
                completed,
                failed,
                delayed
            ] = await Promise.all([
                scrapeQueue.getActiveCount(),
                scrapeQueue.getWaitingCount(),
                scrapeQueue.getCompletedCount(),
                scrapeQueue.getFailedCount(),
                scrapeQueue.getDelayedCount()
            ]);

            res.json({
                success: true,
                stats: {
                    active,
                    waiting,
                    completed,
                    failed,
                    delayed,
                    total: active + waiting + completed + failed + delayed
                }
            });
        } catch (error: any) {
            logger.error({ error: error.message }, 'Failed to get queue stats');
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve queue statistics'
            });
        }
    }
    /**
     * Get jobs by status
     */
    static async getJobs(req: Request, res: Response): Promise<void> {
        try {
            const { status } = req.params;
            const validStatuses = ['active', 'waiting', 'completed', 'failed', 'delayed', 'paused'];

            if (!validStatuses.includes(status)) {
                res.status(400).json({ success: false, error: 'Invalid status' });
                return;
            }

            // Get last 50 jobs
            const jobs = await scrapeQueue.getJobs([status as any], 0, 50, false);

            const formattedJobs = jobs.map(job => ({
                id: job.id,
                name: job.name,
                data: job.data,
                progress: job.progress,
                failedReason: job.failedReason,
                timestamp: job.timestamp,
                finishedOn: job.finishedOn,
                processedOn: job.processedOn,
                attemptsMade: job.attemptsMade,
            }));

            res.json({
                success: true,
                jobs: formattedJobs
            });
        } catch (error: any) {
            logger.error({ error: error.message }, 'Failed to get jobs');
            res.status(500).json({ success: false, error: 'Failed to retrieve jobs' });
        }
    }

    /**
     * Retry a failed job
     */
    static async retryJob(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const job = await scrapeQueue.getJob(id);

            if (!job) {
                res.status(404).json({ success: false, error: 'Job not found' });
                return;
            }

            await job.retry();
            res.json({ success: true, message: 'Job retried successfully' });
        } catch (error: any) {
            logger.error({ error: error.message }, 'Failed to retry job');
            res.status(500).json({ success: false, error: 'Failed to retry job' });
        }
    }

    /**
     * Clean queue (remove jobs)
     */
    static async cleanQueue(req: Request, res: Response): Promise<void> {
        try {
            const { status } = req.params;
            const validStatuses = ['completed', 'failed', 'delayed', 'active', 'wait', 'paused'];

            if (!validStatuses.includes(status)) {
                res.status(400).json({ success: false, error: 'Invalid status' });
                return;
            }

            // Clean jobs older than 0ms (all of them)
            // Note: clean method signature might vary by version, but usually takes grace period
            const cleaned = await scrapeQueue.clean(0, 1000, status as any);

            res.json({ success: true, count: cleaned.length, message: `Cleaned ${cleaned.length} jobs` });
        } catch (error: any) {
            logger.error({ error: error.message }, 'Failed to clean queue');
            res.status(500).json({ success: false, error: 'Failed to clean queue' });
        }
    }
}
