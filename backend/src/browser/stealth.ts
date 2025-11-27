import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Apply stealth plugin to chromium
chromium.use(StealthPlugin());

export const stealthChromium = chromium;