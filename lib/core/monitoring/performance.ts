import { performance } from "node:perf_hooks";
import { recordPerformanceMetric } from "@/lib/core/monitoring";

export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    recordPerformanceMetric(name, performance.now() - start, tags);
  }
}

export function startWebVitalsReporter() {
  if (typeof window === "undefined") return;
  // Placeholder for client-side LCP reporting — wired when @vercel/speed-insights is added
}
