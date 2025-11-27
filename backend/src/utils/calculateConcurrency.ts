// FILE: src/utils/calculateConcurrency.ts
import os from "os";

interface ConcurrencyOptions {
  maxMemoryMb?: string | number;
  maxCpuCores?: string | number;
  concurrencyOverride?: string | number;
  utilizationPct?: string | number;
  ramPerBrowserMb?: number;
  systemOverheadMb?: number;
  browsersPerCore?: number;
}

/**
 * Calculates safe concurrency for browser instances.
 * Optimized for aggressive resource usage (90% Utilization).
 */
export const calculateConcurrency = ({
  maxMemoryMb,
  maxCpuCores,
  concurrencyOverride,
  utilizationPct = 85, // ⚡ Changed default to 90%
  ramPerBrowserMb = 800,
  systemOverheadMb = 450, // Reduced overhead estimate slightly
  browsersPerCore = 1.0,
}: ConcurrencyOptions): number => {
  // 1. Manual Override
  if (concurrencyOverride) {
    const manual = Number(concurrencyOverride);
    return !isNaN(manual) && manual >= 0 ? manual : 1;
  }

  // 2. Utilization Factor (Default 90%)
  const safeUtil = Number(utilizationPct) || 90;
  const utilFactor = Math.min(Math.max(safeUtil, 10), 100) / 100;

  // 3. CPU Calculation
  const logicalCores = maxCpuCores ? Number(maxCpuCores) : os.cpus().length;

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
