"use strict";
// FILE: src/config/constants.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUEUE_CONFIG = exports.RATE_LIMITS = exports.SCRAPER_DEFAULTS = void 0;
/**
 * Centralized configuration constants
 * Eliminates magic numbers and provides single source of truth
 */
exports.SCRAPER_DEFAULTS = {
    /** Default delay for page hydration (milliseconds) */
    HYDRATION_DELAY: 2000,
    /** Maximum content length to extract (characters) */
    MAX_CONTENT_LENGTH: 20000,
    /** Cache TTL for scrape results (seconds) */
    CACHE_TTL: 3600,
    /** Maximum retry attempts for failed scrapes */
    MAX_RETRIES: 2,
    /** Navigation timeout (milliseconds) */
    TIMEOUT_MS: 30000,
    /**HTML truncation for LLM context (characters) */
    LLM_HTML_MAX_LENGTH: 8000,
};
exports.RATE_LIMITS = {
    FREE: {
        REQUESTS_PER_MINUTE: 10,
        PAGES_PER_MONTH: 100,
        AI_EXTRACTIONS_PER_MONTH: 10,
    },
    BASIC: {
        REQUESTS_PER_MINUTE: 30,
        PAGES_PER_MONTH: 1000,
        AI_EXTRACTIONS_PER_MONTH: 100,
    },
    PRO: {
        REQUESTS_PER_MINUTE: 100,
        PAGES_PER_MONTH: 10000,
        AI_EXTRACTIONS_PER_MONTH: 1000,
    },
    ENTERPRISE: {
        REQUESTS_PER_MINUTE: -1, // Unlimited
        PAGES_PER_MONTH: -1,
        AI_EXTRACTIONS_PER_MONTH: -1,
    },
};
exports.QUEUE_CONFIG = {
    /** Default queue concurrency */
    DEFAULT_CONCURRENCY: 5,
    /** Job removal on completion (keep last N) */
    REMOVE_ON_COMPLETE: 100,
    /** Job removal on failure (keep last N) */
    REMOVE_ON_FAIL: 50,
};
