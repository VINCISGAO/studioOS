import type { CreditPricingRule, GenerationType } from "@prisma/client";

export type CreditPricingRuleRecord = CreditPricingRule;

export type GenerationQuoteInput = {
  type: GenerationType;
  model: string;
  parameters: Record<string, unknown>;
};

export type GenerationQuoteResult = {
  credits: number;
  ruleId: string;
  ruleVersion: number;
  provider: string;
  model: string;
  mode: string | null;
  label: string | null;
  durationSec: number | null;
  resolution: string | null;
  aspectRatio?: string | null;
  outputCount: number;
  providerCostMinor: number | null;
  marginPercent: number | null;
  refundOnFailure: boolean;
  minimumBalance: number;
  quotedAt: string;
};

export type CreditPricingRuleView = {
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
  startsAt: string | null;
  endsAt: string | null;
  publishedAt: string | null;
};

export type AdminAdjustCreditsInput = {
  userId: string;
  amount: number;
  reason: string;
  internalNote: string;
  idempotencyKey: string;
  actorUserId: string;
};

export type PricingIntegrityIssue = {
  internalModelId: string;
  displayName: string;
  category: string;
  reason: "missing_pricing_rule" | "disabled_pricing_rule";
};

export type PricingIntegrityReport = {
  healthy: boolean;
  checkedAt: string;
  enabledModelCount: number;
  ruleCount: number;
  issues: PricingIntegrityIssue[];
  models: Array<{
    internalModelId: string;
    displayName: string;
    provider: string;
    category: string;
    enabled: boolean;
    ruleCount: number;
    baseCreditPrice: number | null;
  }>;
};
