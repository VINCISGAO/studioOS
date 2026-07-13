"use client";

import {
  saveBrandCampaignBudgetAndPublishAction,
  warmBrandCampaignCheckoutAction
} from "@/app/brand-campaign-actions";
import { useAcknowledgeAlert } from "@/components/studioos/acknowledge-alert-provider";
import { BrandCampaignStep2Footer } from "@/components/studioos/brand-campaign-step2-footer";
import { BrandCampaignStep3BudgetSidebar } from "@/components/studioos/brand-campaign-step3-budget-sidebar";
import type { BriefFormState } from "@/components/studioos/brand-campaign-step-brief";
import type { BrandBriefAssetPreviews } from "@/components/studioos/brand-creative-brief/use-brand-brief-asset-uploads";
import { QuickBriefProfessionalLayer } from "@/components/studioos/quick-brief/quick-brief-professional-layer";
import { WizardStepper } from "@/components/studioos/ui/wizard-stepper";
import type { Locale } from "@/lib/i18n";
import { BRAND_WIZARD_MAIN_SIDEBAR_GRID } from "@/lib/studioos/brand-campaign-step2-layout";
import {
  customBudgetInputFromStored,
  defaultBrandBudget,
  isPresetBudget,
  normalizeCustomBudgetInput
} from "@/lib/studioos/brand-campaign-options";
import { coerceErrorMessage, formatClientError } from "@/lib/studioos/format-client-error";
import type { StoredProject } from "@/lib/project-types";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const copy = {
  en: {
    title: "Set your budget",
    subtitle: "Choose a budget tier — we'll create the escrow invoice and take you to payment.",
    publish: "Confirm & pay",
    publishing: "Opening checkout…",
    freezing: "Confirming plan…",
    needBudget: "Select or enter a budget before continuing."
  },
  zh: {
    title: "确认你的预算",
    subtitle: "选择预算档位，确认后将生成托管账单并进入付款。",
    publish: "确认并付款",
    publishing: "正在前往付款…",
    freezing: "正在确认方案…",
    needBudget: "请先选择或填写预算。"
  }
} as const;

const EMPTY_ASSET_PREVIEWS: BrandBriefAssetPreviews = {
  logo: null,
  product_photos: null,
  reference_videos: null
};

