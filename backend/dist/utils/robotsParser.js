"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUrlAllowed = isUrlAllowed;
const robots_parser_1 = __importDefault(require("robots-parser"));
const logger_1 = require("./logger");
const ROBOTS_CACHE = new Map();
/**
 * Fetches and parses the robots.txt for a given URL.
 * Checks if the user agent is allowed to visit the URL.
 */
async function isUrlAllowed(targetUrl, userAgent = '*') {
    try {
        const url = new URL(targetUrl);
        const origin = url.origin;
        const robotsUrl = `${origin}/robots.txt`;
        let robot = ROBOTS_CACHE.get(origin);
        if (!robot) {
            logger_1.logger.info(`Fetching robots.txt from ${robotsUrl}`);
            const response = await fetch(robotsUrl);
            if (response.status >= 400) {
                // If robots.txt doesn't exist, assume everything is allowed
                logger_1.logger.warn(`robots.txt not found for ${origin} (Status ${response.status}). Allowing all.`);
                return true;
            }
            const robotsTxtContent = await response.text();
            robot = (0, robots_parser_1.default)(robotsUrl, robotsTxtContent);
            ROBOTS_CACHE.set(origin, robot);
        }
        const isAllowed = robot.isAllowed(targetUrl, userAgent);
        // robots-parser returns undefined if no rule matches, which usually means allowed
        return isAllowed === undefined ? true : isAllowed;
    }
    catch (error) {
        logger_1.logger.error(`Failed to check robots.txt for ${targetUrl}: ${error.message}`);
        // Fail open (allow) if we can't check, or fail closed? 
        // Usually for a scraper, if we can't check robots.txt due to network error, 
        // we might want to be cautious, but here we'll default to allowing to avoid blocking on transient errors.
        return true;
    }
}
