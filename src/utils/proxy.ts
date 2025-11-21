import config from '../config';

const rawProxies = (config.scraping as any).proxies;
const proxies = rawProxies ? rawProxies.split(',') : [];
let currentProxyIndex = 0;

export const getNextProxy = (): string | undefined => {
  if (proxies.length === 0) return undefined;
  const proxy = proxies[currentProxyIndex];
  currentProxyIndex = (currentProxyIndex + 1) % proxies.length;
  return proxy.trim();
};