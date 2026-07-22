import type { AiModel, GenerationType } from "@prisma/client";
import { aiModelCatalogService } from "@/features/canvas/ai-model-catalog.service";
import { creditPricingRepository, inferGenerationMode } from "@/features/credit-wallet/credit-pricing.repository";
import { appError } from "@/lib/core/errors";

function readOutputCount(parameters: Record<string, unknown>) {
  const count = Number(parameters.outputs ?? parameters.outputCount ?? 1);
  return Number.isFinite(count) && count > 0 ? Math.round(count) : 1;
}

function readDuration(parameters: Record<string, unknown>) {
  const duration = Number(parameters.duration ?? parameters.durationSec ?? 0);
  return Number.isFinite(duration) && duration > 0 ? Math.round(duration) : null;
}

export const aiModelGenerationGuard = {
  async resolveForGeneration(input: {
    type: GenerationType;
    model: string;
    parameters: Record<string, unknown>;
    allowDisabled?: boolean;
  }) {
    const row = await aiModelCatalogService.findByInternalIdIncludingDisabled(input.model);
    if (!row) {
      throw appError("NOT_FOUND", "AI model is not registered");
    }
    if (row.deletedAt) {
      throw appError("VALIDATION_ERROR", "AI model is no longer available");
    }
    if (!input.allowDisabled) {
      if (!row.enabled || !row.publiclyAvailable) {
        throw appError("VALIDATION_ERROR", "AI model is currently unavailable");
      }
      const now = new Date();
      if (row.startsAt && row.startsAt > now) {
        throw appError("VALIDATION_ERROR", "AI model is not available yet");
      }
      if (row.endsAt && row.endsAt < now) {
        throw appError("VALIDATION_ERROR", "AI model is no longer available");
      }
    }
    if (row.generationType !== input.type) {
      throw appError("VALIDATION_ERROR", "AI model type mismatch");
    }

    this.assertParameters(row, input.parameters);

    const pricingRule = await creditPricingRepository.findBestMatchingRule({
      type: input.type,
      model: row.internalModelId,
      parameters: input.parameters
    });
    if (!pricingRule) {
      throw appError("NOT_FOUND", `No pricing rule configured for ${input.type} / ${row.internalModelId}`);
    }

    return {
      recordId: row.id,
      internalModelId: row.internalModelId,
      displayName: row.displayName,
      provider: row.provider,
      generationType: row.generationType,
      pricingRuleId: pricingRule.id
    };
  },

  assertParameters(row: AiModel, parameters: Record<string, unknown>) {
    if (row.generationType === "MUSIC") {
      const mode = String(parameters.mode ?? "custom").trim().toUpperCase();
      if (row.supportedModes.length > 0 && !row.supportedModes.includes(mode)) {
        throw appError("VALIDATION_ERROR", "Music mode is not supported by this model");
      }
      const duration = readDuration(parameters);
      if (duration != null) {
        if (row.minDurationSec != null && duration < row.minDurationSec) {
          throw appError("VALIDATION_ERROR", "Duration is below model minimum");
        }
        if (row.maxDurationSec != null && duration > row.maxDurationSec) {
          throw appError("VALIDATION_ERROR", "Duration exceeds model maximum");
        }
        if (row.supportedDurations.length > 0 && !row.supportedDurations.includes(duration)) {
          throw appError("VALIDATION_ERROR", "Duration is not supported by this model");
        }
      }
      return;
    }

    const mode = inferGenerationMode(row.generationType, parameters);
    if (row.supportedModes.length > 0 && !row.supportedModes.includes(mode)) {
      throw appError("VALIDATION_ERROR", "Generation mode is not supported by this model");
    }

    const aspectRatio = String(parameters.aspectRatio ?? "auto");
    if (row.supportedAspectRatios.length > 0 && !row.supportedAspectRatios.includes(aspectRatio)) {
      throw appError("VALIDATION_ERROR", "Aspect ratio is not supported by this model");
    }

    const duration = readDuration(parameters);
    if (duration != null && row.supportedDurations.length > 0) {
      if (!row.supportedDurations.includes(duration)) {
        throw appError("VALIDATION_ERROR", "Duration is not supported by this model");
      }
    }

    const resolution = String(parameters.quality ?? parameters.resolution ?? parameters.width ?? "");
    if (resolution && row.supportedResolutions.length > 0) {
      const normalized = resolution.toLowerCase();
      const allowed = row.supportedResolutions.some(
        (item) => item.toLowerCase() === normalized || normalized.includes(item.toLowerCase())
      );
      if (!allowed) {
        throw appError("VALIDATION_ERROR", "Resolution is not supported by this model");
      }
    }

    const outputs = readOutputCount(parameters);
    if (outputs > row.maxOutputCount) {
      throw appError("VALIDATION_ERROR", "Output count exceeds model limit");
    }

    const referenceCount = [
      parameters.referenceAssetId,
      parameters.referenceUrl,
      parameters.referenceNodeId
    ].filter(Boolean).length;
    if (referenceCount > row.maxReferenceImages) {
      throw appError("VALIDATION_ERROR", "Too many reference assets for this model");
    }
  }
};
