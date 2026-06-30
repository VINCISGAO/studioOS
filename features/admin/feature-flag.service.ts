import { adminRepository } from "@/features/admin/admin.repository";
import type { ApiRateLimitConfig, FeatureFlagView } from "@/features/admin/admin.types";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

const DEFAULT_RATE_LIMIT: ApiRateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 120
};

function mapFlag(row: Awaited<ReturnType<typeof adminRepository.findFeatureFlagByKey>> & object): FeatureFlagView {
  return {
    id: row.id,
    key: row.key,
    enabled: row.enabled,
    metadata: row.metadata,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export class FeatureFlagService {
  async list(user: AuthUser): Promise<FeatureFlagView[]> {
    PermissionService.assert(user, "admin.feature_flag.manage");
    if (!hasDatabaseUrl()) return [];
    const rows = await adminRepository.listFeatureFlags();
    return rows.map((row) => mapFlag(row));
  }

  async upsert(
    user: AuthUser,
    input: { key: string; enabled: boolean; metadata?: Record<string, unknown> }
  ): Promise<FeatureFlagView> {
    PermissionService.assert(user, "admin.feature_flag.manage");
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "Database required");
    const row = await adminRepository.upsertFeatureFlag(input);
    return mapFlag(row);
  }

  /** Runtime check — no auth required; reads DB flag */
  async isEnabled(key: string): Promise<boolean> {
    if (!hasDatabaseUrl()) return false;
    const flag = await adminRepository.findFeatureFlagByKey(key);
    return flag?.enabled ?? false;
  }

  async getMetadata<T extends Record<string, unknown>>(key: string): Promise<T | null> {
    if (!hasDatabaseUrl()) return null;
    const flag = await adminRepository.findFeatureFlagByKey(key);
    if (!flag?.metadata || typeof flag.metadata !== "object") return null;
    return flag.metadata as T;
  }

  async getApiRateLimitConfig(): Promise<ApiRateLimitConfig> {
    const meta = await this.getMetadata<ApiRateLimitConfig>("security.api_rate_limit");
    if (!meta) return DEFAULT_RATE_LIMIT;
    return {
      windowMs: typeof meta.windowMs === "number" ? meta.windowMs : DEFAULT_RATE_LIMIT.windowMs,
      maxRequests:
        typeof meta.maxRequests === "number" ? meta.maxRequests : DEFAULT_RATE_LIMIT.maxRequests,
      routes: meta.routes ?? undefined
    };
  }
}

export const featureFlagService = new FeatureFlagService();
