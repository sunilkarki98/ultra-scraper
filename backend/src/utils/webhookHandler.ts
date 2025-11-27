import { logger } from "./logger";
import crypto from "crypto";

export class WebhookHandler {
    /**
     * Generates HMAC-SHA256 signature for payload verification
     */
    private static generateSignature(payload: string, secret: string): string {
        return crypto
            .createHmac("sha256", secret)
            .update(payload)
            .digest("hex");
    }

    /**
     * Sends the scrape result to the specified webhook URL.
     * Includes simple retry logic and optional HMAC signature.
     */
    static async send(
        url: string,
        payload: any,
        secret?: string,
        attempt = 1
    ): Promise<void> {
        try {
            logger.info(`🪝 Sending webhook to ${url} (Attempt ${attempt})`);

            const payloadString = JSON.stringify(payload);
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
                "User-Agent": "Ultra-Scraper-Webhook/1.0"
            };

            // Add HMAC signature if secret provided
            if (secret) {
                const signature = this.generateSignature(payloadString, secret);
                headers["X-Webhook-Signature"] = `sha256=${signature}`;
                logger.debug(`🔐 Webhook signed with HMAC-SHA256`);
            }

            const response = await fetch(url, {
                method: "POST",
                headers,
                body: payloadString,
            });

            if (!response.ok) {
                throw new Error(`Webhook server responded with ${response.status} ${response.statusText}`);
            }

            logger.info(`✅ Webhook delivered successfully to ${url}`);
        } catch (error: any) {
            logger.warn(`⚠️ Webhook delivery failed: ${error.message}`);

            if (attempt < 3) {
                const delay = attempt * 2000;
                logger.info(`Retrying webhook in ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
                return this.send(url, payload, secret, attempt + 1);
            } else {
                logger.error(`❌ Webhook failed after 3 attempts. Giving up.`);
                // We don't throw here to avoid failing the job itself, just log the error.
            }
        }
    }
}
