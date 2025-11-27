"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookQueue = void 0;
// FILE: src/queues/webhook.queue.ts
const bullmq_1 = require("bullmq");
const redis_1 = require("../utils/redis");
exports.webhookQueue = new bullmq_1.Queue("webhook-delivery", {
    connection: redis_1.redis,
    defaultJobOptions: {
        removeOnComplete: {
            count: 500,
            age: 86400,
        },
        removeOnFail: false,
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2000,
        },
    },
});
