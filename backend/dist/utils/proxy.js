"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllProxies = exports.getNextProxy = void 0;
// FILE: src/utils/proxy.ts
const config_1 = __importDefault(require("../config"));
// Split comma-separated string into an array
const rawProxies = config_1.default.scraping.proxies || "";
const proxies = rawProxies
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
let currentProxyIndex = 0;
const getNextProxy = () => {
    if (proxies.length === 0)
        return undefined;
    const proxy = proxies[currentProxyIndex];
    // Round-robin rotation
    currentProxyIndex = (currentProxyIndex + 1) % proxies.length;
    return proxy;
};
exports.getNextProxy = getNextProxy;
const getAllProxies = () => {
    return proxies;
};
exports.getAllProxies = getAllProxies;
