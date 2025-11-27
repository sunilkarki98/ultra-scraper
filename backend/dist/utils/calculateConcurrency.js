"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateConcurrency = void 0;
// FILE: src/utils/calculateConcurrency.ts
const os_1 = __importDefault(require("os"));
/**
 * Calculates safe concurrency for browser instances.
 * Optimized for aggressive resource usage (90% Utilization).
 */
const calculateConcurrency = ({ maxMemoryMb, maxCpuCores, concurrencyOverride, utilizationPct = 85, // ⚡ Changed default to 90%
ramPerBrowserMb = 800, systemOverheadMb = 450, // Reduced overhead estimate slightly
browsersPerCore = 1.0, }) => {
    // 1. Manual Override
    if (concurrencyOverride) {
        const manual = Number(concurrencyOverride);
        return !isNaN(manual) && manual >= 0 ? manual : 1;
    }
    // 2. Utilization Factor (Default 90%)
    const safeUtil = Number(utilizationPct) || 90;
    const utilFactor = Math.min(Math.max(safeUtil, 10), 100) / 100;
    // 3. CPU Calculation
    const logicalCores = maxCpuCores ? Number(maxCpuCores) : os_1.default.cpus().length;
    const effectiveCores = logicalCores * utilFactor;
    const cpuLimit = Math.floor(effectiveCores * browsersPerCore);
    // 4. RAM Calculation
    if (!maxMemoryMb) {
        return Math.max(1, cpuLimit);
    }
    const totalRam = Number(maxMemoryMb);
    const safeRam = totalRam * utilFactor;
    const usableRam = safeRam - systemOverheadMb;
    // Emergency Floor: If RAM is tiny, allow 1 browser anyway
    if (usableRam <= 0) {
        return 1;
    }
    const ramLimit = Math.floor(usableRam / ramPerBrowserMb);
    // 5. Final Bottleneck
    const final = Math.min(cpuLimit, ramLimit);
    // Always ensure at least 1 browser runs
    return Math.max(1, final);
};
exports.calculateConcurrency = calculateConcurrency;
