import type { GenerationType } from "@prisma/client";
import { creditPricingRepository } from "@/features/credit-wallet/credit-pricing.repository";
import type {
  CreditPricingRuleView,
  GenerationQuoteInput,
  GenerationQuoteResult
} from "@/features/credit-wallet/credit-pricing.types";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

function serializeRule(rule: {
  id: string;
  provider: string;
  model: string;
  generationType: GenerationType;
  mode: string | null;
  label: string | null;
  durationSec: number | null;
  resolution: string | null;
  aspectRatio: string | null;
  inputType: string | null;
  outputCount: number;
  providerCostMinor: number | null;
  creditPrice: number;
  marginPercent: number | null;
  marginAmountMinor: number | null;
  refundOnFailure: boolean;
  minimumBalance: number;
  enabled: boolean;
  status: "DRAFT" | "VALIDATED" | "PUBLISHED" | "ARCHIVED";
  version: number;
  sortOrder: number;
  startsAt: Date | null;
  endsAt: Date | null;
  publishedAt: Date | null;
}): CreditPricingRuleView {
  return {
    id: rule.id,
    provider: rule.provider,
    model: rule.model,
    generationType: rule.generationType,
    mode: rule.mode,
    label: rule.label,
    durationSec: rule.durationSec,
    resolution: rule.resolution,
    aspectRatio: rule.aspectRatio,
    inputType: rule.inputType,
    outputCount: rule.outputCount,
    providerCostMinor: rule.providerCostMinor,
    creditPrice: rule.creditPrice,
    marginPercent: rule.marginPercent,
    marginAmountMinor: rule.marginAmountMinor,
    refundOnFailure: rule.refundOnFailure,
    minimumBalance: rule.minimumBalance,
    enabled: rule.enabled,
    status: rule.status,
    version: rule.version,
    sortOrder: rule.sortOrder,
    startsAt: rule.startsAt?.toISOString() ?? null,
    endsAt: rule.endsAt?.toISOString() ?? null,
    publishedAt: rule.publishedAt?.toISOString() ?? null
  };
}

export class CreditPricingService {
  private assertDb() {
    if (!hasDatabaseUrl()) {
      throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
    }
  }

  async quoteGeneration(input: GenerationQuoteInput): Promise<GenerationQuoteResult> {
    this.assertDb();
    const rule = await creditPricingRepository.findBestMatchingRule({
      type: input.type,
      model: input.model,
      parameters: input.parameters
    });

    if (!rule) {
      throw appError(
        "NOT_FOUND",
        `No pricing rule configured for ${input.type} / ${input.model}`
      );
    }

    const outputCount = Math.max(1, Number(input.parameters.outputs ?? input.parameters.outputCount ?? 1));
    const credits = Math.max(1, rule.creditPrice * outputCount);

    return {
      credits,
      ruleId: rule.id,
      ruleVersion: rule.version,
      provider: rule.provider,
      model: rule.model,
      mode: rule.mode,
      label: rule.label,
      durationSec: rule.durationSec,
      resolution: rule.resolution,
      aspectRatio: rule.aspectRatio,
      outputCount,
      providerCostMinor: rule.providerCostMinor,
      marginPercent: rule.marginPercent,
      refundOnFailure: rule.refundOnFailure,
      minimumBalance: rule.minimumBalance,
      quotedAt: new Date().toISOString()
    };
  }

  invalidateQuoteCache() {
    // Reserved for future quote caching layers.
  }

  async listRules(includeDisabled = false) {
    this.assertDb();
    const rows = await creditPricingRepository.listRules(includeDisabled);
    return rows.map(serializeRule);
  }
}

export const creditPricingService = new CreditPricingService();
