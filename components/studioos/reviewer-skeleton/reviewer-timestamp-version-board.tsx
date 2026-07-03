"use client";

import type { RefObject } from "react";
import { Play } from "lucide-react";
import {
  ReviewerVersionUploadZone,
  type ReviewerVersionUploadUI
} from "@/components/studioos/reviewer-skeleton/reviewer-version-upload-zone";
import type { ReviewerVersionReadyState } from "@/components/studioos/reviewer-skeleton/reviewer-timestamp-use-versions";
import type { Locale } from "@/lib/i18n";
import type { StoredDeliverable } from "@/lib/order-types";
import { formatTimestamp } from "@/lib/studioos/review-utils";
import { cn, formatDate } from "@/lib/utils";

const copy = {
  zh: {
    versionList: "版本列表",
    versionInfo: "版本信息",
    loadMore: "加载更多版本",
    fileName: "文件名",
    duration: "时长",
    resolution: "分辨率",
    size: "大小",
    uploader: "上传者",
    uploadedAt: "上传时间",
    notes: "备注",
    notesPlaceholder: "版本说明（可选）",
    creator: "Creator",
    processing: "正在处理中…",
    ready: "Ready ✓"
  },
  en: {
    versionList: "Versions",
    versionInfo: "Version details",
    loadMore: "Load more versions",
    fileName: "File name",
    duration: "Duration",
    resolution: "Resolution",
    size: "Size",
    uploader: "Uploader",
    uploadedAt: "Uploaded",
    notes: "Notes",
    notesPlaceholder: "Version notes (optional)",
    creator: "Creator",
    processing: "Processing…",
    ready: "Ready ✓"
  }
};

export function ReviewerTimestampVersionBoard({
  locale,
  role,
  versions,
  activeVersion,
  durationSec,
  uploadNotes,
  uploadUI,
  versionReadyState,
  fileRef,
  onSelectVersion,
  onUploadNotesChange,
  onFileInputChange,
  onUploadFile,
  onCancelUpload,
  onOpenPicker
}: {
  locale: Locale;
  role: "brand" | "creator";
  versions: StoredDeliverable[];
  activeVersion: number;
  durationSec: number;
  uploadNotes: string;
  uploadUI: ReviewerVersionUploadUI;
  versionReadyState: Record<number, ReviewerVersionReadyState>;
  fileRef: RefObject<HTMLInputElement | null>;
  onSelectVersion: (version: number) => void;
  onUploadNotesChange: (value: string) => void;
  onFileInputChange: () => void;
  onUploadFile: (file: File) => void;
  onCancelUpload: () => void;
  onOpenPicker: () => void;
}) {
  const t = copy[locale];
  const sorted = [...versions].sort((a, b) => b.version - a.version);
  const active = sorted.find((item) => item.version === activeVersion) ?? sorted[0];

  return (
    <section className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
      <div className="rounded-xl border border-zinc-200 bg-white p-3">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">{t.versionList}</h3>
        <ul className="space-y-2">
          {sorted.map((item) => {
            const selected = item.version === activeVersion;
            const readyState = versionReadyState[item.version];
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelectVersion(item.version)}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2.5 text-left transition",
                    selected
                      ? "border-violet-500 bg-violet-50 ring-1 ring-violet-200"
                      : "border-zinc-200 hover:border-zinc-300"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <p className={cn("text-sm font-semibold", selected ? "text-violet-700" : "text-zinc-900")}>
                      V{item.version}
                    </p>
                    {readyState === "processing" ? (
                      <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                        {t.processing}
                      </span>
                    ) : readyState === "ready" ? (
                      <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                        {t.ready}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    {item.created_at ? formatDate(item.created_at) : "—"}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-500">{t.creator}</p>
                </button>
              </li>
            );
          })}
        </ul>
        {sorted.length > 3 ? (
          <button type="button" className="mt-3 w-full text-xs font-medium text-violet-600">
            {t.loadMore}
          </button>
        ) : null}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900">{t.versionInfo}</h3>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px]">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
            <dt className="text-zinc-500">{t.fileName}</dt>
            <dd className="font-medium text-zinc-900">
              {active ? `studioos-v${active.version}.mp4` : "—"}
            </dd>
            <dt className="text-zinc-500">{t.duration}</dt>
            <dd className="font-medium text-zinc-900">{formatTimestamp(durationSec)}</dd>
            <dt className="text-zinc-500">{t.resolution}</dt>
            <dd className="font-medium text-zinc-900">1920×1080</dd>
            <dt className="text-zinc-500">{t.size}</dt>
            <dd className="font-medium text-zinc-900">—</dd>
            <dt className="text-zinc-500">{t.uploader}</dt>
            <dd className="font-medium text-zinc-900">{t.creator}</dd>
            <dt className="text-zinc-500">{t.uploadedAt}</dt>
            <dd className="font-medium text-zinc-900">
              {active?.created_at ? formatDate(active.created_at) : "—"}
            </dd>
            <dt className="text-zinc-500">{t.notes}</dt>
            <dd className="text-zinc-800">{active?.notes || "—"}</dd>
          </dl>

          <div className="space-y-3">
            <div className="relative aspect-video overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-zinc-900/60" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow">
                  <Play className="h-4 w-4" />
                </span>
              </span>
            </div>
            {role === "creator" ? (
              <>
                <input
                  value={uploadNotes}
                  onChange={(event) => onUploadNotesChange(event.target.value)}
                  className="h-9 w-full rounded-lg border border-zinc-200 px-2 text-xs outline-none focus:border-violet-400"
                  placeholder={t.notesPlaceholder}
                  disabled={uploadUI.phase !== "idle"}
                />
                <ReviewerVersionUploadZone
                  locale={locale}
                  variant="panel"
                  inputId="review-version-upload"
                  fileRef={fileRef}
                  uploadUI={uploadUI}
                  onFileInputChange={onFileInputChange}
                  onUploadFile={onUploadFile}
                  onCancelUpload={onCancelUpload}
                  onOpenPicker={onOpenPicker}
                />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
