import type {
  BenchmarkSampleInput,
  ProductionDifficultyTier,
  ProductionPricingProfileConfig
} from "@/features/pricing/production-pricing.types";

const CREATOR_BENCHMARK_CNY_PER_USD = 7.2;

function cnyToUsd(value: number) {
  return Math.round((value / CREATOR_BENCHMARK_CNY_PER_USD) * 10000) / 10000;
}

/** Global V1 profile — aligned with owner PDF + verified / creator-provided benchmark samples. */
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
  /** Learning rule: $800 fixed AI/tool spend → ~$2,400 reasonable brand quote. */
  fixedExpenditureToQuoteMultiplier: 3,
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

/** Production benchmark samples — platform reference data, not campaign-linked. */
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
  },
  {
    sampleCode: "SAMPLE_003",
    projectName: "创作者生产基准 — 专业级广告",
    projectType: "BRAND_AD",
    difficultyTier: "COMMERCIAL",
    finalDurationSeconds: 60,
    productionUnitSeconds: 15,
    effectiveUnitCount: 5,
    totalShotCount: 14,
    aiToolSpendUsd: cnyToUsd(191),
    aiCostPer15sUsd: cnyToUsd(38.2),
    aiCostPerSecondUsd: cnyToUsd(3.18),
    totalGenerations: 8,
    usedGenerations: 5,
    generationMultiplier: 1.54,
    usableRate: 0.65,
    complexityCoefficient: 1.0,
    dataSource: "Creator-provided production cost table — professional commercial benchmark",
    sourceType: "DERIVED",
    assumptionText: `Original costs are in CNY. USD fields normalize with ${CREATOR_BENCHMARK_CNY_PER_USD} CNY/USD for pricing-engine comparability.`,
    confidenceLevel: "creator_provided_cost_table_unverified",
    notes:
      "Professional commercial benchmark for brand information-feed ads, e-commerce hero videos, and corporate promos. Captures AI hard cost only, not creator labor, platform fee, revision reserve, or profit.",
    metadataJson: {
      originalCurrency: "CNY",
      cnyPerUsd: CREATOR_BENCHMARK_CNY_PER_USD,
      applicableScenarios: ["品牌信息流", "电商主图视频", "企业宣传"],
      bareGenerationCostPer15sCny: 20.41,
      bareGenerationCostPerSecondCny: 1.36,
      discardedRatePer15sSegment: 0.35,
      qualifiedSegmentDraws: 1.54,
      qualified15sSegmentsForOneMinute: 5,
      total15sGenerationAttemptsForOneMinute: 8,
      totalImageCount: 14,
      imageGenerationCostCny: 28,
      videoGenerationCostCny: 163,
      totalHardCostCny: 191,
      hardCostPerSecondCny: 3.18,
      hardCostPerQualified15sCny: 38.2,
      includes: ["image_generation", "video_generation"],
      excludes: ["creator_labor", "editing_labor", "revision_reserve", "platform_fee", "creator_profit"]
    },
    recordedAt: new Date("2026-07-12T00:00:00.000Z")
  },
  {
    sampleCode: "SAMPLE_004",
    projectName: "创作者生产基准 — 影视级广告",
    projectType: "BRAND_FILM",
    difficultyTier: "CINEMATIC",
    finalDurationSeconds: 60,
    productionUnitSeconds: 15,
    effectiveUnitCount: 7,
    totalShotCount: 27,
    aiToolSpendUsd: cnyToUsd(421),
    aiCostPer15sUsd: cnyToUsd(60.1),
    aiCostPerSecondUsd: cnyToUsd(7.02),
    totalGenerations: 18,
    usedGenerations: 7,
    generationMultiplier: 2.5,
    usableRate: 0.4,
    complexityCoefficient: 1.62,
    dataSource: "Creator-provided production cost table — cinematic commercial benchmark",
    sourceType: "DERIVED",
    assumptionText: `Original costs are in CNY. USD fields normalize with ${CREATOR_BENCHMARK_CNY_PER_USD} CNY/USD for pricing-engine comparability.`,
    confidenceLevel: "creator_provided_cost_table_unverified",
    notes:
      "Cinematic commercial benchmark for brand TVC, premium promos, and cinema-style short ads. Captures AI hard cost only, not creator labor, platform fee, revision reserve, or profit.",
    metadataJson: {
      originalCurrency: "CNY",
      cnyPerUsd: CREATOR_BENCHMARK_CNY_PER_USD,
      applicableScenarios: ["品牌TVC", "高端宣传片", "院线贴片"],
      bareGenerationCostPer15sCny: 20.41,
      bareGenerationCostPerSecondCny: 1.36,
      discardedRatePer15sSegment: 0.6,
      qualifiedSegmentDraws: 2.5,
      qualified15sSegmentsForOneMinute: 7,
      total15sGenerationAttemptsForOneMinute: 18,
      totalImageCount: 27,
      imageGenerationCostCny: 54,
      videoGenerationCostCny: 367,
      totalHardCostCny: 421,
      hardCostPerSecondCny: 7.02,
      hardCostPerQualified15sCny: 60.1,
      includes: ["image_generation", "video_generation"],
      excludes: ["creator_labor", "editing_labor", "revision_reserve", "platform_fee", "creator_profit"]
    },
    recordedAt: new Date("2026-07-12T00:00:00.000Z")
  },
  {
    sampleCode: "SAMPLE_005",
    projectName: "学习库 — SD2.0 废片摊销基准",
    projectType: "BRAND_AD",
    difficultyTier: "STANDARD",
    finalDurationSeconds: 1485,
    productionUnitSeconds: 15,
    effectiveUnitCount: 99,
    totalShotCount: null,
    aiToolSpendUsd: cnyToUsd(5450),
    aiCostPer15sUsd: cnyToUsd(55.05),
    aiCostPerSecondUsd: cnyToUsd(3.67),
    totalGenerations: 336,
    usedGenerations: 99,
    generationMultiplier: 3.394,
    usableRate: 0.2946,
    complexityCoefficient: 1.36,
    dataSource: "Learning library production cost table — SD2.0 waste amortization benchmark",
    sourceType: "DERIVED",
    assumptionText: `SD2.0 only (no other video models). Original costs in CNY; USD fields normalize with ${CREATOR_BENCHMARK_CNY_PER_USD} CNY/USD.`,
    confidenceLevel: "learning_library_cost_table_unverified",
    notes:
      "Batch SD2.0 generation benchmark with full waste amortization. 336 total 15s clips generated, 99 usable, 237 discarded. Includes 100 supporting AI images (nano banana Pro / GPT Image).",
    metadataJson: {
      originalCurrency: "CNY",
      cnyPerUsd: CREATOR_BENCHMARK_CNY_PER_USD,
      learningLibraryCategory: "学习成本",
      videoGenerationModel: "SD2.0",
      videoModelScope: "仅 SD2.0，不纳入其他视频模型成本",
      basicDurationPerClipSeconds: 15,
      durationCalculationNote: "统一按 15 秒/条素材计算",
      wasteAndOutput: {
        totalGeneratedClips: 336,
        usableClips: 99,
        wasteClips: 237,
        wasteRate: 0.7054,
        usableRate: 0.2946,
        supportingImageCount: 100,
        supportingImageNote: "含风格参考、分镜配图"
      },
      generationCostBreakdown: {
        sd20UnitCostPer15sCny: 14.73,
        sd20VideoGenerationTotalCny: 4950,
        sd20VideoGenerationFormula: "336条 × 14.73元/条",
        aiImageUnitCostCny: 5,
        aiImageProviderNote: "nano banana Pro / GPT Image 商用级",
        aiImageTotalCny: 500,
        aiImageFormula: "100张 × 5元/张",
        totalGenerationCostCny: 5450,
        totalGenerationCostNote: "视频+生图全量生成成本"
      },
      unitFinishedProductCost: {
        costPerUsable15sClipCny: 55.05,
        costPerUsable15sFormula: "总成本 ÷ 可用条数，含废片分摊",
        costPerSecondCny: 3.67,
        costPerSecondFormula: "单条15秒成本 ÷ 15秒",
        costPerMinuteCny: 220.2,
        costPerMinuteFormula: "每秒成本 × 60秒",
        totalUsableDurationMinutes: 24.75,
        totalUsableDurationFormula: "99条 × 15秒/条"
      },
      includes: ["sd20_video_generation", "ai_image_generation", "waste_amortization"],
      excludes: ["creator_labor", "editing_labor", "revision_reserve", "platform_fee", "creator_profit"]
    },
    recordedAt: new Date("2026-07-13T00:00:00.000Z")
  },
  {
    sampleCode: "SAMPLE_006",
    projectName: "学习库 — 固定支出×3 合理报价规则",
    projectType: "BRAND_AD",
    difficultyTier: "STANDARD",
    finalDurationSeconds: 60,
    productionUnitSeconds: 15,
    effectiveUnitCount: 4,
    totalShotCount: null,
    aiToolSpendUsd: 800,
    aiCostPer15sUsd: 200,
    aiCostPerSecondUsd: 13.33,
    totalGenerations: null,
    usedGenerations: null,
    generationMultiplier: 2.5,
    usableRate: 0.4,
    complexityCoefficient: 1,
    dataSource: "Learning library — fixed expenditure to reasonable quote multiplier",
    sourceType: "DERIVED",
    assumptionText:
      "Illustrative owner rule: when AI/tool fixed expenditure is $800 USD, a $2,400 brand quote is reasonable (3× multiplier).",
    confidenceLevel: "learning_library_pricing_rule",
    notes:
      "Anchors brand suggested quote to fixed expenditure × 3. Fixed expenditure = AI/tool hard cost only; quote embeds labor, revision reserve, platform fee, and creator profit.",
    metadataJson: {
      learningLibraryCategory: "定价规则",
      learningRule: "fixed_expenditure_to_quote_multiplier",
      fixedExpenditureUsd: 800,
      reasonableQuoteUsd: 2400,
      quoteMultiplier: 3,
      laborCostRelativeToFixedNote: "合理报价约为固定支出的 3 倍（含人力、修改、平台与利润）",
      includes: ["ai_tool_spend"],
      excludes: ["creator_labor_line_item", "platform_fee_line_item"]
    },
    recordedAt: new Date("2026-07-14T00:00:00.000Z")
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
  const candidates = VERIFIED_BENCHMARK_SAMPLES.filter((sample) => sample.difficultyTier === tier);
  return candidates.find((sample) => sample.aiCostPer15sUsd != null) ?? candidates[0] ?? null;
}
