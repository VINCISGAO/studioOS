"use client";

import { useEffect, useState } from "react";
import { useAcknowledgeAlert } from "@/components/studioos/acknowledge-alert-provider";
import { WizardStepper } from "@/components/studioos/ui/wizard-stepper";
import { QuickBriefLayerOne } from "@/components/studioos/quick-brief/quick-brief-layer-one";
import { QuickBriefLayerOneFooter } from "@/components/studioos/quick-brief/quick-brief-layer-one-footer";
import { QuickBriefLayerTwo } from "@/components/studioos/quick-brief/quick-brief-layer-two";
import type { BriefFormState } from "@/components/studioos/brand-campaign-step-brief";
import type { StoredProjectReference } from "@/lib/campaign-types";
import type { Locale } from "@/lib/i18n";
import type { BrandBriefOptimizerResult } from "@/lib/studioos/brand-brief-optimizer.types";
import {
  deliveryTimelineFromScheduleDates,
  validateBriefScheduleDates
} from "@/lib/studioos/brand-creative-brief-form";
import { quickBriefCopy, QUICK_BUDGET_STOPS, type QuickBriefLayer } from "@/lib/studioos/quick-brief-copy";
import type { BrandDeliveryTimelineId, BrandVideoAspectRatio } from "@/lib/studioos/brand-campaign-options";
import type { BrandAssetSlotId } from "@/lib/studioos/brand-creative-brief-options";
import type { BrandBriefAssetPreviews } from "@/components/studioos/brand-creative-brief/use-brand-brief-asset-uploads";

export type QuickBriefFlowProps = {
  locale: Locale;
  form: BriefFormState;
  patch: <K extends keyof BriefFormState>(key: K, value: BriefFormState[K]) => void;
  summary: string;
  onSummaryChange: (value: string) => void;
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
  onPolish: (overrides?: {
    summary?: string;
    budgetRange?: string;
    deliveryTimeline?: BrandDeliveryTimelineId;
    inline?: boolean;
  }) => Promise<BrandBriefOptimizerResult | null>;
  onContinue: (state: BriefFormState) => void;
  onSaveDraft?: () => void;
  isPolishing: boolean;
  isPending: boolean;
  isRefPending: boolean;
  isReferenceVideoUploading: boolean;
  isReferenceImageUploading: boolean;
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
  referenceImageInputRef: React.RefObject<HTMLInputElement | null>;
  onReferenceVideoFileSelected: (file: File) => void;
  onReferenceImageFileSelected: (file: File) => void;
  previewUrl: string | null;
  onUploadClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onUploadFile: (file: File) => void;
  onUploadReferenceClick: () => void;
  onUploadReferenceImageClick: () => void;
  onRefreshReferences?: () => void;
  onUploadReferenceVideo: (file: File) => void;
  uploadError: string | null;
  polishNotice?: string | null;
  resolveBriefForContinue: (state: BriefFormState) => BriefFormState;
  copy: Record<string, string>;
  /** Skip in-flow budget layer — budget is collected on wizard step 3. */
  deferBudgetToLater?: boolean;
};

