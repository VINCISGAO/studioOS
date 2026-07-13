import type { ProductionDifficultyTier } from "@/features/pricing/production-pricing.types";
import { roundMoney } from "@/features/membership/commission-calculation.service";
import {
  DURATION_QUOTE_WEIGHT,
  durationPriceCoefficient
} from "@/lib/studioos/brand-duration-pricing";
import {
  PRODUCTION_PRICING_PROFILE_V1,
  benchmarkForTier,
  tierConfigFor
} from "@/features/pricing/production-pricing.constants";
import type {
  ProjectEstimateBreakdown,
  ProjectEstimateInput,
  ProductionPricingProfileConfig
} from "@/features/pricing/production-pricing.types";

function roundHours(value: number) {
  return Math.round(value * 10) / 10;
}

function effectiveUnits(durationSeconds: number, unitSeconds: number) {
  return durationSeconds / unitSeconds;
}

function brandPriceFromCreatorIncome(
  creatorIncome: number,
  profile: ProductionPricingProfileConfig
) {
  const divisor =
    1 -
    profile.platformCommissionRate -
    profile.paymentCostRate -
    profile.riskReserveRate;
  if (divisor <= 0) {
    throw new Error("Invalid platform deduction rates");
  }
  return roundMoney(creatorIncome / divisor);
}

/**
 * Rule-based V1 estimate — uses verified benchmarks when available, else tier defaults.
 * Does not call AI; suitable for wizard real-time preview.
 */
