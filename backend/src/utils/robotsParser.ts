import robotsParser from 'robots-parser';
import { logger } from './logger';

const ROBOTS_CACHE = new Map<string, any>();

/**
 * Fetches and parses the robots.txt for a given URL.
 * Checks if the user agent is allowed to visit the URL.
 */
export async function isUrlAllowed(targetUrl: string, userAgent: string = '*'): Promise<boolean> {
  try {
    const url = new URL(targetUrl);
    const origin = url.origin;
    const robotsUrl = `${origin}/robots.txt`;

    let robot = ROBOTS_CACHE.get(origin);

    if (!robot) {
      logger.info(`Fetching robots.txt from ${robotsUrl}`);
      const response = await fetch(robotsUrl);
      
      if (response.status >= 400) {
        // If robots.txt doesn't exist, assume everything is allowed
        logger.warn(`robots.txt not found for ${origin} (Status ${response.status}). Allowing all.`);
        return true; 
      }

      const robotsTxtContent = await response.text();
      robot = robotsParser(robotsUrl, robotsTxtContent);
      ROBOTS_CACHE.set(origin, robot);
    }

    const isAllowed = robot.isAllowed(targetUrl, userAgent);
    
    // robots-parser returns undefined if no rule matches, which usually means allowed
    return isAllowed === undefined ? true : isAllowed;

  } catch (error: any) {
    logger.error(`Failed to check robots.txt for ${targetUrl}: ${error.message}`);
    // Fail open (allow) if we can't check, or fail closed? 
    // Usually for a scraper, if we can't check robots.txt due to network error, 
    // we might want to be cautious, but here we'll default to allowing to avoid blocking on transient errors.
    return true; 
  }
}
