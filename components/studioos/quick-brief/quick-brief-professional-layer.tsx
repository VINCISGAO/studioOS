"use client";

import { BrandCreativeBriefSections } from "@/components/studioos/brand-creative-brief/brand-creative-brief-sections";
import type { BriefFormState } from "@/components/studioos/brand-campaign-step-brief";
import type { StoredProjectReference } from "@/lib/campaign-types";
import type { Locale } from "@/lib/i18n";
import type { BrandVideoAspectRatio } from "@/lib/studioos/brand-campaign-options";
import type { BrandAssetSlotId } from "@/lib/studioos/brand-creative-brief-options";
import type { BrandBriefAssetPreviews } from "@/components/studioos/brand-creative-brief/use-brand-brief-asset-uploads";
import { quickBriefCopy } from "@/lib/studioos/quick-brief-copy";

export function QuickBriefProfessionalLayer({
  locale,
  form,
  patch,
  budgetCustom,
  budgetIsCustom,
  onSelectPresetBudget,
  onBudgetCustomChange,
  onBudgetCustomBlur,
  onAspectRatioSelect,
  references,
  refUrl,
  setRefUrl,
  onAddRef,
  onRemoveRef,
  onPolish,
  isPolishing,
  isRefPending,
  isReferenceVideoUploading,
  isPending,
  isUploading,
  productReady,
  assetPreviews,
  assetUploadErrors,
  uploadingAssetSlot,
  referenceVideoUploadProgress,
  imageInputRef,
  onAssetSlotClick,
  onImageFileSelected,
  referenceVideoInputRef,
  onReferenceVideoFileSelected,
  previewUrl,
  onUploadClick,
  fileInputRef,
  onUploadFile,
  onUploadReferenceVideoClick,
  onUploadReferenceVideo,
  uploadError,
  copy,
  budgetOnly = false
}: {
  locale: Locale;
  form: BriefFormState;
  patch: <K extends keyof BriefFormState>(key: K, value: BriefFormState[K]) => void;
  budgetCustom: string;
  budgetIsCustom: boolean;
  onSelectPresetBudget: (value: string) => void;
  onBudgetCustomChange: (raw: string) => void;
  onBudgetCustomBlur: () => void;
  onAspectRatioSelect: (value: BrandVideoAspectRatio) => void;
  references: StoredProjectReference[];
  refUrl: string;
  setRefUrl: (value: string) => void;
  onAddRef: () => void;
  onRemoveRef: (id: string) => void;
  onPolish: () => void;
  isPolishing: boolean;
  isRefPending: boolean;
  isReferenceVideoUploading: boolean;
  isPending: boolean;
  isUploading: boolean;
  productReady: boolean;
  assetPreviews: BrandBriefAssetPreviews;
  assetUploadErrors: Partial<Record<BrandAssetSlotId, string>>;
  uploadingAssetSlot: BrandAssetSlotId | null;
  referenceVideoUploadProgress: number | null;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  onAssetSlotClick: (slot: BrandAssetSlotId) => void;
  onImageFileSelected: (file: File) => void;
  referenceVideoInputRef: React.RefObject<HTMLInputElement | null>;
  onReferenceVideoFileSelected: (file: File) => void;
  previewUrl: string | null;
  onUploadClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onUploadFile: (file: File) => void;
  onUploadReferenceVideoClick: () => void;
  onUploadReferenceVideo: (file: File) => void;
  uploadError: string | null;
  copy: Record<string, string>;
  budgetOnly?: boolean;
}) {
  const t = quickBriefCopy(locale);

  return (
    <section
      className={
        budgetOnly
          ? "w-full"
          : "w-full rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8"
      }
    >
      {budgetOnly ? null : (
        <div className="mb-4">
          <p className="text-sm font-semibold text-zinc-900">
            {locale === "zh" ? t.professionalBriefZh : t.professionalBrief}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{t.professionalExpand}</p>
        </div>
      )}
      <BrandCreativeBriefSections
        locale={locale}
        form={form}
        patch={patch}
        budgetCustom={budgetCustom}
        budgetIsCustom={budgetIsCustom}
        onSelectPresetBudget={onSelectPresetBudget}
        onBudgetCustomChange={onBudgetCustomChange}
        onBudgetCustomBlur={onBudgetCustomBlur}
        onAspectRatioSelect={onAspectRatioSelect}
        references={references}
        refUrl={refUrl}
        setRefUrl={setRefUrl}
        onAddRef={onAddRef}
        onRemoveRef={onRemoveRef}
        onPolish={onPolish}
        isPolishing={isPolishing}
        isRefPending={isRefPending}
        isReferenceVideoUploading={isReferenceVideoUploading}
        isPending={isPending}
        isUploading={isUploading}
        productReady={productReady}
        assetPreviews={assetPreviews}
        assetUploadErrors={assetUploadErrors}
        uploadingAssetSlot={uploadingAssetSlot}
        referenceVideoUploadProgress={referenceVideoUploadProgress}
        imageInputRef={imageInputRef}
        onAssetSlotClick={onAssetSlotClick}
        onImageFileSelected={onImageFileSelected}
        referenceVideoInputRef={referenceVideoInputRef}
        onReferenceVideoFileSelected={onReferenceVideoFileSelected}
        previewUrl={previewUrl}
        onUploadClick={onUploadClick}
        fileInputRef={fileInputRef}
        onUploadFile={onUploadFile}
        onReferenceVideoUploadClick={onUploadReferenceVideoClick}
        onUploadReferenceVideo={onUploadReferenceVideo}
        uploadError={uploadError}
        copy={copy}
        hideProduction
        hideBrandAssets
        hideCreativeDirection
        hideMoreDetails
        hideOptimizerPanel
        hideProjectOverview
        hideScheduleFields
        hideTimeline={budgetOnly}
        budgetOnly={budgetOnly}
        budgetSectionNumber={budgetOnly ? 2 : undefined}
      />
    </section>
  );
}
