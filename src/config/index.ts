import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const configSchema = z.object({
  port: z.coerce.number().default(3000),
  env: z.enum(["development", "production", "test"]).default("development"),
  logLevel: z.string().default("info"),

  redis: z.object({
    // PRIORITY 1 → Railway Redis URL
    url: z.string().optional(),

    // PRIORITY 2 → Manual Host/Port
    host: z.string().default("127.0.0.1"),
    port: z.coerce.number().default(6379),
    password: z.string().optional(),
  }),

  scraping: z.object({
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
    url: process.env.REDIS_URL, // <-- Railway env
    host: process.env.REDIS_HOST, // <-- Manual config
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  },
  scraping: {
    proxies: process.env.PROXY_LIST,
    headless: process.env.HEADLESS,
    concurrency: process.env.CONCURRENCY,
  },
});
