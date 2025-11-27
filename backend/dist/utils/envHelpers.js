"use strict";
// FILE: src/utils/envHelpers.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseNumber = exports.parseBool = void 0;
/**
 * Normalizes boolean values from environment variables.
 * Handles "true", "1", "yes", "y" as true.
 */
const parseBool = (v, defaultValue = false) => {
    if (v === undefined || v === null)
        return defaultValue;
    if (typeof v === "boolean")
        return v;
    const s = String(v).toLowerCase().trim();
    return ["true", "1", "yes", "y"].includes(s);
};
exports.parseBool = parseBool;
/**
 * Normalizes number values from environment variables.
 * Returns default if the value is not a valid finite number.
 */
const parseNumber = (v, def) => {
    if (v === undefined || v === null)
        return def;
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
};
exports.parseNumber = parseNumber;
