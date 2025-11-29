"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleScraper = void 0;
const baseScraper_1 = require("./baseScraper");
const logger_1 = require("../utils/logger");
class GoogleScraper extends baseScraper_1.BaseScraper {
    constructor(proxyService) {
        super(proxyService);
    }
    async scrape(options) {
        if (!this.page)
            throw new Error("Browser Page not initialized");
        // 1. Handle Cookie Consent
        await this.handleConsent(this.page);
        // 2. Wait for Results
        try {
            await this.page.waitForSelector('#search', { timeout: 10000 });
        }
        catch (e) {
            logger_1.logger.warn("Google search results selector not found, might be a captcha or different layout.");
        }
        // 3. Extract Data
        const organicResults = await this.extractOrganicResults(this.page);
        const localPackResults = await this.extractLocalPack(this.page);
        // 4. Construct Result
        const title = await this.page.title();
        // Combine results into a structured format
        // We map local pack results to 'leads' or a custom field if we had one.
        // For now, we'll put them in 'leads.socialLinks' or similar, or just append to content/links.
        // To fit the existing ScrapeResult interface, we'll be creative.
        const links = [
            ...organicResults.map(r => ({ text: r.title, href: r.link })),
            ...localPackResults.map(r => ({ text: `[BUSINESS] ${r.name} (${r.rating}⭐)`, href: r.website || '' }))
        ];
        const content = `
            Organic Results:
            ${organicResults.map(r => `- ${r.title}: ${r.snippet}`).join('\n')}

            Local Businesses:
            ${localPackResults.map(r => `- ${r.name} (${r.rating}): ${r.address} ${r.phone ? '| ' + r.phone : ''}`).join('\n')}
        `;
        return {
            title,
            description: `Google Search Results for: ${options.url}`,
            h1: 'Google Search',
            content,
            links,
            leads: {
                emails: [],
                phones: localPackResults.map(r => r.phone).filter(p => p !== null),
                socialLinks: []
            },
            jsonLd: []
        };
    }
    async handleConsent(page) {
        try {
            // "Before you continue" popup
            const consentButton = await page.$('button[aria-label="Accept all"]'); // This selector changes often
            if (consentButton) {
                await consentButton.click();
                await page.waitForTimeout(1000);
            }
            else {
                // Try alternate selectors
                const buttons = await page.$$('button');
                for (const btn of buttons) {
                    const text = await btn.innerText();
                    if (text.includes('Accept all') || text.includes('I agree')) {
                        await btn.click();
                        await page.waitForTimeout(1000);
                        break;
                    }
                }
            }
        }
        catch (e) {
            // Ignore, maybe no consent needed
        }
    }
    async extractOrganicResults(page) {
        return page.evaluate(() => {
            const results = [];
            const elements = document.querySelectorAll('.g');
            elements.forEach(el => {
                const titleEl = el.querySelector('h3');
                const linkEl = el.querySelector('a');
                const snippetEl = el.querySelector('.VwiC3b'); // Common snippet class, but flaky
                if (titleEl && linkEl) {
                    results.push({
                        title: titleEl.textContent || '',
                        link: linkEl.getAttribute('href') || '',
                        snippet: snippetEl?.textContent || ''
                    });
                }
            });
            return results;
        });
    }
    async extractLocalPack(page) {
        return page.evaluate(() => {
            const businesses = [];
            // This is a heuristic. Google Maps/Local pack structure is complex and dynamic.
            // We look for common containers.
            // Often inside a div with class 'VkpGBb' or similar for the map list.
            // Strategy: Look for elements that have a rating star and a phone number pattern nearby.
            // Or look for specific known classes (which rot).
            // Let's try a generic approach for the "3-pack"
            const items = document.querySelectorAll('[jscontroller="AtSb"]'); // Often the container for a map item
            if (items.length > 0) {
                items.forEach(el => {
                    const name = el.querySelector('[role="heading"]')?.textContent || '';
                    const rating = el.querySelector('.Yi4kAD')?.textContent || ''; // Class for rating number
                    const containerText = el.textContent || '';
                    // Simple extraction from text blob if specific selectors fail
                    const phoneMatch = containerText.match(/(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/);
                    const phone = phoneMatch ? phoneMatch[0] : null;
                    const websiteEl = el.querySelector('a[href^="http"]:not([href*="google"])');
                    const website = websiteEl ? websiteEl.getAttribute('href') : null;
                    if (name) {
                        businesses.push({
                            name,
                            rating,
                            address: '', // Hard to isolate address without strict selectors
                            phone,
                            website
                        });
                    }
                });
            }
            else {
                // Fallback: Try to find elements that look like business cards
                // Look for the "Website" button
                const websiteButtons = Array.from(document.querySelectorAll('a')).filter(a => a.textContent === 'Website');
                websiteButtons.forEach(btn => {
                    // Traverse up to find the container
                    const container = btn.closest('.VkpGBb');
                    if (container) {
                        const name = container.querySelector('[role="heading"]')?.textContent || '';
                        const rating = container.querySelector('.Yi4kAD')?.textContent || '';
                        const phoneMatch = container.textContent?.match(/(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/);
                        businesses.push({
                            name,
                            rating,
                            address: '',
                            phone: phoneMatch ? phoneMatch[0] : null,
                            website: btn.getAttribute('href')
                        });
                    }
                });
            }
            return businesses;
        });
    }
}
exports.GoogleScraper = GoogleScraper;
