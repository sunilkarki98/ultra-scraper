"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stealthChromium = void 0;
const playwright_extra_1 = require("playwright-extra");
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
// Apply stealth plugin to chromium
playwright_extra_1.chromium.use((0, puppeteer_extra_plugin_stealth_1.default)());
exports.stealthChromium = playwright_extra_1.chromium;
