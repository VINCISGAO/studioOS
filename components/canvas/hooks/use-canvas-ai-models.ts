"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AiModelCategory } from "@prisma/client";
import type { PublicAiModelCatalog, PublicAiModelView } from "@/features/canvas/ai-model-catalog.types";
import type { GenerationKind } from "@/lib/canvas/generation-ui";

const CACHE_TTL_MS = 60_000;
let cachedCatalog: PublicAiModelCatalog | null = null;
let cachedAt = 0;

function kindToCategory(kind: GenerationKind): AiModelCategory {
  if (kind === "image") return "IMAGE";
  if (kind === "music") return "MUSIC";
  return "VIDEO";
}

export function invalidateCanvasAiModelCatalog() {
  cachedCatalog = null;
  cachedAt = 0;
}

export function useCanvasAiModels() {
  const [catalog, setCatalog] = useState<PublicAiModelCatalog | null>(cachedCatalog);
  const [loading, setLoading] = useState(!cachedCatalog);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    if (!force && cachedCatalog && Date.now() - cachedAt < CACHE_TTL_MS) {
      setCatalog(cachedCatalog);
      setLoading(false);
      setError(null);
      return cachedCatalog;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/credits/ai-models", { cache: "no-store" });
      const payload = (await response.json()) as {
        success: boolean;
        data?: PublicAiModelCatalog;
        error?: { message?: string };
      };
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error?.message ?? "Unable to load AI models");
      }
      cachedCatalog = payload.data;
      cachedAt = Date.now();
      setCatalog(payload.data);
      return payload.data;
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load AI models";
      setError(message);
      setCatalog(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  const modelsByKind = useMemo(
    () => ({
      image: catalog?.grouped.IMAGE ?? [],
      video: catalog?.grouped.VIDEO ?? [],
      music: catalog?.grouped.MUSIC ?? []
    }),
    [catalog]
  );

  function modelsForKind(kind: GenerationKind) {
    return modelsByKind[kind];
  }

  function defaultModelForKind(kind: GenerationKind): PublicAiModelView | null {
    const models = modelsForKind(kind);
    return models.find((model) => model.isDefault) ?? models[0] ?? null;
  }

  function findModel(modelId: string | null | undefined) {
    if (!modelId || !catalog) return null;
    return catalog.models.find((model) => model.id === modelId) ?? null;
  }

  function findModelForKind(kind: GenerationKind, modelId: string | null | undefined) {
    const model = findModel(modelId);
    if (!model) return null;
    return model.category === kindToCategory(kind) ? model : null;
  }

  return {
    catalog,
    loading,
    error,
    reload: () => load(true),
    modelsByKind,
    modelsForKind,
    defaultModelForKind,
    findModel,
    findModelForKind
  };
}
