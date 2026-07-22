import type { AiModel } from "@prisma/client";
import type {
  PublicAiModelCapabilities,
  PublicAiModelCatalog,
  PublicAiModelView
} from "@/features/canvas/ai-model-catalog.types";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

function serializeCapabilities(row: AiModel): PublicAiModelCapabilities {
  return {
    supportedModes: row.supportedModes,
    supportedAspectRatios: row.supportedAspectRatios,
    supportedDurations: row.supportedDurations,
    supportedResolutions: row.supportedResolutions,
    maxOutputCount: row.maxOutputCount,
    maxReferenceImages: row.maxReferenceImages,
    supportsFirstFrame: row.supportsFirstFrame,
    supportsLastFrame: row.supportsLastFrame,
    supportsAudioInput: row.supportsAudioInput,
    supportsPromptEnhancement: row.supportsPromptEnhancement,
    supportsSeed: row.supportsSeed,
    supportsNegativePrompt: row.supportsNegativePrompt,
    supportsInstrumental: row.supportsInstrumental,
    supportsVocal: row.supportsVocal,
    supportsLyrics: row.supportsLyrics,
    supportsStyleTags: row.supportsStyleTags,
    minDurationSec: row.minDurationSec,
    maxDurationSec: row.maxDurationSec
  };
}

function serializePublicModel(row: AiModel): PublicAiModelView {
  return {
    recordId: row.id,
    id: row.internalModelId,
    displayName: row.displayName,
    category: row.category,
    generationType: row.generationType,
    recommended: row.recommended,
    isDefault: row.isDefault,
    baseCreditPrice: row.baseCreditPrice,
    capabilities: serializeCapabilities(row)
  };
}

export const aiModelCatalogService = {
  async listPublicCatalog(now = new Date()): Promise<PublicAiModelCatalog> {
    if (!hasDatabaseUrl()) {
      return { models: [], grouped: { VIDEO: [], IMAGE: [], MUSIC: [], VOICE: [], THREE_D: [] }, fetchedAt: now.toISOString() };
    }

    const rows = await prisma.aiModel.findMany({
      where: {
        enabled: true,
        publiclyAvailable: true,
        deletedAt: null,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }]
      },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { displayName: "asc" }]
    });

    const models = rows.map(serializePublicModel);
    return {
      models,
      grouped: {
        VIDEO: models.filter((model) => model.category === "VIDEO"),
        IMAGE: models.filter((model) => model.category === "IMAGE"),
        MUSIC: models.filter((model) => model.category === "MUSIC"),
        VOICE: models.filter((model) => model.category === "VOICE"),
        THREE_D: models.filter((model) => model.category === "THREE_D")
      },
      fetchedAt: now.toISOString()
    };
  },

  async findAvailableByInternalId(internalModelId: string, now = new Date()) {
    if (!hasDatabaseUrl()) return null;
    const row = await prisma.aiModel.findFirst({
      where: {
        internalModelId,
        enabled: true,
        publiclyAvailable: true,
        deletedAt: null,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }]
      }
    });
    return row ? serializePublicModel(row) : null;
  },

  async findByInternalIdIncludingDisabled(internalModelId: string) {
    if (!hasDatabaseUrl()) return null;
    return prisma.aiModel.findFirst({
      where: { internalModelId, deletedAt: null }
    });
  }
};
