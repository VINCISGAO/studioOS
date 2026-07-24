"use client";

import { Check, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { GenerationAssetLibraryPreview } from "@/components/canvas/generation-asset-library-preview";
import type { CanvasAssetLibraryKind } from "@/lib/canvas/canvas-library-kind";
import { libraryAcceptMime } from "@/lib/canvas/canvas-library-kind";
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
  libraryKind,
  assets,
  loading,
  uploading,
  uploadProgress,
  manageMode,
  multiSelect,
  pendingId,
  selectedIds,
  checkedIds,
  deleting,
  uploadLabel,
  onUploadFiles,
  onToggleChecked,
  onToggleSelected,
  onSelectAsset,
  onDeleteAsset
}: {
  locale: Locale;
  libraryKind: CanvasAssetLibraryKind;
  assets: CanvasLibraryAsset[];
  loading: boolean;
  uploading: boolean;
  uploadProgress: { done: number; total: number } | null;
  manageMode: boolean;
  multiSelect: boolean;
  pendingId: string | null;
  selectedIds: string[];
  checkedIds: string[];
  deleting: boolean;
  uploadLabel: string;
  onUploadFiles: (files: File[]) => Promise<void>;
  onToggleChecked: (assetId: string) => void;
  onToggleSelected: (assetId: string) => void;
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
      <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white px-2 text-center text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700">
        <input
          type="file"
          className="hidden"
          multiple
          accept={libraryAcceptMime(libraryKind)}
          onChange={async (event) => {
            const files = [...(event.target.files ?? [])];
            event.currentTarget.value = "";
            if (!files.length) return;
            await onUploadFiles(files);
          }}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            {uploadProgress ? (
              <span className="text-[10px] tabular-nums text-zinc-400">
                {uploadProgress.done}/{uploadProgress.total}
              </span>
            ) : null}
          </div>
        ) : (
          <>
            <Plus className="h-6 w-6" />
            <span className="mt-2 text-xs">{uploadLabel}</span>
          </>
        )}
      </label>

      {assets.map((asset) => {
        const badge = reviewBadge(locale, asset);
        const deleteChecked = checkedIds.includes(asset.id);
        const pickSelected = selectedIds.includes(asset.id);
        const showPickCheckbox = multiSelect && !manageMode && asset.selectable;
        const showDeleteCheckbox = manageMode;
        return (
          <div
            key={asset.id}
            className={cn(
              "overflow-hidden rounded-2xl border bg-white text-left transition",
              manageMode
                ? "border-zinc-200"
                : multiSelect && pickSelected
                  ? "border-violet-500 ring-2 ring-violet-500/15"
                  : !multiSelect && pendingId === asset.id
                    ? "border-zinc-900 ring-2 ring-zinc-900/10"
                    : "border-zinc-200"
            )}
          >
            <button
              type="button"
              disabled={manageMode ? false : multiSelect ? !asset.selectable : !asset.selectable}
              onClick={() => {
                if (manageMode) {
                  onToggleChecked(asset.id);
                  return;
                }
                if (multiSelect) {
                  if (!asset.selectable) return;
                  onToggleSelected(asset.id);
                  return;
                }
                if (!asset.selectable) return;
                onSelectAsset(asset.id);
              }}
              className={cn(
                "relative block w-full",
                !manageMode && !multiSelect && !asset.selectable && "cursor-not-allowed opacity-70",
                !manageMode && multiSelect && !asset.selectable && "cursor-not-allowed opacity-70"
              )}
            >
              <GenerationAssetLibraryPreview asset={asset} />
              <span
                className={cn(
                  "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium",
                  badge.className
                )}
              >
                {badge.label}
              </span>
              {showPickCheckbox ? (
                <span
                  className={cn(
                    "absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded border-2 shadow-sm transition",
                    pickSelected
                      ? "border-violet-600 bg-violet-600 text-white"
                      : "border-zinc-300 bg-white/95 text-transparent"
                  )}
                  aria-hidden
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              ) : null}
              {showDeleteCheckbox ? (
                <span
                  className={cn(
                    "absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full border bg-white text-[10px]",
                    deleteChecked && "border-zinc-900 bg-zinc-900 text-white"
                  )}
                >
                  {deleteChecked ? "✓" : ""}
                </span>
              ) : null}
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
