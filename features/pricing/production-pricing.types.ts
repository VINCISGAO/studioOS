/** Mirrors `ProductionDifficultyTier` in prisma/schema.prisma — use until client is regenerated. */
export type ProductionDifficultyTier =
  | "SIMPLE"
  | "STANDARD"
  | "COMMERCIAL"
  | "CINEMATIC"
  | "COMPLEX";

/** Mirrors `ProductionProjectType` in prisma/schema.prisma. */
export type ProductionProjectType =
  | "SIMPLE_PRODUCT"
  | "SOCIAL_SHORT"
  | "BRAND_AD"
  | "BRAND_FILM"
  | "AI_DRAMA_SHORT"
  | "CINEMATIC_BRAND_PROMO"
  | "COMPLEX_NARRATIVE"
  | "OTHER";

export type ProjectEstimateBriefInput = {
  durationSeconds: number;
  projectType?: string;
  difficultyTier?: ProductionDifficultyTier;
  avgShotLengthSeconds?: number;
  estimatedShotCount?: number;
  hourlyRateUsd?: number;
  revisionRounds?: number;
  rushDelivery?: boolean;
};

export type ProductionPricingTierConfig = {
  tier: ProductionDifficultyTier;
  labelEn: string;
  labelZh: string;
  generationMultiplier: number;
  tokensPer15sUnit: number | null;
  usableRate: number | null;
  complexityCoefficient: number | null;
  avgShotLengthSeconds: number | null;
  riskCoefficient: number;
};

export type ProductionPricingProfileConfig = {
  version: string;
  defaultGenerationMultiplier: number;
  defaultUsableRate: number;
  productionUnitSeconds: number;
  defaultHourlyRateUsd: number;
  minCreatorProfitMargin: number;
  targetCreatorProfitMargin: number;
  platformCommissionRate: number;
  paymentCostRate: number;
  riskReserveRate: number;
  revisionReserveStandard: number;
  riskBufferStandard: number;
  tokensPer15s4kGeneration: number;
  tiers: ProductionPricingTierConfig[];
};

export type ProductionBenchmarkSourceType = "VERIFIED" | "DERIVED";

export type BenchmarkSampleInput = {
  sampleCode: string;
  projectName: string;
  projectType: ProductionProjectType;
  difficultyTier: ProductionDifficultyTier;
  finalDurationSeconds: number;
  productionUnitSeconds?: number;
  effectiveUnitCount: number;
  totalShotCount?: number | null;
  aiToolSpendUsd?: number | null;
  aiCostPer15sUsd?: number | null;
  aiCostPerSecondUsd?: number | null;
  totalTokensConsumed?: number | null;
  tokensPer15sUnit?: number | null;
  tokensPerSecond?: number | null;
  tokensPerSingle15s4kGen?: number | null;
  totalGenerations?: number | null;
  usedGenerations?: number | null;
  generationMultiplier: number;
  usableRate: number;
  complexityCoefficient?: number | null;
  productionDays?: number | null;
  hoursPerDay?: number | null;
  totalLaborHours?: number | null;
  revisionRounds?: number | null;
  editingHours?: number | null;
  dataSource: string;
  sourceType?: ProductionBenchmarkSourceType;
  assumptionText?: string | null;
  confidenceLevel?: string | null;
  notes?: string | null;
  metadataJson?: Record<string, unknown> | null;
  recordedAt: Date;
};

export type ProjectEstimateInput = {
  durationSeconds: number;
  difficultyTier: ProductionDifficultyTier;
  projectType?: ProductionProjectType;
  avgShotLengthSeconds?: number;
  estimatedShotCount?: number;
  hourlyRateUsd?: number;
  revisionRounds?: number;
  rushDelivery?: boolean;
};

export type ProjectEstimateBreakdown = {
  profileVersion: string;
  difficultyTier: ProductionDifficultyTier;
  durationSeconds: number;
  productionUnitSeconds: number;
  effectiveUnitCount: number;
  estimatedShotCount: number;
  generationMultiplier: number;
  usableRate: number;
  estimatedGenerations: number;
  estimatedLaborHours: number;
  toolCostUsd: number;
  laborCostUsd: number;
  productionCostUsd: number;
  revisionReserveUsd: number;
  riskBufferUsd: number;
  creatorMinIncomeUsd: number;
  brandFloorPriceUsd: number;
  brandSuggestedPriceUsd: number;
  brandPriorityPriceUsd: number;
  brandPremiumPriceUsd: number;
  benchmarkSampleCode: string | null;
  notes: string[];
};
