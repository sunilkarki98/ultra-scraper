"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlParser = void 0;
// FILE: src/parsers/htmlParser.ts
const cheerio = __importStar(require("cheerio"));
const logger_1 = require("../utils/logger");
class HtmlParser {
    $;
    constructor(htmlContent) {
        this.$ = cheerio.load(htmlContent);
    }
    /**
     * Extract text from a specific selector with automatic cleaning.
     * @param selector CSS Selector (e.g. '.product-price')
     */
    getText(selector) {
        const element = this.$(selector).first();
        if (!element.length)
            return null;
        return this.cleanText(element.text());
    }
    /**
     * Extract attribute value (e.g. href, src, data-id)
     */
    getAttribute(selector, attribute) {
        const val = this.$(selector).attr(attribute);
        return val ? val.trim() : null;
    }
    /**
     * Extract multiple elements (e.g. a list of products)
     */
    getList(selector, extractor) {
        const results = [];
        this.$(selector).each((_, el) => {
            results.push(extractor(this.$(el)));
        });
        return results;
    }
    /**
     * 🚀 ADVANCED: Extract JSON-LD Structured Data
     * This is the 'God Mode' of scraping. Many sites put all product/article info
     * here in clean JSON format.
     */
    getJsonLd() {
        const data = [];
        this.$('script[type="application/ld+json"]').each((_, el) => {
            try {
                const json = JSON.parse(this.$(el).html() || "{}");
                data.push(json);
            }
            catch (err) {
                logger_1.logger.warn("Failed to parse JSON-LD block");
            }
        });
        return data;
    }
    /**
     * Fallback: Extract Meta Tags (OpenGraph/Twitter Cards)
     * Useful when CSS selectors change but SEO tags remain.
     */
    getMetaTags() {
        const meta = {};
        this.$("meta").each((_, el) => {
            const $el = this.$(el);
            const property = $el.attr("property") || $el.attr("name");
            const content = $el.attr("content");
            if (property && content) {
                meta[property] = content;
            }
        });
        return meta;
    }
    /**
     * Utility: Remove newlines, tabs, and extra spaces
     */
    cleanText(text) {
        return text
            .replace(/\\n/g, " ")
            .replace(/\\t/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }
}
exports.HtmlParser = HtmlParser;
