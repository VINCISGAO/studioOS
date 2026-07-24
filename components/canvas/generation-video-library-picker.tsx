"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { GenerationAssetLibraryPreview } from "@/components/canvas/generation-asset-library-preview";
import type { CanvasLibraryAsset, GenerationReference } from "@/lib/canvas/generation-ui";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  zh: { title: "从素材库选择" },
  en: { title: "Select from asset library" }
} as const;

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
};

function toReference(asset: CanvasLibraryAsset): GenerationReference {
  return {
    url: asset.url,
    assetId: asset.id,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    source: "library",
    reviewStatus: asset.reviewStatus,
    reviewReasons: asset.reviewReasons,
    selectable: asset.selectable
  };
}

export function GenerationVideoLibraryPicker({
  locale,
  projectId,
  selectedIds,
  onToggleSelection
}: {
  locale: Locale;
  projectId: string;
  selectedIds: string[];
  onToggleSelection: (reference: GenerationReference) => void;
}) {
  const t = copy[locale];
  const [assets, setAssets] = useState<CanvasLibraryAsset[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/canvas/assets?projectId=${encodeURIComponent(projectId)}&kind=image`,
        { cache: "no-store" }
      );
      const payload = (await response.json()) as ApiEnvelope<CanvasLibraryAsset[]>;
      if (payload.success && payload.data) {
        setAssets(payload.data.filter((asset) => asset.selectable));
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    void loadAssets();
  }, [projectId, loadAssets]);

  if (loading) {
    return (
      <div className="mt-4 flex h-24 items-center justify-center text-zinc-400">
        <LoaderCircle className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (assets.length === 0) return null;

  return (
    <div className="mt-4">
      <h3 className="mb-2.5 text-sm font-semibold text-zinc-950">{t.title}</h3>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {assets.map((asset) => {
          const selected = selectedIds.includes(asset.id);
          return (
            <button
              key={asset.id}
              type="button"
              onClick={() => onToggleSelection(toReference(asset))}
              onPointerDown={(event) => event.stopPropagation()}
              className="nodrag nopan pointer-events-auto w-[108px] shrink-0 text-left"
            >
              <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white">
                <GenerationAssetLibraryPreview asset={asset} />
                {selected ? (
                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-sm bg-zinc-900 text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                ) : null}
              </div>
              <p className="mt-1 truncate px-0.5 text-[11px] text-zinc-700">{asset.fileName}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
