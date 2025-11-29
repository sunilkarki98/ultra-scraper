"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ProxyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyService = void 0;
const common_1 = require("@nestjs/common");
let ProxyService = ProxyService_1 = class ProxyService {
    proxies = [];
    logger = new common_1.Logger(ProxyService_1.name);
    onModuleInit() {
        this.loadProxies();
    }
    loadProxies() {
        const proxyList = process.env.PROXY_LIST || '';
        if (!proxyList) {
            this.logger.warn('No PROXY_LIST environment variable found. Scraper will run without proxies.');
            return;
        }
        this.proxies = proxyList.split(',').map((url) => ({
            url: url.trim(),
            failures: 0,
            lastUsed: 0,
            disabledUntil: 0,
        })).filter(p => p.url.length > 0);
        this.logger.log(`Loaded ${this.proxies.length} proxies.`);
    }
    getNext() {
        const now = Date.now();
        // Filter active proxies
        const activeProxies = this.proxies.filter(p => p.disabledUntil < now);
        if (activeProxies.length === 0) {
            if (this.proxies.length > 0) {
                this.logger.warn('All proxies are temporarily disabled. Returning the one with earliest recovery time.');
                // Fallback: Return the one that recovers soonest
                return this.proxies.sort((a, b) => a.disabledUntil - b.disabledUntil)[0].url;
            }
            return undefined;
        }
        // Random distribution
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
                this.logger.warn(`Proxy ${proxyUrl} disabled for 5 minutes due to 3 consecutive failures.`);
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
            this.logger.log(`Added new proxy: ${url}`);
        }
    }
    removeProxy(url) {
        const index = this.proxies.findIndex(p => p.url === url);
        if (index !== -1) {
            this.proxies.splice(index, 1);
            this.logger.log(`Removed proxy: ${url}`);
        }
    }
};
exports.ProxyService = ProxyService;
exports.ProxyService = ProxyService = ProxyService_1 = __decorate([
    (0, common_1.Injectable)()
], ProxyService);
