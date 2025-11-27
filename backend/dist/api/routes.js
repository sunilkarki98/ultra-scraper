"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// FILE: src/api/routes.ts
const express_1 = require("express");
const scrape_controller_1 = require("./controllers/scrape.controller");
const validation_middleware_1 = require("./middlewares/validation.middleware");
const scrape_validator_1 = require("./validators/scrape.validator");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rateLimit_middleware_1 = require("../middlewares/rateLimit.middleware");
const quota_middleware_1 = require("../middlewares/quota.middleware");
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const router = (0, express_1.Router)();
// Health Check
router.get("/health", (req, res) => res.json({ status: "ok" }));
// Admin Routes
router.use("/admin", admin_routes_1.default);
// User Management Routes
router.use("/users", user_routes_1.default);
// POST /scrape - Main Endpoint (with optional auth, rate limiting, quota)
router.post("/scrape", auth_middleware_1.optionalAuth, // Optional: allows both authenticated and anonymous users
rateLimit_middleware_1.rateLimitByPlan, // Rate limit based on plan (or IP for anonymous)
quota_middleware_1.checkQuota, // Check monthly quota for authenticated users
(0, validation_middleware_1.validate)(scrape_validator_1.ScrapeBodySchema, "body"), scrape_controller_1.ScrapeController.triggerScrape);
// GET /scrape - Quick Endpoint (with optional auth and rate limiting)
router.get("/scrape", auth_middleware_1.optionalAuth, rateLimit_middleware_1.rateLimitByPlan, quota_middleware_1.checkQuota, (0, validation_middleware_1.validate)(scrape_validator_1.ScrapeQuerySchema, "query"), scrape_controller_1.ScrapeController.triggerScrapeViaGet);
// GET /job/:id - Status Check (no auth required to check job status)
router.get("/job/:id", scrape_controller_1.ScrapeController.getJobStatus);
exports.default = router;
