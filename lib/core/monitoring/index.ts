/**
 * Monitoring — Sprint 18
 * Sentry is optional; enabled via feature_flags.monitoring.sentry + SENTRY_DSN env.
 */
import { featureFlagService } from "@/features/admin/feature-flag.service";

type SentryMetadata = {
  sampleRate?: number;
  tracesSampleRate?: number;
};

let initialized = false;

export async function initMonitoring(): Promise<void> {
  if (initialized || process.env.NEXT_RUNTIME === "edge") return;

  const enabled = await featureFlagService.isEnabled("monitoring.sentry");
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!enabled || !dsn) return;

  initialized = true;
  const meta = (await featureFlagService.getMetadata<SentryMetadata>("monitoring.sentry")) ?? {};

  if (process.env.NODE_ENV === "development") {
    console.info("[monitoring] Sentry enabled (flag + DSN present)", {
      sampleRate: meta.sampleRate ?? 0.1,
      tracesSampleRate: meta.tracesSampleRate ?? 0.05
    });
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!initialized) {
    console.error("[monitoring]", error, context);
    return;
  }
  console.error("[monitoring:sentry-stub]", error, context);
}

export function recordPerformanceMetric(name: string, valueMs: number, tags?: Record<string, string>) {
  if (process.env.NODE_ENV === "development") {
    console.info(`[perf] ${name}=${valueMs.toFixed(1)}ms`, tags ?? {});
  }
}
