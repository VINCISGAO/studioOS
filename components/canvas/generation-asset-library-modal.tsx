"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { GenerationAssetLibraryGrid } from "@/components/canvas/generation-asset-library-grid";
import { GenerationSeedanceRequirementsDialog } from "@/components/canvas/generation-seedance-requirements-dialog";
import { useBodyPortalReady } from "@/components/canvas/hooks/use-body-portal-ready";
import type { GenerationReferenceSlot } from "@/components/canvas/generation-kind-selector";
import {
  canvasLibraryKindFromReferenceSlot,
  libraryCopy,
  type CanvasAssetLibraryKind
} from "@/lib/canvas/canvas-library-kind";
import type { CanvasLibraryAsset, GenerationReference } from "@/lib/canvas/generation-ui";
import { CANVAS_GENERATION_MODAL_Z_INDEX } from "@/lib/canvas/generation-ui";
import type { Locale } from "@/lib/i18n";

const sharedCopy = {
  zh: {
    requirements: "Seedance 素材要求",
    done: "完成",
    batchDelete: "批量删除",
    selectMode: "批量管理",
    cancelSelect: "取消",
    deleteFailed: "删除失败",
    uploadFailed: "上传失败"
  },
  en: {
    requirements: "Seedance asset requirements",
    done: "Done",
    batchDelete: "Delete selected",
    selectMode: "Manage",
    cancelSelect: "Cancel",
    deleteFailed: "Delete failed",
    uploadFailed: "Upload failed"
  }
} as const;

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { message?: string };
};

function toLibraryAsset(reference: GenerationReference, file: File): CanvasLibraryAsset {
  const assetType = file.type.startsWith("video/")
    ? "REFERENCE_VIDEO"
    : file.type.startsWith("audio/") || file.name.toLowerCase().endsWith(".mp3")
      ? "MUSIC"
      : "REFERENCE_IMAGE";
  return {
    id: reference.assetId ?? reference.url,
    fileName: reference.fileName,
    mimeType: reference.mimeType ?? file.type,
    url: reference.url,
    assetType,
    reviewStatus: reference.reviewStatus ?? "PENDING",
    reviewReasons: reference.reviewReasons ?? [],
    selectable: reference.selectable ?? false
  };
}

