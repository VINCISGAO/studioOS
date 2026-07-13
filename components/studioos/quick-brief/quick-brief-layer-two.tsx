"use client";

import { QuickBriefAiReview } from "@/components/studioos/quick-brief/quick-brief-ai-review";
import { QuickBriefProfessionalLayer } from "@/components/studioos/quick-brief/quick-brief-professional-layer";
import type { QuickBriefFlowProps } from "@/components/studioos/quick-brief/quick-brief-flow";
import type { BrandBriefOptimizerResult } from "@/lib/studioos/brand-brief-optimizer.types";
import { quickBriefCopy } from "@/lib/studioos/quick-brief-copy";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickBriefLayerTwo({
  flow,
  isAnalyzing,
  optimizer,
  optimizerSource,
  onBack,
  onContinue
}: {
  flow: QuickBriefFlowProps;
  isAnalyzing: boolean;
  optimizer: BrandBriefOptimizerResult | null;
  optimizerSource?: "openai" | "template";
  onBack: () => void;
  onContinue: () => void;
}) {
  const t = quickBriefCopy(flow.locale);
  void optimizer;
  void optimizerSource;

  return (
    <div className="w-full space-y-6">
      <QuickBriefAiReview
        locale={flow.locale}
        isAnalyzing={isAnalyzing}
        onBack={onBack}
        onContinue={onContinue}
        isPending={flow.isPending}
        showFooter={false}
      >
        <QuickBriefProfessionalLayer
          locale={flow.locale}
          form={flow.form}
          patch={flow.patch}
          budgetCustom={flow.budgetCustom}
          budgetIsCustom={flow.budgetIsCustom}
          onSelectPresetBudget={flow.onSelectPresetBudget}
          onBudgetCustomChange={flow.onBudgetCustomChange}
          onBudgetCustomBlur={flow.onBudgetCustomBlur}
          onAspectRatioSelect={flow.onAspectRatioSelect}
          references={flow.references}
          refUrl={flow.refUrl}
          setRefUrl={flow.setRefUrl}
          onAddRef={flow.onAddRef}
          onRemoveRef={flow.onRemoveRef}
          onPolish={() => void flow.onPolish()}
          isPolishing={flow.isPolishing}
          isRefPending={flow.isRefPending}
          isReferenceVideoUploading={flow.isReferenceVideoUploading}
          isPending={flow.isPending}
          isUploading={flow.isUploading}
          productReady={flow.productReady}
          assetPreviews={flow.assetPreviews}
          assetUploadErrors={flow.assetUploadErrors}
          uploadingAssetSlot={flow.uploadingAssetSlot}
          referenceVideoUploadProgress={flow.referenceVideoUploadProgress}
          imageInputRef={flow.imageInputRef}
          onAssetSlotClick={flow.onAssetSlotClick}
          onImageFileSelected={flow.onImageFileSelected}
          referenceVideoInputRef={flow.referenceVideoInputRef}
          onReferenceVideoFileSelected={flow.onReferenceVideoFileSelected}
          previewUrl={flow.previewUrl}
          onUploadClick={flow.onUploadClick}
          fileInputRef={flow.fileInputRef}
          onUploadFile={flow.onUploadFile}
          onUploadReferenceVideoClick={flow.onUploadReferenceClick}
          onUploadReferenceVideo={flow.onUploadReferenceVideo}
          uploadError={flow.uploadError}
          copy={flow.copy}
          budgetOnly
        />
      </QuickBriefAiReview>

      <div className="flex flex-col gap-3 pb-8 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="outline" className="rounded-xl" onClick={onBack} disabled={flow.isPending}>
          {t.back}
        </Button>
        <Button
          type="button"
          className="h-12 rounded-xl bg-violet-600 px-8 font-semibold hover:bg-violet-700"
          disabled={isAnalyzing || flow.isPending}
          onClick={onContinue}
        >
          {flow.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {flow.locale === "zh" ? "确认并继续" : "Confirm & continue"}
          {!flow.isPending ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
        </Button>
      </div>
    </div>
  );
}
