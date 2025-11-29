"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyRotator = void 0;
const logger_1 = require("./logger");
class ProxyRotator {
    proxies = [];
    static instance;
    constructor() {
        this.loadProxies();
    }
    static getInstance() {
        if (!ProxyRotator.instance) {
            ProxyRotator.instance = new ProxyRotator();
        }
        return ProxyRotator.instance;
    }
    loadProxies() {
        const proxyList = process.env.PROXY_LIST || '';
        if (!proxyList) {
            logger_1.logger.warn('No PROXY_LIST environment variable found. Scraper will run without proxies.');
            return;
        }
        this.proxies = proxyList.split(',').map((url) => ({
            url: url.trim(),
            failures: 0,
            lastUsed: 0,
            disabledUntil: 0,
        })).filter(p => p.url.length > 0);
        logger_1.logger.info(`Loaded ${this.proxies.length} proxies.`);
    }
    getNext() {
        const now = Date.now();
        // Filter active proxies
        const activeProxies = this.proxies.filter(p => p.disabledUntil < now);
        if (activeProxies.length === 0) {
            if (this.proxies.length > 0) {
                logger_1.logger.warn('All proxies are temporarily disabled. Returning the one with earliest recovery time.');
                // Fallback: Return the one that recovers soonest
                return this.proxies.sort((a, b) => a.disabledUntil - b.disabledUntil)[0].url;
            }
            return undefined;
        }
        // Simple Round-Robin or Random. Let's do Random for better distribution.
        const proxy = activeProxies[Math.floor(Math.random() * activeProxies.length)];
        proxy.lastUsed = now;
        return proxy.url;
    }
    reportSuccess(proxyUrl) {
        const proxy = this.proxies.find(p => p.url === proxyUrl);
        if (proxy) {
            proxy.failures = 0; // Reset failures on success
        }
    }
    reportFailure(proxyUrl) {
        const proxy = this.proxies.find(p => p.url === proxyUrl);
        if (proxy) {
            proxy.failures++;
            if (proxy.failures >= 3) {
                // Disable for 5 minutes after 3 failures
                proxy.disabledUntil = Date.now() + 5 * 60 * 1000;
                logger_1.logger.warn(`Proxy ${proxyUrl} disabled for 5 minutes due to 3 consecutive failures.`);
                proxy.failures = 0; // Reset count so it gets a fresh start later
            }
        }
    }
    getAllProxies() {
        return this.proxies;
    }
    addProxy(url) {
        if (!this.proxies.find(p => p.url === url)) {
            this.proxies.push({
                url: url.trim(),
                failures: 0,
                lastUsed: 0,
                disabledUntil: 0,
            });
            logger_1.logger.info(`Added new proxy: ${url}`);
        }
    }
    removeProxy(url) {
        const index = this.proxies.findIndex(p => p.url === url);
        if (index !== -1) {
            this.proxies.splice(index, 1);
            logger_1.logger.info(`Removed proxy: ${url}`);
        }
    }
}
exports.ProxyRotator = ProxyRotator;
