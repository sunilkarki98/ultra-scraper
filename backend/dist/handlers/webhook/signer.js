"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookSigner = void 0;
// FILE: src/handlers/webhook/signer.ts
const crypto_1 = __importDefault(require("crypto"));
class WebhookSigner {
    sign(payload, secret) {
        return crypto_1.default
            .createHmac("sha256", secret)
            .update(payload)
            .digest("hex");
    }
    verify(payload, signature, secret) {
        const expectedSignature = this.sign(payload, secret);
        return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    }
}
exports.WebhookSigner = WebhookSigner;
