// FILE: src/api/routes.ts
import { Router } from "express";
import { ScrapeController } from "./controllers/scrape.controller";
import { validate } from "./middlewares/validation.middleware";
import {
  ScrapeBodySchema,
  ScrapeQuerySchema,
} from "./validators/scrape.validator";
import { optionalAuth } from "../middlewares/auth.middleware";
import { rateLimitByPlan } from "../middlewares/rateLimit.middleware";
import { checkQuota } from "../middlewares/quota.middleware";
import adminRoutes from "./routes/admin.routes";
import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes";

const router = Router();

// Health Check
router.get("/health", (req, res) => res.json({ status: "ok" }));

// Auth Routes (Google OAuth)
router.use("/auth", authRoutes);

// Admin Routes
router.use("/admin", adminRoutes);

// User Management Routes
router.use("/users", userRoutes);

// POST /scrape - Main Endpoint (with optional auth, rate limiting, quota)
router.post(
  "/scrape",
  optionalAuth, // Optional: allows both authenticated and anonymous users
  rateLimitByPlan, // Rate limit based on plan (or IP for anonymous)
  checkQuota, // Check monthly quota for authenticated users
  validate(ScrapeBodySchema, "body"),
  ScrapeController.triggerScrape
);

// GET /scrape - Quick Endpoint (with optional auth and rate limiting)
router.get(
  "/scrape",
  optionalAuth,
  rateLimitByPlan,
  checkQuota,
  validate(ScrapeQuerySchema, "query"),
  ScrapeController.triggerScrapeViaGet
);

// GET /job/:id - Status Check (no auth required to check job status)
router.get("/job/:id", ScrapeController.getJobStatus);

export default router;
