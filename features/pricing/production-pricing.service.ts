import { productionPricingRepository } from "@/features/pricing/production-pricing.repository";
import {
  estimateProjectCost,
  resolveDifficultyTierForProjectType
} from "@/features/pricing/production-pricing-estimate.service";
import type {
  ProjectEstimateBriefInput,
  ProjectEstimateBreakdown,
  ProjectEstimateInput
} from "@/features/pricing/production-pricing.types";

export function estimateFromBrief(input: ProjectEstimateBriefInput): ProjectEstimateBreakdown {
  const difficultyTier =
    input.difficultyTier ?? resolveDifficultyTierForProjectType(input.projectType);

  return estimateProjectCost({
    durationSeconds: input.durationSeconds,
    difficultyTier,
    projectType: input.projectType as ProjectEstimateInput["projectType"],
    avgShotLengthSeconds: input.avgShotLengthSeconds,
    hourlyRateUsd: input.hourlyRateUsd,
    revisionRounds: input.revisionRounds,
    rushDelivery: input.rushDelivery
  });
}

export const productionPricingService = {
  async ensureBenchmarksSeeded() {
    return productionPricingRepository.seedVerifiedBenchmarks();
  },

  async listVerifiedSamples() {
    return productionPricingRepository.listBenchmarkSamples();
  },

  async getActiveProfile() {
    return productionPricingRepository.getActiveProfile();
  },

  estimateFromBrief,

  async estimateAndPersistForCampaign(campaignId: string, input: ProjectEstimateBriefInput) {
    const estimate = estimateFromBrief(input);
    const saved = await productionPricingRepository.saveCampaignEstimate(campaignId, {
      profileVersion: estimate.profileVersion,
      difficultyTier: estimate.difficultyTier,
      estimatedShotCount: estimate.estimatedShotCount,
      estimatedGenerations: estimate.estimatedGenerations,
      estimatedLaborHours: estimate.estimatedLaborHours,
      toolCostUsd: estimate.toolCostUsd,
      laborCostUsd: estimate.laborCostUsd,
      revisionReserveUsd: estimate.revisionReserveUsd,
      riskBufferUsd: estimate.riskBufferUsd,
      creatorMinIncomeUsd: estimate.creatorMinIncomeUsd,
      brandFloorPriceUsd: estimate.brandFloorPriceUsd,
      brandSuggestedPriceUsd: estimate.brandSuggestedPriceUsd,
      brandPriorityPriceUsd: estimate.brandPriorityPriceUsd,
      brandPremiumPriceUsd: estimate.brandPremiumPriceUsd,
      estimateJson: estimate
    });
    return { estimate, saved };
  }
};
