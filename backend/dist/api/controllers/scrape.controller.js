"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrapeController = void 0;
const queue_1 = require("../../jobs/queue");
const redis_1 = require("../../utils/redis");
const logger_1 = require("../../utils/logger");
const bullmq_1 = require("bullmq");
const security_1 = require("../../utils/security");
const user_service_1 = require("../../services/user.service");
class ScrapeController {
    /**
     * POST /scrape
     * Triggers a job via JSON body
     */
    static async triggerScrape(req, res, next) {
        try {
            // Logic: Input is already validated by middleware (see next step)
            const { url, options } = req.body;
            const job = await (0, queue_1.addScrapeJob)(url, options);
            // 🛡️ SECURITY CHECK (Async)
            const isSafe = await security_1.SecurityGuard.isSafeUrl(url);
            if (!isSafe) {
                return res.status(403).json({
                    success: false,
                    error: "Forbidden: The provided URL is restricted or resolves to a private network.",
                });
            }
            logger_1.logger.info({ jobId: job.id, url }, "📥 Job accepted (POST)");
            // Track usage if user is authenticated
            if (req.user) {
                await user_service_1.UserService.trackUsage(req.user.id, 'api');
                await user_service_1.UserService.trackUsage(req.user.id, 'page');
                if (options?.useAI) {
                    await user_service_1.UserService.trackUsage(req.user.id, 'ai');
                }
            }
            res.status(202).json({
                success: true,
                jobId: job.id,
                statusUrl: `/job/${job.id}`,
            });
        }
        catch (error) {
            next(error); // Pass to global error handler
        }
    }
    /**
     * GET /scrape
     * Triggers a job via Query Params (Convenience endpoint)
     */
    static async triggerScrapeViaGet(req, res, next) {
        try {
            // Query params are validated/transformed by middleware already
            // We need to remap the flat query params to our options object
            const query = req.query;
            const url = query.url;
            const options = {
                mobile: query.mobile,
                waitForSelector: query.wait,
                hydrationDelay: query.delay,
                proxy: query.proxy,
            };
            const job = await (0, queue_1.addScrapeJob)(url, options);
            logger_1.logger.info({ jobId: job.id, url }, "📥 Job accepted (GET)");
            res.status(202).json({
                success: true,
                jobId: job.id,
                statusUrl: `/job/${job.id}`,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /job/:id
     * Checks status and retrieves result
     */
    static async getJobStatus(req, res, next) {
        try {
            const { id } = req.params;
            const job = await queue_1.scrapeQueue.getJob(id);
            if (!job) {
                res.status(404).json({ success: false, error: "Job not found" });
                return;
            }
            const state = await job.getState();
            const result = job.returnvalue;
            const failedReason = job.failedReason;
            // Logic: Fetch full JSON from Redis if job is done
            let fullData = result;
            if (state === "completed" && result) {
                const cacheKey = `scrape:${job.data.url}`;
                const cached = await redis_1.redis.get(cacheKey);
                if (cached)
                    fullData = JSON.parse(cached);
            }
            res.status(200).json({
                success: true,
                jobId: id,
                state,
                result: state === "completed" ? fullData : null,
                error: failedReason || null,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async triggerAndReturn(req, res, next) {
        try {
            const { url, options } = req.body;
            const job = await (0, queue_1.addScrapeJob)(url, options);
            // If ?sync=true is NOT passed, behave normally
            if (req.query.sync !== "true") {
                return res
                    .status(202)
                    .json({ success: true, jobId: job.id, statusUrl: `/job/${job.id}` });
            }
            // --- SYNC MODE LOGIC ---
            const queueEvents = new bullmq_1.QueueEvents("scrape-queue", {
                connection: redis_1.redis,
            });
            try {
                logger_1.logger.info({ jobId: job.id }, "⏳ Waiting for job completion (Sync Mode)...");
                // Wait max 60 seconds
                await job.waitUntilFinished(queueEvents, 60000);
                // Fetch result from Redis (because job.returnvalue might be partial)
                const cacheKey = `scrape:${url}`;
                const cached = await redis_1.redis.get(cacheKey);
                const finalData = cached ? JSON.parse(cached) : job.returnvalue;
                return res.status(200).json({ success: true, data: finalData });
            }
            catch (err) {
                return res
                    .status(504)
                    .json({ success: false, error: "Timeout or Job Failed" });
            }
            finally {
                await queueEvents.close(); // Clean up listener
            }
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ScrapeController = ScrapeController;
