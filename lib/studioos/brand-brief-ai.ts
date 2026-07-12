import "server-only";

import { logger } from "@/lib/core/logger";
import type { Locale } from "@/lib/i18n";
import {
  buildTemplateBrandBriefOptimizer,
  detectBriefGapsFromQuestionnaire,
  optimizeBrandBriefWithAI
} from "@/lib/studioos/brand-brief-optimizer";
import type { BrandBriefOptimizerResult } from "@/lib/studioos/brand-brief-optimizer.types";
import type { BrandQuestionnaireInput } from "@/lib/studioos/brand-questionnaire.types";

export type { BrandQuestionnaireInput } from "@/lib/studioos/brand-questionnaire.types";

export type ReorganizedBrandBrief = {
  campaign_goal: string;
  product_name: string;
  target_audience: string;
  title: string;
  notes: string;
  source: "openai" | "template";
  optimizer?: BrandBriefOptimizerResult;
};

function briefFromOptimizer(optimizer: BrandBriefOptimizerResult, source: "openai" | "template"): ReorganizedBrandBrief {
  return {
    campaign_goal: optimizer.brief_document,
    product_name: optimizer.campaign_name,
    target_audience: optimizer.audience_primary,
    title: optimizer.campaign_name,
    notes: [optimizer.consumer_insight, optimizer.recommended_cta].filter(Boolean).join("\n\n"),
    source,
    optimizer
  };
}

export function templateReorganizeBrandBrief(
  input: BrandQuestionnaireInput,
  locale: Locale
): ReorganizedBrandBrief {
  const formGaps = detectBriefGapsFromQuestionnaire(input, locale);
  const optimizer = buildTemplateBrandBriefOptimizer(input, locale, formGaps);
  return briefFromOptimizer(optimizer, "template");
}

export type BrandBriefAiUsage = {
  charged: boolean;
  provider: string;
  tokenInput: number;
  tokenOutput: number;
  cost: number;
};

export type BrandBriefAiResult = {
  brief: ReorganizedBrandBrief;
  usage: BrandBriefAiUsage;
};

export async function reorganizeBrandBriefWithAI(
  input: BrandQuestionnaireInput,
  locale: Locale
): Promise<BrandBriefAiResult> {
  const formGaps = detectBriefGapsFromQuestionnaire(input, locale);

  try {
    const optimized = await optimizeBrandBriefWithAI({
      questionnaire: input,
      locale,
      formGaps
    });

    return {
      brief: briefFromOptimizer(optimized.optimizer, optimized.source),
      usage: optimized.usage
    };
  } catch (error) {
    logger.error("Brand brief optimizer failed, using template fallback", {
      service: "brand-brief-ai",
      error: error instanceof Error ? error.message : String(error)
    });

    const optimizer = buildTemplateBrandBriefOptimizer(input, locale, formGaps);
    return {
      brief: briefFromOptimizer(optimizer, "template"),
      usage: { charged: false, provider: "template", tokenInput: 0, tokenOutput: 0, cost: 0 }
    };
  }
}
