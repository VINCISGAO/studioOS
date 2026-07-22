import type { AiModel, CreditPricingRule, GenerationType } from "@prisma/client";
import { creditPricingRepository, inferGenerationMode } from "@/features/credit-wallet/credit-pricing.repository";
import { creditWalletRepository } from "@/features/credit-wallet/credit-wallet.repository";
import { prisma } from "@/lib/core/database/prisma";

export type PricingRuleValidationIssue = {
  code: string;
  message: string;
  severity: "error" | "warning";
};

export type PricingRuleValidationResult = {
  ok: boolean;
  issues: PricingRuleValidationIssue[];
  checkedAt: string;
};

const MIN_MARGIN_PERCENT = Number(process.env.PRICING_MIN_MARGIN_PERCENT ?? 15);

function overlaps(
  aStart: Date | null,
  aEnd: Date | null,
  bStart: Date | null,
  bEnd: Date | null
) {
  const startA = aStart?.getTime() ?? Number.NEGATIVE_INFINITY;
  const endA = aEnd?.getTime() ?? Number.POSITIVE_INFINITY;
  const startB = bStart?.getTime() ?? Number.NEGATIVE_INFINITY;
  const endB = bEnd?.getTime() ?? Number.POSITIVE_INFINITY;
  return startA <= endB && startB <= endA;
}

function sameConditionKey(rule: {
  model: string;
  generationType: GenerationType;
  mode: string | null;
  durationSec: number | null;
  resolution: string | null;
  aspectRatio: string | null;
  outputCount: number;
  inputType: string | null;
}) {
  return [
    rule.generationType,
    rule.model.toLowerCase(),
    rule.mode ?? "*",
    rule.durationSec ?? "*",
    rule.resolution ?? "*",
    rule.aspectRatio ?? "*",
    rule.outputCount,
    rule.inputType ?? "*"
  ].join("|");
}

export async function computePricingMargins(input: {
  creditPrice: number;
  providerCostMinor: number | null;
  outputCount?: number;
}) {
  const config = await creditWalletRepository.getExchangeRateConfig("USD");
  const creditsPerUnitMinor = config?.creditsPerUnitMinor ?? 100;
  const outputs = Math.max(1, input.outputCount ?? 1);
  const totalCredits = input.creditPrice * outputs;
  const revenueMinor = Math.round((totalCredits * 100) / creditsPerUnitMinor);
  const providerCost = (input.providerCostMinor ?? 0) * outputs;
  const marginAmountMinor = revenueMinor - providerCost;
  const marginPercent =
    revenueMinor > 0 ? Math.round((marginAmountMinor / revenueMinor) * 100) : null;
  return {
    revenueMinor,
    marginAmountMinor,
    marginPercent,
    creditsPerUnitMinor
  };
}

