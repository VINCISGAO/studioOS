import type { PricingIntegrityIssue, PricingIntegrityReport } from "@/features/credit-wallet/credit-pricing.types";
import { prisma } from "@/lib/core/database/prisma";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { logger } from "@/lib/core/logger";

export type { PricingIntegrityIssue, PricingIntegrityReport };

export const REQUIRED_PRICING_MODEL_IDS = [
  "seedance-2.0",
  "seedance-2.0-fast",
  "seedance-2.0-mini",
  "kling-3.0",
  "kling-3.0-omni",
  "veo-3.1",
  "veo-3.1-fast",
  "gemini-omni-flash",
  "gpt-image",
  "gpt-image-mini",
  "nano-banana-2",
  "v7.5-all",
  "v7.5-studio",
  "v7.5-basic"
] as const;

let startupValidated = false;

export const creditPricingIntegrityService = {
  async getReport(): Promise<PricingIntegrityReport> {
    if (!hasDatabaseUrl()) {
      return {
        healthy: true,
        checkedAt: new Date().toISOString(),
        enabledModelCount: 0,
        ruleCount: 0,
        issues: [],
        models: []
      };
    }

    const [models, rules] = await Promise.all([
      prisma.aiModel.findMany({
        where: { deletedAt: null },
        orderBy: [{ category: "asc" }, { sortOrder: "asc" }]
      }),
      prisma.creditPricingRule.findMany({
        where: { status: "PUBLISHED", enabled: true },
        select: { model: true, aiModelId: true }
      })
    ]);

    const ruleCountByModel = new Map<string, number>();
    for (const rule of rules) {
      const key = rule.model.trim().toLowerCase();
      ruleCountByModel.set(key, (ruleCountByModel.get(key) ?? 0) + 1);
    }

    const issues: PricingIntegrityIssue[] = [];
    for (const model of models.filter((row) => row.enabled)) {
      const count = ruleCountByModel.get(model.internalModelId.toLowerCase()) ?? 0;
      if (count === 0) {
        issues.push({
          internalModelId: model.internalModelId,
          displayName: model.displayName,
          category: model.category,
          reason: "missing_pricing_rule"
        });
      }
    }

    return {
      healthy: issues.length === 0,
      checkedAt: new Date().toISOString(),
      enabledModelCount: models.filter((row) => row.enabled).length,
      ruleCount: rules.length,
      issues,
      models: models.map((row) => ({
        internalModelId: row.internalModelId,
        displayName: row.displayName,
        provider: row.provider,
        category: row.category,
        enabled: row.enabled,
        ruleCount: ruleCountByModel.get(row.internalModelId.toLowerCase()) ?? 0,
        baseCreditPrice: row.baseCreditPrice
      }))
    };
  },

  async assertHealthy(context: "startup" | "verify" = "verify") {
    const report = await this.getReport();
    if (report.healthy) return report;

    const message = report.issues
      .map((issue) => `${issue.internalModelId} (${issue.displayName})`)
      .join(", ");

    const error = new Error(`Pricing integrity failed: enabled models missing rules — ${message}`);
    logger.error("credit.pricing.integrity_failed", {
      service: "CreditPricingIntegrityService",
      context,
      issueCount: report.issues.length,
      issues: report.issues
    });
    throw error;
  },

  async validateStartup() {
    if (startupValidated || !hasDatabaseUrl()) return;
    if (process.env.SKIP_CREDITS_PRICING_STARTUP_CHECK === "1") return;
    await this.assertHealthy("startup");
    startupValidated = true;
    logger.info("credit.pricing.integrity_ok", { service: "CreditPricingIntegrityService" });
  }
};
