import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const configSchema = z.object({
  port: z.coerce.number().default(3000),
  env: z.enum(["development", "production", "test"]).default("development"),
  logLevel: z.string().default("info"),
  redis: z.object({
    host: z.string().default("localhost"),
    port: z.coerce.number().default(6379),
    // PASSWORD is often needed for Railway/Cloud Redis
    password: z.string().optional(),
  }),
  scraping: z.object({
    // FIXED: Added proxies definition here
    proxies: z.string().optional(),
    headless: z.coerce.boolean().default(true),
    concurrency: z.coerce.number().default(3),
  }),
});

export default configSchema.parse({
  port: process.env.PORT,
  env: process.env.NODE_ENV,
  logLevel: process.env.LOG_LEVEL,
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD, // Pass password too
  },
  scraping: {
    // FIXED: Moved proxies here where it belongs
    proxies: process.env.PROXY_LIST,
    headless: process.env.HEADLESS,
    concurrency: process.env.CONCURRENCY,
  },
});