export const adminPricingRuleValidationService = {
  async validateDraft(rule: CreditPricingRule, aiModel: AiModel | null): Promise<PricingRuleValidationResult> {
    const issues: PricingRuleValidationIssue[] = [];
    const now = new Date();

    if (!Number.isInteger(rule.creditPrice) || rule.creditPrice <= 0) {
      issues.push({
        code: "credit_price_invalid",
        message: "Credit price must be a positive integer",
        severity: "error"
      });
    }

    if (rule.providerCostMinor != null && (!Number.isInteger(rule.providerCostMinor) || rule.providerCostMinor < 0)) {
      issues.push({
        code: "provider_cost_invalid",
        message: "Provider cost must be a non-negative integer",
        severity: "error"
      });
    }

    if (rule.startsAt && rule.endsAt && rule.startsAt > rule.endsAt) {
      issues.push({
        code: "effective_range_invalid",
        message: "Effective start must be before end",
        severity: "error"
      });
    }

    if (aiModel) {
      if (!aiModel.enabled || aiModel.deletedAt) {
        issues.push({
          code: "ai_model_disabled",
          message: "Linked AI model is disabled or deleted",
          severity: "error"
        });
      }
      if (rule.mode && aiModel.supportedModes.length > 0 && !aiModel.supportedModes.includes(rule.mode)) {
        issues.push({
          code: "mode_capability_mismatch",
          message: `Mode ${rule.mode} is not supported by the AI model`,
          severity: "error"
        });
      }
      if (
        rule.durationSec != null &&
        aiModel.supportedDurations.length > 0 &&
        !aiModel.supportedDurations.includes(rule.durationSec)
      ) {
        issues.push({
          code: "duration_capability_mismatch",
          message: `Duration ${rule.durationSec}s is not supported by the AI model`,
          severity: "error"
        });
      }
      if (
        rule.resolution &&
        aiModel.supportedResolutions.length > 0 &&
        !aiModel.supportedResolutions.some((item) => item.toLowerCase() === rule.resolution?.toLowerCase())
      ) {
        issues.push({
          code: "resolution_capability_mismatch",
          message: `Resolution ${rule.resolution} is not supported by the AI model`,
          severity: "error"
        });
      }
      if (
        rule.aspectRatio &&
        aiModel.supportedAspectRatios.length > 0 &&
        !aiModel.supportedAspectRatios.includes(rule.aspectRatio)
      ) {
        issues.push({
          code: "aspect_ratio_capability_mismatch",
          message: `Aspect ratio ${rule.aspectRatio} is not supported by the AI model`,
          severity: "error"
        });
      }
      if (rule.outputCount > aiModel.maxOutputCount) {
        issues.push({
          code: "output_count_capability_mismatch",
          message: `Output count exceeds model limit (${aiModel.maxOutputCount})`,
          severity: "error"
        });
      }
    }

    const margins = await computePricingMargins({
      creditPrice: rule.creditPrice,
      providerCostMinor: rule.providerCostMinor,
      outputCount: rule.outputCount
    });
    if (margins.marginPercent != null && margins.marginPercent < MIN_MARGIN_PERCENT) {
      issues.push({
        code: "margin_below_threshold",
        message: `Gross margin ${margins.marginPercent}% is below minimum ${MIN_MARGIN_PERCENT}%`,
        severity: "error"
      });
    }

    const publishedPeers = await prisma.creditPricingRule.findMany({
      where: {
        id: { not: rule.id },
        status: "PUBLISHED",
        generationType: rule.generationType,
        model: rule.model
      }
    });

    const selfKey = sameConditionKey(rule);
    for (const peer of publishedPeers) {
      if (sameConditionKey(peer) !== selfKey) continue;
      if (overlaps(rule.startsAt, rule.endsAt, peer.startsAt, peer.endsAt)) {
        issues.push({
          code: "duplicate_active_rule",
          message: `Overlaps published rule ${peer.id} with identical conditions`,
          severity: "error"
        });
      }
    }

    const quoteParams = buildQuoteProbeParameters(rule);
    try {
      await creditPricingRepository.findBestMatchingRule({
        type: rule.generationType,
        model: rule.model,
        parameters: quoteParams,
        includeStatuses: ["PUBLISHED"]
      });
    } catch {
      // ignore lookup errors during draft validation
    }

    if (rule.status === "DRAFT" || rule.status === "VALIDATED") {
      try {
        const matchedPublished = await creditPricingRepository.findBestMatchingRule({
          type: rule.generationType,
          model: rule.model,
          parameters: quoteParams,
          includeStatuses: ["PUBLISHED"]
        });
        if (!matchedPublished && rule.replacesRuleId == null) {
          issues.push({
            code: "coverage_gap_warning",
            message: "No published fallback exists for this condition set yet",
            severity: "warning"
          });
        }
      } catch {
        issues.push({
          code: "quote_probe_failed",
          message: "Unable to probe quote compatibility for this rule",
          severity: "warning"
        });
      }
    }

    void now;
    const errors = issues.filter((issue) => issue.severity === "error");
    return {
      ok: errors.length === 0,
      issues,
      checkedAt: new Date().toISOString()
    };
  }
};

export function buildQuoteProbeParameters(rule: CreditPricingRule) {
  const parameters: Record<string, unknown> = {
    outputs: rule.outputCount > 1 ? rule.outputCount : 1,
    outputCount: rule.outputCount > 1 ? rule.outputCount : 1
  };
  if (rule.durationSec != null) parameters.duration = rule.durationSec;
  if (rule.resolution) {
    parameters.resolution = rule.resolution;
    parameters.quality = rule.resolution;
  }
  if (rule.aspectRatio) parameters.aspectRatio = rule.aspectRatio;
  if (rule.inputType) parameters.inputType = rule.inputType;
  if (rule.mode?.includes("IMAGE")) {
    parameters.referenceAssetId = "probe";
  } else if (rule.mode === "IMAGE_TO_VIDEO") {
    parameters.referenceAssetId = "probe";
  } else if (rule.generationType === "MUSIC") {
    parameters.mode =
      rule.mode === "SIMPLE" ? "simple" : rule.mode === "SOUNDTRACK" ? "soundtrack" : "custom";
  }
  if (rule.mode) {
    void inferGenerationMode(rule.generationType, parameters);
  }
  return parameters;
}
