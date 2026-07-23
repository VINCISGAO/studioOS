import type { AiModel } from "@prisma/client";
import type {
  PublicAiModelCapabilities,
  PublicAiModelCatalog,
  PublicAiModelView
} from "@/features/canvas/ai-model-catalog.types";
import { buildFallbackAiModelCatalog } from "@/lib/canvas/ai-model-catalog-fallback";
import { isRunnableCanvasAiModel, isRunnableFallbackModelId } from "@/lib/canvas/canvas-runnable-models";
import { logger } from "@/lib/core/logger";
import { hasMureka, hasOpenAI, hasSeedance } from "@/lib/core/config/ai";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

const SERVER_CACHE_TTL_MS = 60_000;
const DB_QUERY_TIMEOUT_MS = 8_000;

let serverCachedCatalog: PublicAiModelCatalog | null = null;
let serverCachedAt = 0;

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

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
      })
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function groupModels(models: PublicAiModelView[]): PublicAiModelCatalog["grouped"] {
  return {
    VIDEO: models.filter((model) => model.category === "VIDEO"),
    IMAGE: models.filter((model) => model.category === "IMAGE"),
    MUSIC: models.filter((model) => model.category === "MUSIC"),
    VOICE: models.filter((model) => model.category === "VOICE"),
    THREE_D: models.filter((model) => model.category === "THREE_D")
  };
}

function cacheCatalog(catalog: PublicAiModelCatalog) {
  serverCachedCatalog = catalog;
  serverCachedAt = Date.now();
  return catalog;
}

function filterRunnableModels(rows: AiModel[]) {
  const infra = { seedance: hasSeedance(), mureka: hasMureka(), openai: hasOpenAI() };
  return rows.filter((row) => isRunnableCanvasAiModel(row, infra)).map(serializePublicModel);
}

function filteredFallbackCatalog(now: Date) {
  const catalog = buildFallbackAiModelCatalog(now);
  const models = catalog.models.filter((model) => isRunnableFallbackModelId(model.id, model.category));
  return {
    models,
    grouped: groupModels(models),
    fetchedAt: catalog.fetchedAt
  } satisfies PublicAiModelCatalog;
}

async function queryPublicCatalog(now: Date) {
  const rows = await withTimeout(
    prisma.aiModel.findMany({
      where: {
        enabled: true,
        publiclyAvailable: true,
        deletedAt: null,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }]
      },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { displayName: "asc" }]
    }),
    DB_QUERY_TIMEOUT_MS,
    "AI model catalog query timed out"
  );

  const models = filterRunnableModels(rows);
  return {
    models,
    grouped: groupModels(models),
    fetchedAt: now.toISOString()
  } satisfies PublicAiModelCatalog;
}

export const aiModelCatalogService = {
  async listPublicCatalog(now = new Date()): Promise<PublicAiModelCatalog> {
    if (serverCachedCatalog && Date.now() - serverCachedAt < SERVER_CACHE_TTL_MS) {
      return serverCachedCatalog;
    }

    if (!hasDatabaseUrl()) {
      return cacheCatalog(filteredFallbackCatalog(now));
    }

    try {
      const catalog = await queryPublicCatalog(now);
      if (catalog.models.length === 0) {
        logger.warn("AI model catalog empty from DB; using fallback", {
          service: "aiModelCatalogService"
        });
        return cacheCatalog(filteredFallbackCatalog(now));
      }
      return cacheCatalog(catalog);
    } catch (error) {
      logger.warn("AI model catalog query failed; using fallback", {
        service: "aiModelCatalogService",
        error: error instanceof Error ? error.message : String(error)
      });
      return cacheCatalog(filteredFallbackCatalog(now));
    }
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
