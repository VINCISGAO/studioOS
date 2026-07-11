import type {
  BenchmarkSampleInput,
  ProductionDifficultyTier,
  ProductionPricingProfileConfig
} from "@/features/pricing/production-pricing.types";

/** Global V1 profile — aligned with owner PDF + first two verified samples. */
export const PRODUCTION_PRICING_PROFILE_V1: ProductionPricingProfileConfig = {
  version: "v1",
  defaultGenerationMultiplier: 2.5,
  defaultUsableRate: 0.4,
  productionUnitSeconds: 15,
  defaultHourlyRateUsd: 40,
  minCreatorProfitMargin: 0.25,
  targetCreatorProfitMargin: 0.35,
  platformCommissionRate: 0.1,
  paymentCostRate: 0.04,
  riskReserveRate: 0.03,
  revisionReserveStandard: 0.1,
  riskBufferStandard: 0.1,
  tokensPer15s4kGeneration: 1500,
  tiers: [
    {
      tier: "SIMPLE",
      labelEn: "Simple product / abstract",
      labelZh: "简单产品或抽象画面",
      generationMultiplier: 1.75,
      tokensPer15sUnit: 2625,
      usableRate: 0.5714,
      complexityCoefficient: 0.7,
      avgShotLengthSeconds: 3,
      riskCoefficient: 0.9
    },
    {
      tier: "STANDARD",
      labelEn: "Standard commercial",
      labelZh: "标准商业视频",
      generationMultiplier: 2.5,
      tokensPer15sUnit: 3750,
      usableRate: 0.4,
      complexityCoefficient: 1,
      avgShotLengthSeconds: 4,
      riskCoefficient: 1
    },
    {
      tier: "COMMERCIAL",
      labelEn: "High-quality brand ad",
      labelZh: "高质量商业广告",
      generationMultiplier: 3.5,
      tokensPer15sUnit: 5250,
      usableRate: 0.2857,
      complexityCoefficient: 1.4,
      avgShotLengthSeconds: 5,
      riskCoefficient: 1.15
    },
    {
      tier: "CINEMATIC",
      labelEn: "Cinematic brand film",
      labelZh: "电影感品牌宣传片",
      generationMultiplier: 4.125,
      tokensPer15sUnit: 6187.5,
      usableRate: 0.2424,
      complexityCoefficient: 1.65,
      avgShotLengthSeconds: 6,
      riskCoefficient: 1.25
    },
    {
      tier: "COMPLEX",
      labelEn: "High-consistency narrative",
      labelZh: "高一致性复杂剧情",
      generationMultiplier: 6.5,
      tokensPer15sUnit: 9750,
      usableRate: 0.1538,
      complexityCoefficient: 2.6,
      avgShotLengthSeconds: 7,
      riskCoefficient: 1.4
    }
  ]
};

/** Verified owner production samples — platform reference data, not campaign-linked. */
export const VERIFIED_BENCHMARK_SAMPLES: BenchmarkSampleInput[] = [
  {
    sampleCode: "SAMPLE_001",
    projectName: "命运转移",
    projectType: "AI_DRAMA_SHORT",
    difficultyTier: "COMPLEX",
    finalDurationSeconds: 990,
    productionUnitSeconds: 15,
    effectiveUnitCount: 66,
    totalShotCount: null,
    aiToolSpendUsd: 2599,
    aiCostPer15sUsd: 39.38,
    aiCostPerSecondUsd: 2.63,
    totalGenerations: null,
    usedGenerations: 66,
    generationMultiplier: 2.5,
    usableRate: 0.4,
    complexityCoefficient: null,
    productionDays: 28,
    hoursPerDay: 8,
    totalLaborHours: 224,
    revisionRounds: null,
    editingHours: null,
    dataSource: "Owner real production record — AI tool recharge ledger",
    sourceType: "VERIFIED",
    confidenceLevel: "owner_recharge_ledger_partial",
    notes:
      "AI spend verified at $2,599. Shot count and total generation count pending manual audit. Experience multiplier 2.5; if 420 gens / 66 units, observed multiplier ≈ 6.36.",
    metadataJson: {
      durationLabel: "16:30",
      aiRechargeBreakdownUsd: [450, 450, 360, 450, 360, 360, 169],
      alternativeMultiplierFrom420Gens: 6.36,
      laborIncludes: [
        "prompt_writing",
        "prompt_tuning",
        "asset_screening",
        "editing",
        "color_grading",
        "voiceover",
        "sfx",
        "subtitles",
        "story_design",
        "shot_ordering",
        "export",
        "revisions"
      ],
      pendingFields: ["total_shot_count", "total_generations", "revision_rounds", "editing_hours"]
    },
    recordedAt: new Date("2026-07-11T00:00:00.000Z")
  },
  {
    sampleCode: "SAMPLE_002",
    projectName: "VINCIS 品牌宣传片",
    projectType: "CINEMATIC_BRAND_PROMO",
    difficultyTier: "CINEMATIC",
    finalDurationSeconds: 160,
    productionUnitSeconds: 15,
    effectiveUnitCount: 10.6667,
    totalShotCount: null,
    totalTokensConsumed: 66000,
    tokensPer15sUnit: 6187.5,
    tokensPerSecond: 412.5,
    tokensPerSingle15s4kGen: 1500,
    totalGenerations: 44,
    usedGenerations: 11,
    generationMultiplier: 4.125,
    usableRate: 0.2424,
    complexityCoefficient: 1.65,
    productionDays: null,
    hoursPerDay: null,
    totalLaborHours: null,
    dataSource: "VINCIS real production record — token ledger",
    sourceType: "DERIVED",
    assumptionText: "1500 Token per 15s 4K generation",
    confidenceLevel: "derived_from_token_ledger",
    notes:
      "Cinematic brand promo baseline. 4.125× generation multiplier vs 2.5× standard = 1.65× complexity coefficient.",
    metadataJson: {
      durationLabel: "2:40",
      discardedPerUsableUnit: 3.125,
      comparedToStandardMultiplier: 1.65
    },
    recordedAt: new Date("2026-07-11T00:00:00.000Z")
  }
];

export function tierConfigFor(
  profile: ProductionPricingProfileConfig,
  tier: ProductionDifficultyTier
) {
  const found = profile.tiers.find((row) => row.tier === tier);
  if (!found) {
    throw new Error(`Missing pricing tier config: ${tier}`);
  }
  return found;
}

export function benchmarkForTier(tier: ProductionDifficultyTier): BenchmarkSampleInput | null {
  return VERIFIED_BENCHMARK_SAMPLES.find((sample) => sample.difficultyTier === tier) ?? null;
}
