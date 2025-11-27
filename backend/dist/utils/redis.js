"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = __importDefault(require("../config"));
const logger_1 = require("./logger"); // Assuming you have a logger, otherwise console.log
const redisConfig = config_1.default.redis.url
    ? config_1.default.redis.url
    : {
        host: config_1.default.redis.host,
        port: config_1.default.redis.port,
        password: config_1.default.redis.password,
    };
// Create Singleton Connection
exports.redis = new ioredis_1.default(redisConfig, {
    maxRetriesPerRequest: null, // REQUIRED for BullMQ
    family: 6, // Helps with Railway IPv6 networking
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});
exports.redis.on("error", (err) => logger_1.logger.error({ err }, "Redis Error"));
exports.redis.on("connect", () => logger_1.logger.info("Redis Connected"));
exports.redis.on("ready", () => logger_1.logger.info("Redis Ready"));
exports.redis.on("close", () => logger_1.logger.warn("Redis Connection Closed"));
exports.redis.on("reconnecting", (time) => logger_1.logger.warn({ time }, "Redis Reconnecting"));
