"use client";

import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import type { CanvasLibraryAsset } from "@/lib/canvas/generation-ui";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function reviewBadge(locale: Locale, asset: CanvasLibraryAsset) {
  if (asset.reviewStatus === "APPROVED") {
    return {
      label: locale === "zh" ? "已通过" : "Approved",
      className: "bg-emerald-500/90 text-white"
    };
  }
  if (asset.reviewStatus === "PENDING") {
    return {
      label: locale === "zh" ? "审核中" : "Pending",
      className: "bg-amber-500/90 text-white"
    };
  }
  return {
    label: locale === "zh" ? "未通过" : "Rejected",
    className: "bg-rose-500/90 text-white"
  };
}

export function GenerationAssetLibraryGrid({
  locale,
  assets,
  loading,
  uploading,
  manageMode,
  pendingId,
  checkedIds,
  deleting,
  onUploadFile,
  onToggleChecked,
  onSelectAsset,
  onDeleteAsset
}: {
  locale: Locale;
  assets: CanvasLibraryAsset[];
  loading: boolean;
  uploading: boolean;
  manageMode: boolean;
  pendingId: string | null;
  checkedIds: string[];
  deleting: boolean;
  onUploadFile: (file: File) => Promise<void>;
  onToggleChecked: (assetId: string) => void;
  onSelectAsset: (assetId: string) => void;
  onDeleteAsset: (assetId: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-400">
        <LoaderCircle className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700">
        <input
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.currentTarget.value = "";
            if (!file) return;
            await onUploadFile(file);
          }}
        />
        {uploading ? (
          <LoaderCircle className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <Plus className="h-6 w-6" />
            <span className="mt-2 text-xs">{locale === "zh" ? "上传素材" : "Upload asset"}</span>
          </>
        )}
      </label>

      {assets.map((asset) => {
        const badge = reviewBadge(locale, asset);
        const checked = checkedIds.includes(asset.id);
        return (
          <div
            key={asset.id}
            className={cn(
              "overflow-hidden rounded-2xl border bg-white text-left transition",
              !manageMode && pendingId === asset.id
                ? "border-zinc-900 ring-2 ring-zinc-900/10"
                : "border-zinc-200"
            )}
          >
            <button
              type="button"
              disabled={manageMode ? false : !asset.selectable}
              onClick={() => {
                if (manageMode) {
                  onToggleChecked(asset.id);
                  return;
                }
                if (!asset.selectable) return;
                onSelectAsset(asset.id);
              }}
              className={cn(
                "relative block w-full",
                !manageMode && !asset.selectable && "cursor-not-allowed opacity-70"
              )}
            >
              <div className="relative aspect-[4/3] bg-zinc-100">
                {asset.mimeType.startsWith("video/") ? (
                  <video src={asset.url} className="h-full w-full object-cover" muted playsInline />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.url} alt={asset.fileName} className="h-full w-full object-cover" />
                )}
                <span
                  className={cn(
                    "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    badge.className
                  )}
                >
                  {badge.label}
                </span>
                {manageMode ? (
                  <span
                    className={cn(
                      "absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full border bg-white text-[10px]",
                      checked && "border-zinc-900 bg-zinc-900 text-white"
                    )}
                  >
                    {checked ? "✓" : ""}
                  </span>
                ) : null}
              </div>
              <div className="truncate px-3 py-2 text-xs text-zinc-700">{asset.fileName}</div>
              {asset.reviewStatus === "REJECTED" && asset.reviewReasons[0] ? (
                <div className="px-3 pb-2 text-[10px] leading-4 text-rose-600">
                  {asset.reviewReasons[0]}
                </div>
              ) : null}
            </button>
            {manageMode ? (
              <button
                type="button"
                disabled={deleting}
                onClick={() => onDeleteAsset(asset.id)}
                className="flex w-full items-center justify-center gap-1 border-t border-zinc-100 py-2 text-xs text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {locale === "zh" ? "删除" : "Delete"}
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
