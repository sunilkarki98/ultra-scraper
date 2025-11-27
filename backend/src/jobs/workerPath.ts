import path from "path";

export function getWorkerPath() {
  const isDev = process.env.NODE_ENV !== "production";

  const workerFile = isDev ? "workerProcessor.ts" : "workerProcessor.js";

  return path.join(__dirname, workerFile);
}
