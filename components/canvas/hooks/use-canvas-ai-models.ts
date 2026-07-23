"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AiModelCategory } from "@prisma/client";
import type { PublicAiModelCatalog, PublicAiModelView } from "@/features/canvas/ai-model-catalog.types";
import type { GenerationKind } from "@/lib/canvas/generation-ui";

const CACHE_TTL_MS = 60_000;
const FETCH_TIMEOUT_MS = 20_000;

let cachedCatalog: PublicAiModelCatalog | null = null;
let cachedAt = 0;
let inFlight: Promise<PublicAiModelCatalog | null> | null = null;

function kindToCategory(kind: GenerationKind): AiModelCategory {
  if (kind === "image") return "IMAGE";
  if (kind === "music") return "MUSIC";
  return "VIDEO";
}

type CatalogPayload = {
  success: boolean;
  data?: PublicAiModelCatalog;
  error?: { message?: string };
};

function readLoadError(error: unknown) {
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return "模型加载超时，请重试";
    }
    return error.message || "Unable to load AI models";
  }
  return "Unable to load AI models";
}

async function fetchCanvasAiModelCatalog(force = false): Promise<PublicAiModelCatalog | null> {
  if (!force && cachedCatalog && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedCatalog;
  }

  if (inFlight && !force) {
    return inFlight;
  }

  inFlight = (async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch("/api/v1/credits/ai-models", {
        cache: "no-store",
        signal: controller.signal
      });
      const payload = (await response.json()) as CatalogPayload;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error?.message ?? "Unable to load AI models");
      }
      cachedCatalog = payload.data;
      cachedAt = Date.now();
      return payload.data;
    } finally {
      window.clearTimeout(timeoutId);
      inFlight = null;
    }
  })();

  try {
    return await inFlight;
  } catch (error) {
    inFlight = null;
    throw error;
  }
}

export function invalidateCanvasAiModelCatalog() {
  cachedCatalog = null;
  cachedAt = 0;
  inFlight = null;
}

export function seedCanvasAiModelCatalog(catalog: PublicAiModelCatalog | null | undefined) {
  if (!catalog || catalog.models.length === 0) return;
  cachedCatalog = catalog;
  cachedAt = Date.now();
  inFlight = null;
}

export function preloadCanvasAiModelCatalog() {
  void fetchCanvasAiModelCatalog(false).catch(() => {
    // Warm cache best-effort; surfaced errors happen in hook consumers.
  });
}

export function useCanvasAiModels(initialCatalog?: PublicAiModelCatalog | null) {
  const [catalog, setCatalog] = useState<PublicAiModelCatalog | null>(
    initialCatalog ?? cachedCatalog
  );
  const [loading, setLoading] = useState(!(initialCatalog ?? cachedCatalog));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCatalog) {
      seedCanvasAiModelCatalog(initialCatalog);
      setCatalog(initialCatalog);
      setLoading(false);
      setError(null);
    }
  }, [initialCatalog]);

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
      const nextCatalog = await fetchCanvasAiModelCatalog(force);
      setCatalog(nextCatalog);
      return nextCatalog;
    } catch (loadError) {
      const message = readLoadError(loadError);
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
