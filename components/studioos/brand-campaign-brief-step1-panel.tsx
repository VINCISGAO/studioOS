"use client";

import type { StoredProjectReference } from "@/lib/campaign-types";
import { BrandCreativeBriefSections } from "@/components/studioos/brand-creative-brief/brand-creative-brief-sections";
import { BrandCreativeBriefShell } from "@/components/studioos/brand-creative-brief/brand-creative-brief-shell";
import type { BriefFormState } from "@/components/studioos/brand-campaign-step-brief";
import type { Locale } from "@/lib/i18n";
import type { ReorganizedBrandBrief } from "@/lib/studioos/brand-brief-ai";
import type { BrandDeliveryTimelineId, BrandVideoAspectRatio } from "@/lib/studioos/brand-campaign-options";

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
  referenceVideoInputRef: React.RefObject<HTMLInputElement | null>;
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
        previewUrl={props.previewUrl}
        onUploadClick={props.onUploadClick}
        fileInputRef={props.fileInputRef}
        onUploadFile={props.onUploadFile}
        referenceVideoInputRef={props.referenceVideoInputRef}
        onReferenceVideoUploadClick={props.onReferenceVideoUploadClick}
        onUploadReferenceVideo={props.onUploadReferenceVideo}
        uploadError={props.uploadError}
        copy={props.copy}
      />
    </BrandCreativeBriefShell>
  );
}
