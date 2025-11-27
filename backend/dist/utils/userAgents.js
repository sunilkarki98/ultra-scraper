"use strict";
// FILE: src/utils/userAgents.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomUserAgent = exports.getRandomMobileUserAgent = exports.getRandomDesktopUserAgent = void 0;
const desktopAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
];
const mobileAgents = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
];
const getRandomDesktopUserAgent = () => {
    return desktopAgents[Math.floor(Math.random() * desktopAgents.length)];
};
exports.getRandomDesktopUserAgent = getRandomDesktopUserAgent;
const getRandomMobileUserAgent = () => {
    return mobileAgents[Math.floor(Math.random() * mobileAgents.length)];
};
exports.getRandomMobileUserAgent = getRandomMobileUserAgent;
const getRandomUserAgent = (mobile = false) => {
    return mobile ? (0, exports.getRandomMobileUserAgent)() : (0, exports.getRandomDesktopUserAgent)();
};
exports.getRandomUserAgent = getRandomUserAgent;
