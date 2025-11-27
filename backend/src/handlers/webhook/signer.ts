// FILE: src/handlers/webhook/signer.ts
import crypto from "crypto";

export class WebhookSigner {
    sign(payload: string, secret: string): string {
        return crypto
            .createHmac("sha256", secret)
            .update(payload)
            .digest("hex");
    }

    verify(payload: string, signature: string, secret: string): boolean {
        const expectedSignature = this.sign(payload, secret);

        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    }
}
