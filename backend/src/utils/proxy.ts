// FILE: src/utils/proxy.ts
import config from "../config";

// Split comma-separated string into an array
const rawProxies = config.scraping.proxies || "";
const proxies = rawProxies
  .split(",")
  .map((p) => p.trim())
  .filter((p) => p.length > 0);

let currentProxyIndex = 0;

export const getNextProxy = (): string | undefined => {
  if (proxies.length === 0) return undefined;

  const proxy = proxies[currentProxyIndex];
  // Round-robin rotation
  currentProxyIndex = (currentProxyIndex + 1) % proxies.length;

  return proxy;
};
export const getAllProxies = (): string[] => {
  return proxies;
};
