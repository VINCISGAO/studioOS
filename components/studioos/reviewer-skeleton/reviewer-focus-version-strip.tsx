"use client";

import type { RefObject } from "react";
import { Plus } from "lucide-react";
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
    current: "当前版本",
    upload: "上传新版本",
    duration: "时长",
    processing: "正在处理中…",
    ready: "Ready ✓"
  },
  en: {
    current: "Current",
    upload: "Upload version",
    duration: "Duration",
    processing: "Processing…",
    ready: "Ready ✓"
  }
};

export function ReviewerFocusVersionStrip({
  locale,
  role,
  versions,
  activeVersion,
  durationSec,
  uploadUI,
  versionReadyState,
  fileRef,
  onSelectVersion,
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
  uploadUI: ReviewerVersionUploadUI;
  versionReadyState: Record<number, ReviewerVersionReadyState>;
  fileRef: RefObject<HTMLInputElement | null>;
  onSelectVersion: (version: number) => void;
  onFileInputChange: () => void;
  onUploadFile: (file: File) => void;
  onCancelUpload: () => void;
  onOpenPicker: () => void;
}) {
  const t = copy[locale];
  const sorted = [...versions].sort((a, b) => b.version - a.version);

  return (
    <section className="shrink-0 rounded-xl border border-zinc-200/90 bg-white p-3 shadow-sm">
      <div className="flex gap-3 overflow-x-auto pb-0.5">
        {sorted.map((item) => {
          const selected = item.version === activeVersion;
          const readyState = versionReadyState[item.version];
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectVersion(item.version)}
              className={cn(
                "min-w-[148px] shrink-0 rounded-xl border px-4 py-3 text-left transition",
                selected
                  ? "border-violet-500 bg-violet-50 ring-1 ring-violet-200"
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-sm font-semibold",
                    selected ? "text-violet-700" : "text-zinc-900"
                  )}
                >
                  V{item.version}
                </span>
                {readyState === "processing" ? (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200/80">
                    {t.processing}
                  </span>
                ) : readyState === "ready" ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200/80">
                    {t.ready}
                  </span>
                ) : selected ? (
                  <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-medium text-white">
                    {t.current}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                {item.created_at ? formatDate(item.created_at) : "—"}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                {t.duration} {formatTimestamp(durationSec)}
              </p>
            </button>
          );
        })}

        {role === "creator" ? (
          <ReviewerVersionUploadZone
            locale={locale}
            variant="compact"
            inputId="review-focus-version-upload"
            fileRef={fileRef}
            uploadUI={uploadUI}
            onFileInputChange={onFileInputChange}
            onUploadFile={onUploadFile}
            onCancelUpload={onCancelUpload}
            onOpenPicker={onOpenPicker}
          />
        ) : (
          <div className="flex min-w-[148px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-5 text-center text-zinc-400">
            <Plus className="h-5 w-5" />
            <span className="text-xs">{t.upload}</span>
          </div>
        )}
      </div>
    </section>
  );
}
