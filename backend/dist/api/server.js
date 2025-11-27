"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// FILE: src/api/server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const api_1 = require("@bull-board/api");
const bullMQAdapter_1 = require("@bull-board/api/bullMQAdapter");
const express_2 = require("@bull-board/express");
const config_1 = __importDefault(require("../config"));
const logger_1 = require("../utils/logger");
const queue_1 = require("../jobs/queue");
const BrowserManager_1 = require("../browser/BrowserManager");
const puppeteer_1 = require("../browser/puppeteer");
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
// 1. Global Middleware
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
// 2. Dashboard Setup
const serverAdapter = new express_2.ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");
(0, api_1.createBullBoard)({
    queues: [new bullMQAdapter_1.BullMQAdapter(queue_1.scrapeQueue)],
    serverAdapter: serverAdapter,
});
app.use("/admin/queues", serverAdapter.getRouter());
// 2.5. Serve static files (admin dashboard)
app.use(express_1.default.static("public"));
// 3. Mount API Routes
app.use("/", routes_1.default);
// 4. Global Error Handler (Fallthrough)
app.use((err, req, res, next) => {
    logger_1.logger.error(err.stack);
    res
        .status(500)
        .json({ success: false, error: err.message || "Internal Server Error" });
});
// 5. Start Server
const startServer = async () => {
    try {
        logger_1.logger.info("🔄 Initializing Browsers...");
        await BrowserManager_1.BrowserManager.init(); // Pre-warm Playwright
        app.listen(config_1.default.port, () => {
            logger_1.logger.info(`🚀 Server listening on http://localhost:${config_1.default.port}`);
            logger_1.logger.info(`📊 Dashboard: http://localhost:${config_1.default.port}/admin/queues`);
        });
    }
    catch (error) {
        logger_1.logger.fatal(error, "Failed to start server");
        process.exit(1);
    }
};
// Graceful Shutdown
process.on("SIGTERM", async () => {
    logger_1.logger.info("🛑 SIGTERM received. Shutting down...");
    await BrowserManager_1.BrowserManager.closeBrowser();
    await puppeteer_1.PuppeteerManager.shutdownBrowser();
    process.exit(0);
});
startServer();
