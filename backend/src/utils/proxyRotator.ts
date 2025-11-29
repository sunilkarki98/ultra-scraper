import { logger } from './logger';

interface ProxyStatus {
    url: string;
    failures: number;
    lastUsed: number;
    disabledUntil: number;
}

export class ProxyRotator {
    private proxies: ProxyStatus[] = [];
    private static instance: ProxyRotator;

    private constructor() {
        this.loadProxies();
    }

    public static getInstance(): ProxyRotator {
        if (!ProxyRotator.instance) {
            ProxyRotator.instance = new ProxyRotator();
        }
        return ProxyRotator.instance;
    }

    private loadProxies() {
        const proxyList = process.env.PROXY_LIST || '';
        if (!proxyList) {
            logger.warn('No PROXY_LIST environment variable found. Scraper will run without proxies.');
            return;
        }

        this.proxies = proxyList.split(',').map((url) => ({
            url: url.trim(),
            failures: 0,
            lastUsed: 0,
            disabledUntil: 0,
        })).filter(p => p.url.length > 0);

        logger.info(`Loaded ${this.proxies.length} proxies.`);
    }

    public getNext(): string | undefined {
        const now = Date.now();

        // Filter active proxies
        const activeProxies = this.proxies.filter(p => p.disabledUntil < now);

        if (activeProxies.length === 0) {
            if (this.proxies.length > 0) {
                logger.warn('All proxies are temporarily disabled. Returning the one with earliest recovery time.');
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

    public reportSuccess(proxyUrl: string) {
        const proxy = this.proxies.find(p => p.url === proxyUrl);
        if (proxy) {
            proxy.failures = 0; // Reset failures on success
        }
    }

    public reportFailure(proxyUrl: string) {
        const proxy = this.proxies.find(p => p.url === proxyUrl);
        if (proxy) {
            proxy.failures++;
            if (proxy.failures >= 3) {
                // Disable for 5 minutes after 3 failures
                proxy.disabledUntil = Date.now() + 5 * 60 * 1000;
                logger.warn(`Proxy ${proxyUrl} disabled for 5 minutes due to 3 consecutive failures.`);
                proxy.failures = 0; // Reset count so it gets a fresh start later
            }
        }
    }

    public getAllProxies(): ProxyStatus[] {
        return this.proxies;
    }

    public addProxy(url: string) {
        if (!this.proxies.find(p => p.url === url)) {
            this.proxies.push({
                url: url.trim(),
                failures: 0,
                lastUsed: 0,
                disabledUntil: 0,
            });
            logger.info(`Added new proxy: ${url}`);
        }
    }

    public removeProxy(url: string) {
        const index = this.proxies.findIndex(p => p.url === url);
        if (index !== -1) {
            this.proxies.splice(index, 1);
            logger.info(`Removed proxy: ${url}`);
        }
    }
}
