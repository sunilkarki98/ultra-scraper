// FILE: src/queues/webhook.queue.ts
import { Queue } from "bullmq";
import { redis } from "../utils/redis";
import { logger } from "../utils/logger";

export interface WebhookJobData {
    url: string;
    payload: Record<string, any>;
    secret?: string;
    timestamp: string;
    jobId: string;
}

export const webhookQueue = new Queue<WebhookJobData>("webhook-delivery", {
    connection: redis,
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
