// FILE: src/api/server.ts
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

import config from "../config";
import { logger } from "../utils/logger";
import { scrapeQueue } from "../jobs/queue";
import { BrowserManager } from "../browser/BrowserManager";
import { PuppeteerManager } from "../browser/puppeteer";
import apiRoutes from "./routes";

const app = express();

// 1. Global Middleware
app.use(cors());
app.use(bodyParser.json());

// 2. Dashboard Setup
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");
createBullBoard({
  queues: [new BullMQAdapter(scrapeQueue)],
  serverAdapter: serverAdapter,
});
app.use("/admin/queues", serverAdapter.getRouter());

// 2.5. Serve static files (admin dashboard)
app.use(express.static("public"));

// 3. Mount API Routes
app.use("/", apiRoutes);

// 4. Global Error Handler (Fallthrough)
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    logger.error(err.stack);
    res
      .status(500)
      .json({ success: false, error: err.message || "Internal Server Error" });
  }
);

// 5. Start Server
const startServer = async () => {
  try {
    logger.info("🔄 Initializing Browsers...");
    await BrowserManager.init(); // Pre-warm Playwright

    app.listen(config.port, () => {
      logger.info(`🚀 Server listening on http://localhost:${config.port}`);
      logger.info(`📊 Dashboard: http://localhost:${config.port}/admin/queues`);
    });
  } catch (error) {
    logger.fatal(error, "Failed to start server");
    process.exit(1);
  }
};

// Graceful Shutdown
process.on("SIGTERM", async () => {
  logger.info("🛑 SIGTERM received. Shutting down...");
  await BrowserManager.closeBrowser();
  await PuppeteerManager.shutdownBrowser();
  process.exit(0);
});

startServer();
