// FILE: src/utils/security.ts
import dns from "dns/promises";
import { URL } from "url";
import ipaddr from "ipaddr.js";
import { logger } from "./logger";

export class SecurityGuard {
  /**
   * Validates a URL against SSRF attacks.
   * 1. Parses the URL.
   * 2. Resolves the Hostname to an IP.
   * 3. Checks if the IP is Public (Safe) or Private (Unsafe).
   */
  static async isSafeUrl(inputUrl: string): Promise<boolean> {
    try {
      const parsed = new URL(inputUrl);

      // 1. Block non-HTTP protocols (file://, gopher://, etc.)
      if (!["http:", "https:"].includes(parsed.protocol)) {
        logger.warn({ url: inputUrl }, "Blocked: Invalid Protocol");
        return false;
      }

      // 2. Resolve Hostname to IP
      // This defeats Hex/Octal obfuscation because DNS resolves it to a standard IP
      const lookup = await dns.lookup(parsed.hostname);
      const ip = lookup.address;

      // 3. Parse IP using ipaddr.js (Handles IPv4 and IPv6)
      const parsedIp = ipaddr.parse(ip);

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
        logger.warn(
          { url: inputUrl, resolvedIp: ip, range },
          "🚨 Blocked: Internal Network Access Attempt"
        );
        return false;
      }

      return true;
    } catch (error) {
      // If DNS fails or URL is invalid, fail safe (Block it)
      logger.error({ url: inputUrl, err: error }, "Security Check Failed");
      return false;
    }
  }
}  