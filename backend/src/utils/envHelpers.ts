// FILE: src/utils/envHelpers.ts

/**
 * Normalizes boolean values from environment variables.
 * Handles "true", "1", "yes", "y" as true.
 */
export const parseBool = (v: unknown, defaultValue = false): boolean => {
  if (v === undefined || v === null) return defaultValue;
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase().trim();
  return ["true", "1", "yes", "y"].includes(s);
};

/**
 * Normalizes number values from environment variables.
 * Returns default if the value is not a valid finite number.
 */
export const parseNumber = (v: unknown, def?: number): number | undefined => {
  if (v === undefined || v === null) return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};