export function QuickBriefFlow(props: QuickBriefFlowProps) {
  const t = quickBriefCopy(props.locale);
  const { alert } = useAcknowledgeAlert();
  const [layer, setLayer] = useState<QuickBriefLayer>("quick");
  const [optimizer, setOptimizer] = useState<BrandBriefOptimizerResult | null>(
    props.form.refined?.optimizer ?? null
  );

  const isAnalyzing = props.isPolishing && layer === "ai-review";

  useEffect(() => {
    if (props.uploadError) alert(props.uploadError);
  }, [alert, props.uploadError]);

  useEffect(() => {
    const firstAssetError = Object.values(props.assetUploadErrors).find(Boolean);
    if (firstAssetError) alert(firstAssetError);
  }, [alert, props.assetUploadErrors]);

  useEffect(() => {
    if (props.form.refined?.optimizer) {
      setOptimizer(props.form.refined.optimizer);
    }
  }, [props.form.refined?.optimizer]);

  useEffect(() => {
    if (layer !== "quick") return;
    const timeline = deliveryTimelineFromScheduleDates(props.form.scheduleStart, props.form.scheduleDelivery);
    if (timeline !== props.form.deliveryTimeline) {
      props.patch("deliveryTimeline", timeline);
    }
  }, [layer, props.form.scheduleStart, props.form.scheduleDelivery, props.form.deliveryTimeline, props.patch]);

  function resolveDeliveryTimeline(): BrandDeliveryTimelineId {
    return deliveryTimelineFromScheduleDates(props.form.scheduleStart, props.form.scheduleDelivery);
  }

  function resolveBudgetRange(): string {
    return props.form.budgetRange || QUICK_BUDGET_STOPS[0]?.value || "$200 – $500";
  }

  function validateScheduleOrSetError(): boolean {
    const scheduleResult = validateBriefScheduleDates(
      props.form.scheduleStart,
      props.form.scheduleDelivery,
      props.locale
    );
    if (!scheduleResult.ok) {
      alert(scheduleResult.error);
      return false;
    }
    return true;
  }

  async function handleAiPolish(): Promise<void> {
    if (!props.summary.trim()) {
      alert(t.needPolish);
      return;
    }

    try {
      const result = await props.onPolish({
        summary: props.summary,
        budgetRange: resolveBudgetRange(),
        deliveryTimeline: resolveDeliveryTimeline(),
        inline: true
      });
      if (result) {
        setOptimizer(result);
      }
    } catch {
      alert(props.locale === "zh" ? "AI 润色失败，请重试" : "AI polish failed — try again");
    }
  }

  function shouldSkipAutoPolishOnNext(): boolean {
    if (!props.form.refined) return false;
    const summary = props.summary.trim();
    const polishedSnapshot = (props.form.rawSummary || props.form.productDescription || "").trim();
    return summary.length > 0 && summary === polishedSnapshot;
  }

  async function handleQuickNext() {
    if (!props.summary.trim()) {
      alert(t.needPromote);
      return;
    }
    if (!validateScheduleOrSetError()) {
      return;
    }
    const budgetRange = resolveBudgetRange();
    const deliveryTimeline = resolveDeliveryTimeline();
    props.patch("deliveryTimeline", deliveryTimeline);
    props.patch("rawSummary", props.summary);
    props.patch("productDescription", props.summary);

    if (!shouldSkipAutoPolishOnNext()) {
      const result = await props.onPolish({
        summary: props.summary,
        budgetRange,
        deliveryTimeline
      });
      if (result) {
        setOptimizer(result);
      }
    } else if (props.form.refined?.optimizer) {
      setOptimizer(props.form.refined.optimizer);
    }

    if (props.deferBudgetToLater) {
      props.patch("budgetRange", resolveBudgetRange());
      props.onContinue(
        props.resolveBriefForContinue({
          ...props.form,
          budgetRange: resolveBudgetRange(),
          deliveryTimeline,
          rawSummary: props.summary,
          productDescription: props.summary
        })
      );
      return;
    }
    setLayer("ai-review");
  }

  function handleConfirmContinue() {
    if (!validateScheduleOrSetError()) {
      return;
    }
    const budgetRange = resolveBudgetRange();
    const deliveryTimeline = resolveDeliveryTimeline();
    props.patch("budgetRange", budgetRange);
    props.patch("deliveryTimeline", deliveryTimeline);
    props.patch("rawSummary", props.summary);
    props.patch("productDescription", props.summary);
    props.onContinue(
      props.resolveBriefForContinue({
        ...props.form,
        budgetRange,
        deliveryTimeline,
        rawSummary: props.summary,
        productDescription: props.summary
      })
    );
  }

  return (
    <div className="min-h-0 w-full bg-[#f8f9fb] px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-5 lg:px-8 lg:pt-6">
      <div className="w-full">
        <WizardStepper
          locale={props.locale}
          currentStep={props.deferBudgetToLater ? 1 : layer === "quick" ? 1 : 2}
          variant="brand"
        />

        <div key={layer} className="w-full">
          {layer === "quick" ? (
          <>
          <QuickBriefLayerOne
            locale={props.locale}
            summary={props.summary}
            onSummaryChange={props.onSummaryChange}
            polishNotice={props.polishNotice}
            isPending={props.isPending}
            isPolishing={props.isPolishing}
            polishDisabled={shouldSkipAutoPolishOnNext()}
            onPolish={handleAiPolish}
            form={props.form}
            patch={props.patch}
            onAspectRatioSelect={props.onAspectRatioSelect}
            references={props.references}
            refUrl={props.refUrl}
            onRefUrlChange={props.setRefUrl}
            onAddRef={props.onAddRef}
            onRemoveRef={props.onRemoveRef}
            onUploadReferenceClick={props.onUploadReferenceClick}
            onUploadReferenceImageClick={props.onUploadReferenceImageClick}
            isReferenceVideoUploading={props.isReferenceVideoUploading}
            isReferenceImageUploading={props.isReferenceImageUploading}
            isRefPending={props.isRefPending}
            onRefreshReferences={props.onRefreshReferences}
            referenceVideoInputRef={props.referenceVideoInputRef}
            referenceImageInputRef={props.referenceImageInputRef}
            onReferenceVideoFileSelected={props.onReferenceVideoFileSelected}
            onReferenceImageFileSelected={props.onReferenceImageFileSelected}
          />
          <QuickBriefLayerOneFooter
            locale={props.locale}
            isPending={props.isPending}
            onSaveDraft={props.onSaveDraft}
            onNext={() => void handleQuickNext()}
          />
          </>
        ) : (
          <QuickBriefLayerTwo
            flow={props}
            isAnalyzing={isAnalyzing}
            optimizer={optimizer}
            optimizerSource={props.form.refined?.source}
            onBack={() => setLayer("quick")}
            onContinue={handleConfirmContinue}
          />
          )}
        </div>
      </div>
    </div>
  );
}
