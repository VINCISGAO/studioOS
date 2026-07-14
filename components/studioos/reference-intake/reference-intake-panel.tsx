"use client";

import { useEffect, useRef } from "react";
import type { StoredProjectReference } from "@/lib/campaign-types";
import { ReferenceAnalysisCard } from "@/components/studioos/reference-intake/reference-analysis-card";
import { QuickBriefSectionCard, QuickBriefSectionHeader } from "@/components/studioos/quick-brief/quick-brief-section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n";
import { quickBriefCopy } from "@/lib/studioos/quick-brief-copy";
import { FileImage, FileUp, Info, Link2, Loader2 } from "lucide-react";

export function ReferenceIntakePanel({
  locale,
  references,
  refUrl,
  onRefUrlChange,
  onAddRef,
  onRemoveRef,
  onUploadVideoClick,
  onUploadImageClick,
  isVideoUploading,
  isImageUploading,
  isRefPending,
  onRefreshReferences,
  videoInputRef,
  imageInputRef,
  onVideoFileSelected,
  onImageFileSelected,
  sectionNumber = 2
}: {
  locale: Locale;
  references: StoredProjectReference[];
  refUrl: string;
  onRefUrlChange: (value: string) => void;
  onAddRef: () => void;
  onRemoveRef: (id: string) => void;
  onUploadVideoClick: () => void;
  onUploadImageClick: () => void;
  isVideoUploading: boolean;
  isImageUploading: boolean;
  isRefPending: boolean;
  onRefreshReferences?: () => void;
  videoInputRef: React.RefObject<HTMLInputElement | null>;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  onVideoFileSelected: (file: File) => void;
  onImageFileSelected: (file: File) => void;
  sectionNumber?: number;
}) {
  const t = quickBriefCopy(locale);
  const zh = locale === "zh";
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const needsPoll = references.some(
      (item) => item.analysis?.status === "pending" || item.analysis?.status === "analyzing"
    );
    if (!needsPoll || !onRefreshReferences) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    pollingRef.current = setInterval(() => {
      onRefreshReferences();
    }, 2000);
    onRefreshReferences();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [references, onRefreshReferences]);

  return (
    <QuickBriefSectionCard>
      <QuickBriefSectionHeader
        number={sectionNumber}
        title={t.referenceTitle}
        optional={t.referenceOptional}
      />
      <p className="mb-4 text-xs leading-5 text-zinc-500">{t.referenceIntakeLead}</p>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4">
          <p className="text-xs font-semibold text-zinc-900">{t.referenceLinkTitle}</p>
          <p className="text-[11px] leading-5 text-zinc-500">{t.referenceLinkHint}</p>
          <div className="flex gap-2">
            <Input
              value={refUrl}
              onChange={(event) => onRefUrlChange(event.target.value)}
              placeholder="https://"
              className="h-10 rounded-xl"
            />
            <Button type="button" variant="outline" className="h-10 shrink-0 rounded-xl px-3" onClick={onAddRef} disabled={isRefPending}>
              <Link2 className="mr-1 h-4 w-4" />
              {zh ? "添加" : "Add"}
            </Button>
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-violet-200 bg-violet-50/40 p-4">
          <p className="text-xs font-semibold text-violet-900">{t.referenceVideoTitle}</p>
          <p className="text-[11px] leading-5 text-violet-700/80">{t.referenceVideoHint}</p>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full rounded-xl border-violet-200 bg-white"
            onClick={onUploadVideoClick}
            disabled={isVideoUploading}
          >
            {isVideoUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
            {t.referenceCta}
          </Button>
        </div>

        <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4">
          <p className="text-xs font-semibold text-zinc-900">{t.referenceImageTitle}</p>
          <p className="text-[11px] leading-5 text-zinc-500">{t.referenceImageHint}</p>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full rounded-xl"
            onClick={onUploadImageClick}
            disabled={isImageUploading}
          >
            {isImageUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileImage className="mr-2 h-4 w-4" />}
            {zh ? "上传截图 / 关键帧" : "Upload screenshot / keyframe"}
          </Button>
        </div>
      </div>

      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onVideoFileSelected(file);
          event.target.value = "";
        }}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onImageFileSelected(file);
          event.target.value = "";
        }}
      />

      {references.length ? (
        <div className="mt-4 space-y-3">
          {references.slice(0, 6).map((item) => (
            <div key={item.id} className="space-y-2">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-white px-3 py-2 text-xs text-zinc-600">
                <span className="truncate">{item.source_url}</span>
                <button type="button" className="shrink-0 text-zinc-400 hover:text-red-600" onClick={() => onRemoveRef(item.id)}>
                  ×
                </button>
              </div>
              <ReferenceAnalysisCard locale={locale} reference={item} variant="brand" />
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-violet-200/90 bg-gradient-to-r from-violet-50 via-white to-amber-50/70 px-4 py-3.5 shadow-sm">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
          <Info className="h-4 w-4" />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold tracking-tight text-violet-950">
            {zh ? "链接打不开的常见情况" : "When a link may not work"}
          </p>
          <p className="text-xs leading-6 text-violet-900/85">{t.referenceIntakeDisclaimer}</p>
        </div>
      </div>
    </QuickBriefSectionCard>
  );
}
