"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityGuard = void 0;
// FILE: src/utils/security.ts
const promises_1 = __importDefault(require("dns/promises"));
const url_1 = require("url");
const ipaddr_js_1 = __importDefault(require("ipaddr.js"));
const logger_1 = require("./logger");
class SecurityGuard {
    /**
     * Validates a URL against SSRF attacks.
     * 1. Parses the URL.
     * 2. Resolves the Hostname to an IP.
     * 3. Checks if the IP is Public (Safe) or Private (Unsafe).
     */
    static async isSafeUrl(inputUrl) {
        try {
            const parsed = new url_1.URL(inputUrl);
            // 1. Block non-HTTP protocols (file://, gopher://, etc.)
            if (!["http:", "https:"].includes(parsed.protocol)) {
                logger_1.logger.warn({ url: inputUrl }, "Blocked: Invalid Protocol");
                return false;
            }
            // 2. Resolve Hostname to IP
            // This defeats Hex/Octal obfuscation because DNS resolves it to a standard IP
            const lookup = await promises_1.default.lookup(parsed.hostname);
            const ip = lookup.address;
            // 3. Parse IP using ipaddr.js (Handles IPv4 and IPv6)
            const parsedIp = ipaddr_js_1.default.parse(ip);
            // 4. Check Range
            const range = parsedIp.range();
            // List of Dangerous Ranges
            const UNSAFE_RANGES = [
                "loopback", // 127.0.0.1, ::1
                "private", // 192.168.x, 10.x, 172.16.x
                "linkLocal", // 169.254.x (AWS Metadata)
                "uniqueLocal", // IPv6 Private
                "reserved",
                "unspecified", // 0.0.0.0
            ];
            if (UNSAFE_RANGES.includes(range)) {
                logger_1.logger.warn({ url: inputUrl, resolvedIp: ip, range }, "🚨 Blocked: Internal Network Access Attempt");
                return false;
            }
            return true;
        }
        catch (error) {
            // If DNS fails or URL is invalid, fail safe (Block it)
            logger_1.logger.error({ url: inputUrl, err: error }, "Security Check Failed");
            return false;
        }
    }
}
exports.SecurityGuard = SecurityGuard;