export function BrandCampaignStep3Budget({
  locale,
  projectId,
  project,
  delivery,
  initial,
  error,
  freezePending = false,
  onBack
}: {
  locale: Locale;
  projectId: string;
  project: StoredProject;
  delivery: string;
  initial: BriefFormState;
  error?: string | null;
  freezePending?: boolean;
  onBack: () => void;
}) {
  const t = copy[locale];
  const router = useRouter();
  const { alert } = useAcknowledgeAlert();
  const [form, setForm] = useState(initial);
  const [budgetCustom, setBudgetCustom] = useState(() =>
    customBudgetInputFromStored(initial.budgetRange, locale)
  );
  const [localError, setLocalError] = useState<string | null>(error ? coerceErrorMessage(error) : null);
  const [isPublishing, setIsPublishing] = useState(false);

  function patch<K extends keyof BriefFormState>(key: K, value: BriefFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function selectPresetBudget(value: string) {
    setBudgetCustom("");
    patch("budgetRange", value);
  }

  function handleBudgetCustomChange(raw: string) {
    setBudgetCustom(raw);
    if (!raw.trim()) {
      patch("budgetRange", defaultBrandBudget());
      return;
    }
    const result = normalizeCustomBudgetInput(raw, locale);
    if (result.ok) {
      patch("budgetRange", result.value);
    }
  }

  function handleBudgetCustomBlur() {
    if (!budgetCustom.trim()) return;
    const result = normalizeCustomBudgetInput(budgetCustom, locale);
    if (!result.ok) {
      void alert(result.message);
      return;
    }
    patch("budgetRange", result.value);
  }

  const budgetIsCustom = Boolean(budgetCustom.trim()) || !isPresetBudget(form.budgetRange);
  const busy = isPublishing || freezePending;

  useEffect(() => {
    if (error) setLocalError(coerceErrorMessage(error));
  }, [error]);

  useEffect(() => {
    void warmBrandCampaignCheckoutAction(projectId, locale);
  }, [projectId, locale]);

  useEffect(() => {
    if (localError) alert(localError);
  }, [alert, localError]);

  async function handlePublish() {
    if (busy) return;

    let resolvedBudget = form.budgetRange?.trim() || "";
    if (budgetCustom.trim()) {
      const budgetResult = normalizeCustomBudgetInput(budgetCustom, locale);
      if (!budgetResult.ok) {
        void alert(budgetResult.message);
        return;
      }
      resolvedBudget = budgetResult.value;
      patch("budgetRange", budgetResult.value);
    }

    if (!resolvedBudget) {
      void alert(t.needBudget);
      return;
    }

    setIsPublishing(true);
    setLocalError(null);

    const formData = new FormData();
    formData.set("lang", locale);
    formData.set("project_id", projectId);
    formData.set("budget_range", resolvedBudget);
    if (budgetCustom.trim()) {
      formData.set("display_budget_input", budgetCustom.trim());
    }

    try {
      const result = await saveBrandCampaignBudgetAndPublishAction(formData);
      if (!result.ok) {
        setLocalError(
          coerceErrorMessage(
            result.error,
            locale === "zh" ? "发布失败，请重试" : "Publish failed — try again"
          )
        );
        setIsPublishing(false);
        return;
      }
      router.push(result.checkoutPath);
    } catch (caught) {
      setLocalError(
        formatClientError(
          caught,
          locale === "zh" ? "发布失败，请重试" : "Publish failed — try again"
        )
      );
      setIsPublishing(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-6 bg-[#f8f9fb] px-3 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-4 sm:pt-5 lg:px-5 lg:pt-6">
        <div className={BRAND_WIZARD_MAIN_SIDEBAR_GRID}>
          <WizardStepper locale={locale} currentStep={3} variant="brand" />
          <div className="hidden xl:block" aria-hidden />
        </div>

        <div className={BRAND_WIZARD_MAIN_SIDEBAR_GRID}>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-[26px]">
              {t.title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-500">{t.subtitle}</p>
          </div>
          <div className="hidden xl:block" aria-hidden />
        </div>

        <div className={BRAND_WIZARD_MAIN_SIDEBAR_GRID}>
          <div className="min-w-0">
            <QuickBriefProfessionalLayer
              locale={locale}
              form={form}
              patch={patch}
              budgetCustom={budgetCustom}
              budgetIsCustom={budgetIsCustom}
              onSelectPresetBudget={selectPresetBudget}
              onBudgetCustomChange={handleBudgetCustomChange}
              onBudgetCustomBlur={handleBudgetCustomBlur}
              onAspectRatioSelect={() => undefined}
              references={[]}
              refUrl=""
              setRefUrl={() => undefined}
              onAddRef={() => undefined}
              onRemoveRef={() => undefined}
              onPolish={() => undefined}
              isPolishing={false}
              isRefPending={false}
              isReferenceVideoUploading={false}
              isPending={busy}
              isUploading={false}
              productReady
              assetPreviews={EMPTY_ASSET_PREVIEWS}
              assetUploadErrors={{}}
              uploadingAssetSlot={null}
              referenceVideoUploadProgress={null}
              imageInputRef={{ current: null }}
              onAssetSlotClick={() => undefined}
              onImageFileSelected={() => undefined}
              referenceVideoInputRef={{ current: null }}
              onReferenceVideoFileSelected={() => undefined}
              previewUrl={null}
              onUploadClick={() => undefined}
              fileInputRef={{ current: null }}
              onUploadFile={() => undefined}
              onUploadReferenceVideoClick={() => undefined}
              onUploadReferenceVideo={() => undefined}
              uploadError={null}
              copy={{}}
              budgetOnly
            />
          </div>

          <BrandCampaignStep3BudgetSidebar
            locale={locale}
            project={project}
            delivery={delivery}
            budgetRange={form.budgetRange}
            budgetCustom={budgetCustom}
          />
        </div>
      </div>

      <BrandCampaignStep2Footer
        locale={locale}
        directionsReady
        selectedId="budget"
        isConfirming={busy}
        confirmLabel={t.publish}
        confirmingLabel={freezePending ? t.freezing : isPublishing ? t.publishing : undefined}
        onBack={onBack}
        onConfirm={() => void handlePublish()}
      />
    </div>
  );
}
