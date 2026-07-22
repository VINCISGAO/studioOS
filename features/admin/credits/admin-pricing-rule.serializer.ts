import type { CreditPricingRule, CreditPricingRuleStatus, GenerationType } from "@prisma/client";
import { computePricingMargins } from "@/features/admin/credits/admin-pricing-rule-validation.service";

export type AdminPricingRuleView = {
  id: string;
  aiModelId: string | null;
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
  status: CreditPricingRuleStatus;
  version: number;
  sourceRuleId: string | null;
  replacesRuleId: string | null;
  changeReason: string | null;
  internalNotes: string | null;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
  validatedAt: string | null;
  publishedAt: string | null;
  publishedByUserId: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  aiModelDisplayName?: string | null;
};

export async function serializeAdminPricingRule(
  rule: CreditPricingRule & { aiModel?: { displayName: string } | null }
): Promise<AdminPricingRuleView> {
  const margins = await computePricingMargins({
    creditPrice: rule.creditPrice,
    providerCostMinor: rule.providerCostMinor,
    outputCount: rule.outputCount
  });

  return {
    id: rule.id,
    aiModelId: rule.aiModelId,
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
    marginPercent: rule.marginPercent ?? margins.marginPercent,
    marginAmountMinor: rule.marginAmountMinor ?? margins.marginAmountMinor,
    refundOnFailure: rule.refundOnFailure,
    minimumBalance: rule.minimumBalance,
    enabled: rule.enabled,
    status: rule.status,
    version: rule.version,
    sourceRuleId: rule.sourceRuleId,
    replacesRuleId: rule.replacesRuleId,
    changeReason: rule.changeReason,
    internalNotes: rule.internalNotes,
    sortOrder: rule.sortOrder,
    startsAt: rule.startsAt?.toISOString() ?? null,
    endsAt: rule.endsAt?.toISOString() ?? null,
    validatedAt: rule.validatedAt?.toISOString() ?? null,
    publishedAt: rule.publishedAt?.toISOString() ?? null,
    publishedByUserId: rule.publishedByUserId,
    archivedAt: rule.archivedAt?.toISOString() ?? null,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
    aiModelDisplayName: rule.aiModel?.displayName ?? null
  };
}

export function buildRuleSnapshot(rule: CreditPricingRule) {
  return {
    id: rule.id,
    aiModelId: rule.aiModelId,
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
    sortOrder: rule.sortOrder,
    startsAt: rule.startsAt?.toISOString() ?? null,
    endsAt: rule.endsAt?.toISOString() ?? null,
    version: rule.version,
    changeReason: rule.changeReason
  };
}