export function GenerationAssetLibraryModal({
  locale,
  projectId,
  libraryKind,
  open,
  selectedId,
  onClose,
  onSelect,
  onUpload
}: {
  locale: Locale;
  projectId: string;
  libraryKind: CanvasAssetLibraryKind;
  open: boolean;
  selectedId?: string;
  onClose: () => void;
  onSelect: (reference: GenerationReference) => void;
  onUpload: (file: File, libraryKind: CanvasAssetLibraryKind) => Promise<GenerationReference>;
}) {
  const portalReady = useBodyPortalReady();
  const t = sharedCopy[locale];
  const kindCopy = useMemo(() => libraryCopy(locale, libraryKind), [locale, libraryKind]);
  const [assets, setAssets] = useState<CanvasLibraryAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(selectedId ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [manageMode, setManageMode] = useState(false);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRequirements, setShowRequirements] = useState(false);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/canvas/assets?projectId=${encodeURIComponent(projectId)}&kind=${libraryKind}`,
        { cache: "no-store" }
      );
      const payload = (await response.json()) as ApiEnvelope<CanvasLibraryAsset[]>;
      if (payload.success && payload.data) setAssets(payload.data);
    } finally {
      setLoading(false);
    }
  }, [libraryKind, projectId]);

  useEffect(() => {
    if (!open || !projectId) return;
    setPendingId(selectedId ?? null);
    setManageMode(false);
    setCheckedIds([]);
    void loadAssets();
  }, [open, projectId, selectedId, libraryKind, loadAssets]);

  async function deleteAssets(assetIds: string[]) {
    if (!assetIds.length) return;
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch("/api/canvas/assets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, kind: libraryKind, assetIds })
      });
      const payload = (await response.json()) as ApiEnvelope<{ deleted: number; assetIds: string[] }>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error?.message ?? t.deleteFailed);
      }
      const removed = new Set(payload.data.assetIds);
      setAssets((current) => current.filter((item) => !removed.has(item.id)));
      setCheckedIds((current) => current.filter((id) => !removed.has(id)));
      if (pendingId && removed.has(pendingId)) setPendingId(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t.deleteFailed);
    } finally {
      setDeleting(false);
    }
  }

  async function handleUploadFiles(files: File[]) {
    if (!files.length) return;
    setUploading(true);
    setUploadProgress({ done: 0, total: files.length });
    setError(null);
    const uploadedAssets: CanvasLibraryAsset[] = [];
    try {
      for (const [index, file] of files.entries()) {
        const reference = await onUpload(file, libraryKind);
        uploadedAssets.push(toLibraryAsset(reference, file));
        setUploadProgress({ done: index + 1, total: files.length });
      }
      if (uploadedAssets.length) {
        const firstSelectable = uploadedAssets.find((item) => item.selectable);
        if (firstSelectable) setPendingId(firstSelectable.id);
        setAssets((current) => [...uploadedAssets, ...current]);
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : t.uploadFailed);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  if (!open || !portalReady) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 flex items-center justify-center bg-black/35 p-4"
        style={{ zIndex: CANVAS_GENERATION_MODAL_Z_INDEX }}
        role="dialog"
        aria-modal="true"
        aria-label={kindCopy.title}
      >
        <div className="flex max-h-[88vh] w-full max-w-[760px] flex-col overflow-hidden rounded-3xl bg-[#f3f3f2] shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4">
            <h2 className="text-base font-semibold text-zinc-950">{kindCopy.title}</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setManageMode((value) => !value);
                  setCheckedIds([]);
                }}
                className="rounded-lg px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              >
                {manageMode ? t.cancelSelect : t.selectMode}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <GenerationAssetLibraryGrid
              locale={locale}
              libraryKind={libraryKind}
              assets={assets}
              loading={loading}
              uploading={uploading}
              uploadProgress={uploadProgress}
              manageMode={manageMode}
              pendingId={pendingId}
              checkedIds={checkedIds}
              deleting={deleting}
              uploadLabel={kindCopy.upload}
              onUploadFiles={handleUploadFiles}
              onToggleChecked={(assetId) =>
                setCheckedIds((current) =>
                  current.includes(assetId)
                    ? current.filter((id) => id !== assetId)
                    : [...current, assetId]
                )
              }
              onSelectAsset={setPendingId}
              onDeleteAsset={(assetId) => void deleteAssets([assetId])}
            />
            {!loading && assets.length === 0 ? (
              <p className="mt-4 text-center text-sm text-zinc-500">{kindCopy.empty}</p>
            ) : null}
            {error ? <p className="mt-3 text-center text-xs text-rose-600">{error}</p> : null}
          </div>

          <div className="flex items-center justify-between border-t border-zinc-200 bg-white px-5 py-4">
            {libraryKind === "video" ? (
              <button
                type="button"
                onClick={() => setShowRequirements(true)}
                className="text-sm text-zinc-500 hover:text-zinc-800"
              >
                {t.requirements} &gt;
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              {manageMode && checkedIds.length ? (
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => void deleteAssets(checkedIds)}
                  className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                >
                  {t.batchDelete} ({checkedIds.length})
                </button>
              ) : null}
              <button
                type="button"
                disabled={!pendingId || manageMode}
                onClick={() => {
                  const asset = assets.find((item) => item.id === pendingId);
                  if (!asset?.selectable) return;
                  onSelect({
                    url: asset.url,
                    assetId: asset.id,
                    fileName: asset.fileName,
                    mimeType: asset.mimeType,
                    source: "library"
                  });
                  onClose();
                }}
                className="rounded-xl bg-zinc-900 px-8 py-2.5 text-sm font-medium text-white disabled:opacity-40"
              >
                {t.done}
              </button>
            </div>
          </div>
        </div>
      </div>

      <GenerationSeedanceRequirementsDialog
        locale={locale}
        open={showRequirements}
        onClose={() => setShowRequirements(false)}
      />
    </>,
    document.body
  );
}

export function generationAssetLibraryKindFromSlot(
  slot: GenerationReferenceSlot
): CanvasAssetLibraryKind {
  return canvasLibraryKindFromReferenceSlot(slot);
}
