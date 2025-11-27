"use strict";
// FILE: src/index.ts
// Main entry point for npm package consumers
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = exports.logger = exports.webhookQueue = exports.scrapeQueue = exports.WebhookSigner = exports.UltraScraperClient = void 0;
var UltraScraperClient_1 = require("./client/UltraScraperClient");
Object.defineProperty(exports, "UltraScraperClient", { enumerable: true, get: function () { return UltraScraperClient_1.UltraScraperClient; } });
var signer_1 = require("./handlers/webhook/signer");
Object.defineProperty(exports, "WebhookSigner", { enumerable: true, get: function () { return signer_1.WebhookSigner; } });
// Export queue instances for advanced users
var queue_1 = require("./jobs/queue");
Object.defineProperty(exports, "scrapeQueue", { enumerable: true, get: function () { return queue_1.scrapeQueue; } });
var webhook_queue_1 = require("./queues/webhook.queue");
Object.defineProperty(exports, "webhookQueue", { enumerable: true, get: function () { return webhook_queue_1.webhookQueue; } });
// Export utilities
var logger_1 = require("./utils/logger");
Object.defineProperty(exports, "logger", { enumerable: true, get: function () { return logger_1.logger; } });
var redis_1 = require("./utils/redis");
Object.defineProperty(exports, "redis", { enumerable: true, get: function () { return redis_1.redis; } });