export function estimateProjectCost(
  input: ProjectEstimateInput,
  profile: ProductionPricingProfileConfig = PRODUCTION_PRICING_PROFILE_V1
): ProjectEstimateBreakdown {
  const tier = tierConfigFor(profile, input.difficultyTier);
  const benchmark = benchmarkForTier(input.difficultyTier);
  const notes: string[] = [];

  const productionUnitSeconds = profile.productionUnitSeconds;
  const unitCount = effectiveUnits(input.durationSeconds, productionUnitSeconds);
  const avgShotLength = input.avgShotLengthSeconds ?? tier.avgShotLengthSeconds ?? 4;
  const explicitShots = Math.round(input.estimatedShotCount ?? 0);
  const estimatedShotCount =
    explicitShots > 0
      ? Math.min(200, Math.max(1, explicitShots))
      : Math.max(1, Math.ceil(input.durationSeconds / avgShotLength));

  const generationMultiplier = tier.generationMultiplier;
  const usableRate = tier.usableRate ?? profile.defaultUsableRate;
  const estimatedGenerations = Math.ceil(estimatedShotCount * generationMultiplier);

  let toolCostPer15sUsd = 0;
  if (benchmark?.aiCostPer15sUsd) {
    toolCostPer15sUsd = benchmark.aiCostPer15sUsd;
    notes.push(`Tool cost from ${benchmark.sampleCode}: $${benchmark.aiCostPer15sUsd}/15s deliverable.`);
  } else {
    const anchorUsdPer15s = 39.38;
    const anchorMultiplier = 2.5;
    toolCostPer15sUsd = roundMoney(
      anchorUsdPer15s * (generationMultiplier / anchorMultiplier)
    );
    notes.push(
      `Tool cost scaled from SAMPLE_001 anchor ($${anchorUsdPer15s}/15s at ${anchorMultiplier}×) → $${toolCostPer15sUsd}/15s.`
    );
  }

  const toolCostUsd = roundMoney(unitCount * toolCostPer15sUsd);

  const hoursPerShot =
    benchmark?.totalLaborHours && benchmark.usedGenerations
      ? Number(benchmark.totalLaborHours) / benchmark.usedGenerations
      : 0.75;
  const baseLaborHours = roundHours(estimatedShotCount * hoursPerShot + 6);
  const rushMultiplier = input.rushDelivery ? 1.25 : 1;
  const estimatedLaborHours = roundHours(baseLaborHours * rushMultiplier);

  const hourlyRate = input.hourlyRateUsd ?? profile.defaultHourlyRateUsd;
  const laborCostUsd = roundMoney(estimatedLaborHours * hourlyRate);
  const productionCostUsd = roundMoney(toolCostUsd + laborCostUsd);

  const revisionRate =
    (input.revisionRounds ?? 3) >= 3
      ? profile.revisionReserveStandard * 1.5
      : profile.revisionReserveStandard;
  const revisionReserveUsd = roundMoney(productionCostUsd * revisionRate);
  const riskBufferUsd = roundMoney(
    productionCostUsd * profile.riskBufferStandard * tier.riskCoefficient
  );

  const creatorProductionCost = roundMoney(
    productionCostUsd + revisionReserveUsd + riskBufferUsd
  );
  const durationUplift = 1 + (durationPriceCoefficient(input.durationSeconds) - 1) * DURATION_QUOTE_WEIGHT;
  const creatorMinIncomeUsd = roundMoney(
    creatorProductionCost * (1 + profile.minCreatorProfitMargin) * durationUplift
  );
  const creatorTargetIncomeUsd = roundMoney(
    creatorProductionCost * (1 + profile.targetCreatorProfitMargin) * durationUplift
  );

  const fixedExpenditureQuoteAnchorUsd = roundMoney(
    toolCostUsd * profile.fixedExpenditureToQuoteMultiplier
  );
  notes.push(
    `Quote anchor: fixed expenditure $${toolCostUsd} × ${profile.fixedExpenditureToQuoteMultiplier} = $${fixedExpenditureQuoteAnchorUsd} (SAMPLE_006).`
  );

  const brandFloorPriceUsd = brandPriceFromCreatorIncome(creatorMinIncomeUsd, profile);
  const brandSuggestedFromMargin = brandPriceFromCreatorIncome(creatorTargetIncomeUsd, profile);
  const brandSuggestedPriceUsd = roundMoney(
    Math.max(brandSuggestedFromMargin, fixedExpenditureQuoteAnchorUsd)
  );
  const brandPriorityPriceUsd = roundMoney(brandSuggestedPriceUsd * 1.22);
  const brandPremiumPriceUsd = roundMoney(brandSuggestedPriceUsd * 1.55);

  if (benchmark) {
    notes.push(
      `Benchmark ${benchmark.sampleCode}: ${benchmark.generationMultiplier}× multiplier, ${(usableRate * 100).toFixed(1)}% usable rate.`
    );
  }

  return {
    profileVersion: profile.version,
    difficultyTier: input.difficultyTier,
    durationSeconds: input.durationSeconds,
    productionUnitSeconds,
    effectiveUnitCount: roundHours(unitCount),
    estimatedShotCount,
    generationMultiplier,
    usableRate,
    estimatedGenerations,
    estimatedLaborHours,
    toolCostUsd,
    laborCostUsd,
    productionCostUsd,
    revisionReserveUsd,
    riskBufferUsd,
    creatorMinIncomeUsd,
    fixedExpenditureQuoteAnchorUsd,
    brandFloorPriceUsd,
    brandSuggestedPriceUsd,
    brandPriorityPriceUsd,
    brandPremiumPriceUsd,
    benchmarkSampleCode: benchmark?.sampleCode ?? null,
    notes
  };
}

export function resolveDifficultyTierForProjectType(
  projectType: string | undefined
): ProductionDifficultyTier {
  switch (projectType) {
    case "AI_DRAMA_SHORT":
    case "COMPLEX_NARRATIVE":
      return "COMPLEX";
    case "CINEMATIC_BRAND_PROMO":
    case "BRAND_FILM":
      return "CINEMATIC";
    case "BRAND_AD":
      return "COMMERCIAL";
    case "SOCIAL_SHORT":
    case "SIMPLE_PRODUCT":
      return "STANDARD";
    default:
      return "STANDARD";
  }
}

export function isBudgetBelowFloor(brandBudgetUsd: number, floorUsd: number) {
  return brandBudgetUsd + 0.01 < floorUsd;
}

export function budgetGapSeverity(
  brandBudgetUsd: number,
  floorUsd: number
): "ok" | "slightly_low" | "severely_low" {
  if (brandBudgetUsd >= floorUsd) return "ok";
  if (brandBudgetUsd >= floorUsd * 0.85) return "slightly_low";
  return "severely_low";
}
