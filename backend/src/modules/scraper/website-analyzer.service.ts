import { Injectable, Logger } from '@nestjs/common';

export interface WebsiteAnalysis {
    requiresJavaScript: boolean;
    hasAntiBot: boolean;
    recommendedEngine: 'scrapy' | 'playwright' | 'heavy';
    confidence: number;
    reasons: string[];
}

@Injectable()
export class WebsiteAnalyzerService {
    private readonly logger = new Logger(WebsiteAnalyzerService.name);

    // Known domains that require JavaScript
    private readonly JS_HEAVY_DOMAINS = [
        'facebook.com',
        'twitter.com',
        'instagram.com',
        'linkedin.com',
        'youtube.com',
        'reddit.com',
        'pinterest.com',
        'medium.com',
        'quora.com',
        'stackoverflow.com',
        't.me',
        'telegram.me',
        'telegram.dog',
    ];

    // Known domains with anti-bot protection
    private readonly ANTI_BOT_DOMAINS = [
        'amazon.com',
        'walmart.com',
        'target.com',
        'bestbuy.com',
        'ebay.com',
        'aliexpress.com',
        'alibaba.com',
    ];

    // SPA framework indicators in URL
    private readonly SPA_INDICATORS = [
        '#!',  // Hashbang routing
        '#/',  // Hash routing
        '/app/',
        '/dashboard/',
    ];

    /**
     * Analyze a URL to determine the best scraping engine
     */
    async analyze(url: string): Promise<WebsiteAnalysis> {
        const reasons: string[] = [];
        let requiresJavaScript = false;
        let hasAntiBot = false;
        let recommendedEngine: 'scrapy' | 'playwright' | 'heavy' = 'scrapy';
        let confidence = 0.8; // Default high confidence for Scrapy

        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;

            // Check 1: Known JS-heavy domains
            if (this.isJSHeavyDomain(domain)) {
                requiresJavaScript = true;
                recommendedEngine = 'playwright';
                confidence = 0.9;
                reasons.push(`Known JavaScript-heavy domain: ${domain}`);
            }

            // Check 2: Known anti-bot domains
            if (this.isAntiBotDomain(domain)) {
                hasAntiBot = true;
                recommendedEngine = 'heavy';
                confidence = 0.85;
                reasons.push(`Known anti-bot protection: ${domain}`);
            }

            // Check 3: SPA indicators in URL
            if (this.hasSPAIndicators(url)) {
                requiresJavaScript = true;
                recommendedEngine = 'playwright';
                confidence = 0.75;
                reasons.push('URL contains SPA routing pattern');
            }

            // Check 4: Telegram (special case)
            if (domain.includes('t.me') || domain.includes('telegram.me') || domain.includes('telegram.dog')) {
                recommendedEngine = 'playwright'; // Use TelegramScraper
                confidence = 1.0;
                reasons.push('Telegram requires specialized scraper');
            }

            // Check 5: Google Search (special case)
            if (domain.includes('google.com') && url.includes('/search')) {
                recommendedEngine = 'playwright'; // Use existing GoogleScraper
                confidence = 1.0;
                reasons.push('Google search requires specialized scraper');
            }

            // Check 6: Common static site patterns
            if (this.isLikelyStaticSite(urlObj)) {
                recommendedEngine = 'scrapy';
                confidence = 0.9;
                reasons.push('URL pattern suggests static content');
            }

            // If no specific indicators found, default to Scrapy
            if (reasons.length === 0) {
                reasons.push('No JavaScript or anti-bot indicators detected');
                recommendedEngine = 'scrapy';
                confidence = 0.7; // Lower confidence due to uncertainty
            }

            this.logger.debug(`Analysis for ${url}: engine=${recommendedEngine}, confidence=${confidence}`);

            return {
                requiresJavaScript,
                hasAntiBot,
                recommendedEngine,
                confidence,
                reasons,
            };

        } catch (error: any) {
            this.logger.error(`Failed to analyze URL ${url}: ${error.message}`);
            // On error, default to Playwright (safer option)
            return {
                requiresJavaScript: true,
                hasAntiBot: false,
                recommendedEngine: 'playwright',
                confidence: 0.5,
                reasons: ['Error analyzing URL, defaulting to Playwright'],
            };
        }
    }

    /**
     * Check if domain is known to be JavaScript-heavy
     */
    private isJSHeavyDomain(domain: string): boolean {
        return this.JS_HEAVY_DOMAINS.some(jsDomain =>
            domain.includes(jsDomain)
        );
    }

    /**
     * Check if domain is known to have anti-bot protection
     */
    private isAntiBotDomain(domain: string): boolean {
        return this.ANTI_BOT_DOMAINS.some(botDomain =>
            domain.includes(botDomain)
        );
    }

    /**
     * Check if URL contains SPA routing indicators
     */
    private hasSPAIndicators(url: string): boolean {
        return this.SPA_INDICATORS.some(indicator =>
            url.includes(indicator)
        );
    }

    /**
     * Check if URL pattern suggests static site
     */
    private isLikelyStaticSite(urlObj: URL): boolean {
        const path = urlObj.pathname;
        const staticExtensions = ['.html', '.htm', '.php', '.asp', '.aspx'];
        const blogPatterns = ['/blog/', '/post/', '/article/', '/news/'];

        // Check for static file extensions
        if (staticExtensions.some(ext => path.endsWith(ext))) {
            return true;
        }

        // Check for common blog/CMS patterns (often static or server-rendered)
        if (blogPatterns.some(pattern => path.includes(pattern))) {
            return true;
        }

        // Root domain pages are often static
        if (path === '/' || path === '') {
            return true;
        }

        return false;
    }

    /**
     * Get historical data for a domain (placeholder for future ML integration)
     */
    private async getHistoricalData(domain: string): Promise<any> {
        // TODO: Query database for historical scraping success/failure rates
        // This can be used to improve accuracy over time
        return null;
    }
}
