import Redis from "ioredis";
import config from "../config";
import { logger } from "./logger"; // Assuming you have a logger, otherwise console.log

const redisConfig = config.redis.url
  ? config.redis.url
  : {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
    };

// Create Singleton Connection
export const redis = new Redis(redisConfig as any, {
  maxRetriesPerRequest: null, // REQUIRED for BullMQ
  family: 6, // Helps with Railway IPv6 networking
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on("error", (err) => logger.error({ err }, "Redis Error"));
redis.on("connect", () => logger.info("Redis Connected"));
redis.on("ready", () => logger.info("Redis Ready"));
redis.on("close", () => logger.warn("Redis Connection Closed"));
redis.on("reconnecting", (time: number) =>
  logger.warn({ time }, "Redis Reconnecting")
);