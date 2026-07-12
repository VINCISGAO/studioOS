"use client";

import type { StoredProjectReference } from "@/lib/campaign-types";
import { BrandCreativeBriefSections } from "@/components/studioos/brand-creative-brief/brand-creative-brief-sections";
import { BrandCreativeBriefShell } from "@/components/studioos/brand-creative-brief/brand-creative-brief-shell";
import type { BriefFormState } from "@/components/studioos/brand-campaign-step-brief";
import type { Locale } from "@/lib/i18n";
import type { ReorganizedBrandBrief } from "@/lib/studioos/brand-brief-ai";
import type { BrandDeliveryTimelineId, BrandVideoAspectRatio } from "@/lib/studioos/brand-campaign-options";

import type { BrandAssetSlotId } from "@/lib/studioos/brand-creative-brief-options";
import type { BrandBriefAssetPreviews } from "@/components/studioos/brand-creative-brief/use-brand-brief-asset-uploads";

export type BrandCampaignBriefStep1PanelProps = {
  locale: Locale;
  copy: Record<string, string>;
  form: BriefFormState;
  patch: <K extends keyof BriefFormState>(key: K, value: BriefFormState[K]) => void;
  budgetCustom: string;
  budgetCustomError: string | null;
  budgetIsCustom: boolean;
  aspectRatioError: string | null;
  displayError: string | null;
  refinedApplied: boolean;
  applyNotice: string | null;
  isPolishing: boolean;
  isPending: boolean;
  isSavingDraft: boolean;
  isUploading: boolean;
  isRefPending: boolean;
  isReferenceVideoUploading: boolean;
  continueDisabled: boolean;
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
  uploadError: string | null;
  references: StoredProjectReference[];
  refUrl: string;
  setRefUrl: (value: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onPolish: () => void;
  onApplyRefined: () => void;
  onUploadClick: () => void;
  onUploadFile: (file: File) => void;
  onReferenceVideoUploadClick: () => void;
  onUploadReferenceVideo: (file: File) => void;
  onAddRef: () => void;
  onRemoveRef: (id: string) => void;
  onSelectPresetBudget: (value: string) => void;
  onBudgetCustomChange: (raw: string) => void;
  onBudgetCustomBlur: () => void;
  onAspectRatioSelect: (value: BrandVideoAspectRatio) => void;
  onContinue: () => void;
  onSaveDraft?: () => void;
  updateRefined: (patchValue: Partial<ReorganizedBrandBrief>) => void;
};

export function BrandCampaignBriefStep1Panel(props: BrandCampaignBriefStep1PanelProps) {
  void props.onApplyRefined;
  void props.updateRefined;
  void props.refinedApplied;
  void props.applyNotice;
  void props.aspectRatioError;
  void props.budgetCustomError;

  return (
    <BrandCreativeBriefShell
      locale={props.locale}
      displayError={props.displayError}
      onSaveDraft={props.onSaveDraft}
      onContinue={props.onContinue}
      isSavingDraft={props.isSavingDraft}
      isPending={props.isPending}
      continueDisabled={props.continueDisabled}
    >
      <BrandCreativeBriefSections
        locale={props.locale}
        form={props.form}
        patch={props.patch}
        budgetCustom={props.budgetCustom}
        budgetIsCustom={props.budgetIsCustom}
        onSelectPresetBudget={props.onSelectPresetBudget}
        onBudgetCustomChange={props.onBudgetCustomChange}
        onBudgetCustomBlur={props.onBudgetCustomBlur}
        onAspectRatioSelect={props.onAspectRatioSelect}
        references={props.references}
        refUrl={props.refUrl}
        setRefUrl={props.setRefUrl}
        onAddRef={props.onAddRef}
        onRemoveRef={props.onRemoveRef}
        onPolish={props.onPolish}
        isPolishing={props.isPolishing}
        isRefPending={props.isRefPending}
        isReferenceVideoUploading={props.isReferenceVideoUploading}
        isPending={props.isPending}
        isUploading={props.isUploading}
        productReady={props.productReady}
        assetPreviews={props.assetPreviews}
        assetUploadErrors={props.assetUploadErrors}
        uploadingAssetSlot={props.uploadingAssetSlot}
        referenceVideoUploadProgress={props.referenceVideoUploadProgress}
        imageInputRef={props.imageInputRef}
        onAssetSlotClick={props.onAssetSlotClick}
        onImageFileSelected={props.onImageFileSelected}
        referenceVideoInputRef={props.referenceVideoInputRef}
        onReferenceVideoFileSelected={props.onReferenceVideoFileSelected}
        previewUrl={props.previewUrl}
        onUploadClick={props.onUploadClick}
        fileInputRef={props.fileInputRef}
        onUploadFile={props.onUploadFile}
        onReferenceVideoUploadClick={props.onReferenceVideoUploadClick}
        onUploadReferenceVideo={props.onUploadReferenceVideo}
        uploadError={props.uploadError}
        copy={props.copy}
      />
    </BrandCreativeBriefShell>
  );
}
