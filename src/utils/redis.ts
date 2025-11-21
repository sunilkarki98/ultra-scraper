import Redis from "ioredis";
import { logger } from "./logger";

// If Railway provides a single Redis URL:
const redisUrl = process.env.REDIS_URL;

// Create Redis client
export const redis = redisUrl
  ? new Redis(redisUrl, { maxRetriesPerRequest: null }) // Railway deployment
  : new Redis({                                         // Local development
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
    });

redis.on("error", (err) => logger.error({ err }, "Redis connection error"));
redis.on("connect", () => logger.info("Redis connected"));
