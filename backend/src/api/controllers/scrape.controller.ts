// FILE: src/api/controllers/scrape.controller.ts
import { Request, Response, NextFunction } from "express";
import { addScrapeJob, scrapeQueue } from "../../jobs/queue";
import { redis } from "../../utils/redis";
import { logger } from "../../utils/logger";
import { QueueEvents } from "bullmq";
import { SecurityGuard } from "../../utils/security";
import { UserService } from "../../services/user.service";

export class ScrapeController {
  /**
   * POST /scrape
   * Triggers a job via JSON body
   */
  static async triggerScrape(req: Request, res: Response, next: NextFunction) {
    try {
      // Logic: Input is already validated by middleware (see next step)
      const { url, options } = req.body;

      const job = await addScrapeJob(url, options);
      // 🛡️ SECURITY CHECK (Async)
      const isSafe = await SecurityGuard.isSafeUrl(url);
      if (!isSafe) {
        return res.status(403).json({
          success: false,
          error:
            "Forbidden: The provided URL is restricted or resolves to a private network.",
        });
      }

      logger.info({ jobId: job.id, url }, "📥 Job accepted (POST)");

      // Track usage if user is authenticated
      if (req.user) {
        await UserService.trackUsage(req.user.id, 'api');
        await UserService.trackUsage(req.user.id, 'page');
        if (options?.useAI) {
          await UserService.trackUsage(req.user.id, 'ai');
        }
      }

      res.status(202).json({
        success: true,
        jobId: job.id,
        statusUrl: `/job/${job.id}`,
      });
    } catch (error) {
      next(error); // Pass to global error handler
    }
  }

  /**
   * GET /scrape
   * Triggers a job via Query Params (Convenience endpoint)
   */
  static async triggerScrapeViaGet(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Query params are validated/transformed by middleware already
      // We need to remap the flat query params to our options object
      const query = req.query as any;
      const url = query.url;

      const options = {
        mobile: query.mobile,
        waitForSelector: query.wait,
        hydrationDelay: query.delay,
        proxy: query.proxy,
      };

      const job = await addScrapeJob(url, options);

      logger.info({ jobId: job.id, url }, "📥 Job accepted (GET)");

      res.status(202).json({
        success: true,
        jobId: job.id,
        statusUrl: `/job/${job.id}`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /job/:id
   * Checks status and retrieves result
   */
  static async getJobStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const job = await scrapeQueue.getJob(id);

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
        const cached = await redis.get(cacheKey);
        if (cached) fullData = JSON.parse(cached);
      }

      res.status(200).json({
        success: true,
        jobId: id,
        state,
        result: state === "completed" ? fullData : null,
        error: failedReason || null,
      });
    } catch (error) {
      next(error);
    }
  }

  static async triggerAndReturn(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { url, options } = req.body;
      const job = await addScrapeJob(url, options);

      // If ?sync=true is NOT passed, behave normally
      if (req.query.sync !== "true") {
        return res
          .status(202)
          .json({ success: true, jobId: job.id, statusUrl: `/job/${job.id}` });
      }

      // --- SYNC MODE LOGIC ---
      const queueEvents = new QueueEvents("scrape-queue", {
        connection: redis,
      });

      try {
        logger.info(
          { jobId: job.id },
          "⏳ Waiting for job completion (Sync Mode)..."
        );

        // Wait max 60 seconds
        await job.waitUntilFinished(queueEvents, 60000);

        // Fetch result from Redis (because job.returnvalue might be partial)
        const cacheKey = `scrape:${url}`;
        const cached = await redis.get(cacheKey);
        const finalData = cached ? JSON.parse(cached) : job.returnvalue;

        return res.status(200).json({ success: true, data: finalData });
      } catch (err) {
        return res
          .status(504)
          .json({ success: false, error: "Timeout or Job Failed" });
      } finally {
        await queueEvents.close(); // Clean up listener
      }
    } catch (error) {
      next(error);
    }
  }
}
