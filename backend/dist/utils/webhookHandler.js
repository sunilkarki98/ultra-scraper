"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookHandler = void 0;
const logger_1 = require("./logger");
const crypto_1 = __importDefault(require("crypto"));
class WebhookHandler {
    /**
     * Generates HMAC-SHA256 signature for payload verification
     */
    static generateSignature(payload, secret) {
        return crypto_1.default
            .createHmac("sha256", secret)
            .update(payload)
            .digest("hex");
    }
    /**
     * Sends the scrape result to the specified webhook URL.
     * Includes simple retry logic and optional HMAC signature.
     */
    static async send(url, payload, secret, attempt = 1) {
        try {
            logger_1.logger.info(`🪝 Sending webhook to ${url} (Attempt ${attempt})`);
            const payloadString = JSON.stringify(payload);
            const headers = {
                "Content-Type": "application/json",
                "User-Agent": "Ultra-Scraper-Webhook/1.0"
            };
            // Add HMAC signature if secret provided
            if (secret) {
                const signature = this.generateSignature(payloadString, secret);
                headers["X-Webhook-Signature"] = `sha256=${signature}`;
                logger_1.logger.debug(`🔐 Webhook signed with HMAC-SHA256`);
            }
            const response = await fetch(url, {
                method: "POST",
                headers,
                body: payloadString,
            });
            if (!response.ok) {
                throw new Error(`Webhook server responded with ${response.status} ${response.statusText}`);
            }
            logger_1.logger.info(`✅ Webhook delivered successfully to ${url}`);
        }
        catch (error) {
            logger_1.logger.warn(`⚠️ Webhook delivery failed: ${error.message}`);
            if (attempt < 3) {
                const delay = attempt * 2000;
                logger_1.logger.info(`Retrying webhook in ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
                return this.send(url, payload, secret, attempt + 1);
            }
            else {
                logger_1.logger.error(`❌ Webhook failed after 3 attempts. Giving up.`);
                // We don't throw here to avoid failing the job itself, just log the error.
            }
        }
    }
}
exports.WebhookHandler = WebhookHandler;
