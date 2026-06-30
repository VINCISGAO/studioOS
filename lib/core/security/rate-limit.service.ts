/**
 * In-memory API rate limiter — limits loaded from feature_flags (security.api_rate_limit).
 */
import type { ApiRateLimitConfig } from "@/features/admin/admin.types";
import { featureFlagService } from "@/features/admin/feature-flag.service";
import { appError } from "@/lib/core/errors";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let cachedConfig: { config: ApiRateLimitConfig; expiresAt: number } | null = null;

async function loadConfig(): Promise<ApiRateLimitConfig> {
  if (cachedConfig && Date.now() < cachedConfig.expiresAt) {
    return cachedConfig.config;
  }
  const config = await featureFlagService.getApiRateLimitConfig();
  cachedConfig = { config, expiresAt: Date.now() + 60_000 };
  return config;
}

function resolveLimit(config: ApiRateLimitConfig, pathname: string) {
  const routeRule = config.routes?.[pathname];
  if (routeRule) {
    return {
      maxRequests: routeRule.maxRequests,
      windowMs: routeRule.windowMs ?? config.windowMs
    };
  }
  return { maxRequests: config.maxRequests, windowMs: config.windowMs };
}

function clientKey(request: Request, pathname: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  return `${ip}:${pathname}`;
}

export async function enforceApiRateLimit(request: Request, pathname: string): Promise<void> {
  const enabled = await featureFlagService.isEnabled("security.api_rate_limit");
  if (!enabled) return;

  const config = await loadConfig();
  const { maxRequests, windowMs } = resolveLimit(config, pathname);
  const key = clientKey(request, pathname);
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  if (bucket.count > maxRequests) {
    throw appError("RATE_LIMIT", "Too many requests. Please try again later.");
  }
}

/** Test helper — reset in-memory state */
export function resetRateLimitStateForTests() {
  buckets.clear();
  cachedConfig = null;
}
