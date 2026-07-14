"use client";

import type { StoredProjectReference } from "@/lib/campaign-types";
import { QuickBriefDescriptionInput } from "@/components/studioos/quick-brief/quick-brief-description-input";
import { QuickBriefSidePanel } from "@/components/studioos/quick-brief/quick-brief-side-panel";
import { ReferenceIntakePanel } from "@/components/studioos/reference-intake/reference-intake-panel";
import type { BriefFormState } from "@/components/studioos/brand-campaign-step-brief";
import type { Locale } from "@/lib/i18n";
import { quickBriefCopy } from "@/lib/studioos/quick-brief-copy";
import { QUICK_BRIEF_FOOTER_SCROLL_PADDING } from "@/lib/studioos/portal-layout-tokens";
import type { BrandVideoAspectRatio } from "@/lib/studioos/brand-campaign-options";
import { cn } from "@/lib/utils";

export function QuickBriefLayerOne({
  locale,
  summary,
  onSummaryChange,
  polishNotice,
  isPending,
  isPolishing,
  polishDisabled,
  onPolish,
  form,
  patch,
  onAspectRatioSelect,
  references,
  refUrl,
  onRefUrlChange,
  onAddRef,
  onRemoveRef,
  onUploadReferenceClick,
  onUploadReferenceImageClick,
  isReferenceVideoUploading,
  isReferenceImageUploading,
  isRefPending,
  onRefreshReferences,
  referenceVideoInputRef,
  referenceImageInputRef,
  onReferenceVideoFileSelected,
  onReferenceImageFileSelected
}: {
  locale: Locale;
  summary: string;
  onSummaryChange: (value: string) => void;
  polishNotice?: string | null;
  isPending: boolean;
  isPolishing?: boolean;
  /** When true, manual polish is disabled — brief already polished for current text. */
  polishDisabled?: boolean;
  onPolish?: () => void | Promise<void>;
  form: BriefFormState;
  patch: <K extends keyof BriefFormState>(key: K, value: BriefFormState[K]) => void;
  onAspectRatioSelect: (value: BrandVideoAspectRatio) => void;
  references: StoredProjectReference[];
  refUrl: string;
  onRefUrlChange: (value: string) => void;
  onAddRef: () => void;
  onRemoveRef: (id: string) => void;
  onUploadReferenceClick: () => void;
  onUploadReferenceImageClick: () => void;
  isReferenceVideoUploading: boolean;
  isReferenceImageUploading: boolean;
  isRefPending: boolean;
  onRefreshReferences?: () => void;
  referenceVideoInputRef: React.RefObject<HTMLInputElement | null>;
  referenceImageInputRef: React.RefObject<HTMLInputElement | null>;
  onReferenceVideoFileSelected: (file: File) => void;
  onReferenceImageFileSelected: (file: File) => void;
}) {
  const t = quickBriefCopy(locale);

  return (
    <div className={cn("w-full space-y-4 px-0 sm:space-y-5", QUICK_BRIEF_FOOTER_SCROLL_PADDING)}>
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">{t.layer1Title}</h1>
        <p className="text-sm leading-6 text-zinc-500">{t.layer1Subtitle}</p>
      </header>

      <div className="space-y-4">
        <div className="flex flex-row items-stretch gap-5 max-sm:flex-col max-sm:gap-4">
          <div className="min-w-0 basis-0 flex-[58] max-sm:flex-none">
            <QuickBriefDescriptionInput
              locale={locale}
              value={summary}
              onChange={onSummaryChange}
              disabled={isPending || Boolean(isPolishing)}
              polishNotice={polishNotice}
              polishDisabled={polishDisabled}
              onPolish={onPolish}
              isPolishing={isPolishing}
            />
          </div>

          <div className="min-w-0 basis-0 flex-[42] max-sm:flex-none">
            <QuickBriefSidePanel
              locale={locale}
              form={form}
              patch={patch}
              onAspectRatioSelect={onAspectRatioSelect}
              isPending={isPending}
            />
          </div>
        </div>

        <ReferenceIntakePanel
          locale={locale}
          references={references}
          refUrl={refUrl}
          onRefUrlChange={onRefUrlChange}
          onAddRef={onAddRef}
          onRemoveRef={onRemoveRef}
          onUploadVideoClick={onUploadReferenceClick}
          onUploadImageClick={onUploadReferenceImageClick}
          isVideoUploading={isReferenceVideoUploading}
          isImageUploading={isReferenceImageUploading}
          isRefPending={isRefPending}
          onRefreshReferences={onRefreshReferences}
          videoInputRef={referenceVideoInputRef}
          imageInputRef={referenceImageInputRef}
          onVideoFileSelected={onReferenceVideoFileSelected}
          onImageFileSelected={onReferenceImageFileSelected}
          sectionNumber={2}
        />

      </div>
    </div>
  );
}
