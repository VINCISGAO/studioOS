import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/core/database/prisma";
import { asInputJson } from "@/lib/core/prisma-json";
import {
  PRODUCTION_PRICING_PROFILE_V1,
  VERIFIED_BENCHMARK_SAMPLES
} from "@/features/pricing/production-pricing.constants";
import type { BenchmarkSampleInput, ProductionDifficultyTier } from "@/features/pricing/production-pricing.types";

function decimal(value: number) {
  return new Prisma.Decimal(value);
}

export const productionPricingRepository = {
  async getActiveProfile() {
    return prisma.productionPricingProfile.findFirst({
      where: { isActive: true },
      include: { complexityTiers: { orderBy: { sortOrder: "asc" } } },
      orderBy: { updatedAt: "desc" }
    });
  },

  async getProfileByVersion(version: string) {
    return prisma.productionPricingProfile.findUnique({
      where: { version },
      include: { complexityTiers: { orderBy: { sortOrder: "asc" } } }
    });
  },

  async listBenchmarkSamples() {
    return prisma.productionBenchmarkSample.findMany({
      where: { status: "VERIFIED" },
      orderBy: { recordedAt: "asc" }
    });
  },

  async getBenchmarkByCode(sampleCode: string) {
    return prisma.productionBenchmarkSample.findUnique({ where: { sampleCode } });
  },

  async upsertProfileFromConfig() {
    const config = PRODUCTION_PRICING_PROFILE_V1;
    const profile = await prisma.productionPricingProfile.upsert({
      where: { version: config.version },
      update: {
        defaultGenerationMultiplier: decimal(config.defaultGenerationMultiplier),
        defaultUsableRate: decimal(config.defaultUsableRate),
        productionUnitSeconds: config.productionUnitSeconds,
        defaultHourlyRateUsd: decimal(config.defaultHourlyRateUsd),
        minCreatorProfitMargin: decimal(config.minCreatorProfitMargin),
        targetCreatorProfitMargin: decimal(config.targetCreatorProfitMargin),
        platformCommissionRate: decimal(config.platformCommissionRate),
        paymentCostRate: decimal(config.paymentCostRate),
        riskReserveRate: decimal(config.riskReserveRate),
        revisionReserveStandard: decimal(config.revisionReserveStandard),
        riskBufferStandard: decimal(config.riskBufferStandard),
        tokensPer15s4kGeneration: config.tokensPer15s4kGeneration,
        isActive: true,
        notes: "V1 — owner-verified samples SAMPLE_001 + SAMPLE_002 plus learning-library benchmarks SAMPLE_003–SAMPLE_006"
      },
      create: {
        version: config.version,
        defaultGenerationMultiplier: decimal(config.defaultGenerationMultiplier),
        defaultUsableRate: decimal(config.defaultUsableRate),
        productionUnitSeconds: config.productionUnitSeconds,
        defaultHourlyRateUsd: decimal(config.defaultHourlyRateUsd),
        minCreatorProfitMargin: decimal(config.minCreatorProfitMargin),
        targetCreatorProfitMargin: decimal(config.targetCreatorProfitMargin),
        platformCommissionRate: decimal(config.platformCommissionRate),
        paymentCostRate: decimal(config.paymentCostRate),
        riskReserveRate: decimal(config.riskReserveRate),
        revisionReserveStandard: decimal(config.revisionReserveStandard),
        riskBufferStandard: decimal(config.riskBufferStandard),
        tokensPer15s4kGeneration: config.tokensPer15s4kGeneration,
        isActive: true,
        notes: "V1 — owner-verified samples SAMPLE_001 + SAMPLE_002 plus learning-library benchmarks SAMPLE_003–SAMPLE_006"
      }
    });

    for (const [index, tier] of config.tiers.entries()) {
      await prisma.projectComplexityTier.upsert({
        where: {
          profileId_tier: {
            profileId: profile.id,
            tier: tier.tier
          }
        },
        update: {
          labelEn: tier.labelEn,
          labelZh: tier.labelZh,
          generationMultiplier: decimal(tier.generationMultiplier),
          tokensPer15sUnit: tier.tokensPer15sUnit == null ? null : decimal(tier.tokensPer15sUnit),
          usableRate: tier.usableRate == null ? null : decimal(tier.usableRate),
          complexityCoefficient:
            tier.complexityCoefficient == null ? null : decimal(tier.complexityCoefficient),
          avgShotLengthSeconds:
            tier.avgShotLengthSeconds == null ? null : decimal(tier.avgShotLengthSeconds),
          riskCoefficient: decimal(tier.riskCoefficient),
          sortOrder: index
        },
        create: {
          profileId: profile.id,
          tier: tier.tier,
          labelEn: tier.labelEn,
          labelZh: tier.labelZh,
          generationMultiplier: decimal(tier.generationMultiplier),
          tokensPer15sUnit: tier.tokensPer15sUnit == null ? null : decimal(tier.tokensPer15sUnit),
          usableRate: tier.usableRate == null ? null : decimal(tier.usableRate),
          complexityCoefficient:
            tier.complexityCoefficient == null ? null : decimal(tier.complexityCoefficient),
          avgShotLengthSeconds:
            tier.avgShotLengthSeconds == null ? null : decimal(tier.avgShotLengthSeconds),
          riskCoefficient: decimal(tier.riskCoefficient),
          sortOrder: index
        }
      });
    }

    return profile;
  },

  async upsertBenchmarkSample(sample: BenchmarkSampleInput) {
    const data = {
      projectName: sample.projectName,
      projectType: sample.projectType,
      difficultyTier: sample.difficultyTier,
      status: "VERIFIED" as const,
      finalDurationSeconds: sample.finalDurationSeconds,
      productionUnitSeconds: sample.productionUnitSeconds ?? 15,
      effectiveUnitCount: decimal(sample.effectiveUnitCount),
      totalShotCount: sample.totalShotCount ?? null,
      aiToolSpendUsd: sample.aiToolSpendUsd == null ? null : decimal(sample.aiToolSpendUsd),
      aiCostPer15sUsd: sample.aiCostPer15sUsd == null ? null : decimal(sample.aiCostPer15sUsd),
      aiCostPerSecondUsd:
        sample.aiCostPerSecondUsd == null ? null : decimal(sample.aiCostPerSecondUsd),
      totalTokensConsumed: sample.totalTokensConsumed ?? null,
      tokensPer15sUnit: sample.tokensPer15sUnit == null ? null : decimal(sample.tokensPer15sUnit),
      tokensPerSecond: sample.tokensPerSecond == null ? null : decimal(sample.tokensPerSecond),
      tokensPerSingle15s4kGen: sample.tokensPerSingle15s4kGen ?? null,
      totalGenerations: sample.totalGenerations ?? null,
      usedGenerations: sample.usedGenerations ?? null,
      generationMultiplier: decimal(sample.generationMultiplier),
      usableRate: decimal(sample.usableRate),
      complexityCoefficient:
        sample.complexityCoefficient == null ? null : decimal(sample.complexityCoefficient),
      productionDays: sample.productionDays ?? null,
      hoursPerDay: sample.hoursPerDay == null ? null : decimal(sample.hoursPerDay),
      totalLaborHours: sample.totalLaborHours == null ? null : decimal(sample.totalLaborHours),
      revisionRounds: sample.revisionRounds ?? null,
      editingHours: sample.editingHours == null ? null : decimal(sample.editingHours),
      dataSource: sample.dataSource,
      sourceType: sample.sourceType ?? "VERIFIED",
      assumptionText: sample.assumptionText ?? null,
      confidenceLevel: sample.confidenceLevel ?? null,
      notes: sample.notes ?? null,
      metadataJson: asInputJson(sample.metadataJson),
      recordedAt: sample.recordedAt
    };

    return prisma.productionBenchmarkSample.upsert({
      where: { sampleCode: sample.sampleCode },
      update: data,
      create: {
        sampleCode: sample.sampleCode,
        ...data
      }
    });
  },

  async seedVerifiedBenchmarks() {
    await this.upsertProfileFromConfig();
    for (const sample of VERIFIED_BENCHMARK_SAMPLES) {
      await this.upsertBenchmarkSample(sample);
    }
  },

  async saveCampaignEstimate(
    campaignId: string,
    estimate: {
      profileVersion: string;
      difficultyTier: ProductionDifficultyTier;
      estimatedShotCount: number;
      estimatedGenerations: number;
      estimatedLaborHours: number;
      toolCostUsd: number;
      laborCostUsd: number;
      revisionReserveUsd: number;
      riskBufferUsd: number;
      creatorMinIncomeUsd: number;
      brandFloorPriceUsd: number;
      brandSuggestedPriceUsd: number;
      brandPriorityPriceUsd: number;
      brandPremiumPriceUsd: number;
      estimateJson?: Prisma.InputJsonValue;
    }
  ) {
    return prisma.projectCostEstimate.create({
      data: {
        campaignId,
        profileVersion: estimate.profileVersion,
        difficultyTier: estimate.difficultyTier,
        estimatedShotCount: estimate.estimatedShotCount,
        estimatedGenerations: estimate.estimatedGenerations,
        estimatedLaborHours: decimal(estimate.estimatedLaborHours),
        toolCostUsd: decimal(estimate.toolCostUsd),
        laborCostUsd: decimal(estimate.laborCostUsd),
        revisionReserveUsd: decimal(estimate.revisionReserveUsd),
        riskBufferUsd: decimal(estimate.riskBufferUsd),
        creatorMinIncomeUsd: decimal(estimate.creatorMinIncomeUsd),
        brandFloorPriceUsd: decimal(estimate.brandFloorPriceUsd),
        brandSuggestedPriceUsd: decimal(estimate.brandSuggestedPriceUsd),
        brandPriorityPriceUsd: decimal(estimate.brandPriorityPriceUsd),
        brandPremiumPriceUsd: decimal(estimate.brandPremiumPriceUsd),
        estimateJson: estimate.estimateJson
      }
    });
  }
};
