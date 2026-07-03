"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  saveBrandCampaignDraftAction,
  saveBrandCampaignSetupAction
} from "@/app/brand-campaign-actions";
import { BrandCampaignStep3Publish } from "@/components/studioos/brand-campaign-step3-publish";
import { BrandCampaignStep2Review } from "@/components/studioos/brand-campaign-step2-review";
import {
  BrandCampaignStepBrief,
  type BriefFormState
} from "@/components/studioos/brand-campaign-step-brief";
import { WizardStepper } from "@/components/studioos/ui/wizard-stepper";
import {
  brandWizardStepMeta,
  BRAND_WIZARD_VISIBLE_STEP_COUNT,
  clampBrandVisibleStep,
  migrateLegacyBrandWizardStep
} from "@/lib/campaign/wizard-steps";
import type {
  StoredCreativeBrief,
  StoredCreativePackItem,
  StoredProjectAsset,
  StoredProjectReference
} from "@/lib/campaign-types";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { StoredProject } from "@/lib/project-types";
import type { ReorganizedBrandBrief } from "@/lib/studioos/brand-brief-ai";
import { estimateBudgetRange, estimateDeliveryDays } from "@/lib/studioos/brand-campaign-display";
import {
  defaultBrandBudget,
  defaultBrandTimeline,
  defaultBrandAspectRatio,
  deliveryTimelineLabel,
  resolveAspectRatioFromProject,
  resolveDeliveryTimelineFromProject
} from "@/lib/studioos/brand-campaign-options";
import { cn } from "@/lib/utils";
import { Check, Sparkles } from "lucide-react";

type WizardData = {
  project: StoredProject;
  assets: StoredProjectAsset[];
  references: StoredProjectReference[];
  brief: StoredCreativeBrief | null;
  pack: StoredCreativePackItem[];
};

const copy = {
  en: {
    analyzedProduct: "Product analyzed",
    analyzedRef: "Reference analyzed",
    planReady: "Creative plan ready",
    budget: "Estimated Budget",
    delivery: "Delivery",
    continue: "Continue",
    back: "Back",
    matching: "Matching creators…",
    publish: "Publish and pay",
    publishing: "Publishing…"
  },
  zh: {
    analyzedProduct: "产品已分析",
    analyzedRef: "参考已分析",
    planReady: "创意方案就绪",
    budget: "预估预算",
    delivery: "交付时间",
    continue: "继续",
    back: "返回",
    matching: "正在匹配创作者…",
    publish: "发布并去付款",
    publishing: "正在发布…"
  }
} as const;

function readStoredQuestionnaire(project: StoredProject): Partial<BriefFormState> {
  const stored = project.settings_json?.brand_questionnaire as
    | {
        productName?: string;
        productUrl?: string;
        productDescription?: string;
        objective?: BriefFormState["objective"];
        audienceDescription?: string;
        platforms?: string[];
        extraNotes?: string;
        rawSummary?: string;
        budgetRange?: string;
        deliveryTimeline?: BriefFormState["deliveryTimeline"];
        aspectRatio?: BriefFormState["aspectRatio"];
        refined_brief?: ReorganizedBrandBrief;
      }
    | undefined;

  return {
    productName: stored?.productName ?? project.product_name ?? "",
    productUrl: stored?.productUrl ?? project.product_url ?? "",
    productDescription: stored?.productDescription ?? "",
    objective: stored?.objective ?? project.commercial_objective ?? "launch",
    audienceDescription: stored?.audienceDescription ?? project.target_audience ?? "",
    platforms:
      stored?.platforms ??
      (project.target_platform ? project.target_platform.split(",").map((item) => item.trim()).filter(Boolean) : []),
    extraNotes: stored?.extraNotes ?? project.commercial_objective_note ?? "",
    rawSummary: stored?.rawSummary ?? project.notes ?? "",
    budgetRange: stored?.budgetRange ?? project.budget_range ?? undefined,
    deliveryTimeline: stored?.deliveryTimeline ?? resolveDeliveryTimelineFromProject(project),
    aspectRatio: stored?.aspectRatio ?? resolveAspectRatioFromProject(project),
    refined: stored?.refined_brief ?? (project.campaign_goal
      ? {
          campaign_goal: project.campaign_goal,
          product_name: project.product_name,
          target_audience: project.target_audience,
          title: project.title,
          notes: project.notes,
          source: "template" as const
        }
      : null)
  };
}

function appendBriefForm(fd: FormData, state: BriefFormState) {
  fd.set("product_name", state.productName);
  fd.set("product_url", state.productUrl);
  fd.set("product_description", state.productDescription);
  fd.set("objective", state.objective);
  fd.set("audience_description", state.audienceDescription);
  fd.set("platforms", state.platforms.join(","));
  fd.set("extra_notes", state.extraNotes);
  fd.set("raw_summary", state.rawSummary);
  fd.set("budget_range", state.budgetRange);
  fd.set("delivery_timeline", state.deliveryTimeline);
  fd.set("aspect_ratio", state.aspectRatio);
  if (state.refined) {
    fd.set("campaign_goal", state.refined.campaign_goal);
    fd.set("target_audience", state.refined.target_audience);
    fd.set("title", state.refined.title);
    fd.set("notes", state.refined.notes);
  }
}

export function BrandCampaignWizard({
  locale,
  initialData,
  initialStep
}: {
  locale: Locale;
  initialData: WizardData;
  initialStep: number;
}) {
  const router = useRouter();
  const projectId = initialData.project.id;
  const migrated = initialStep <= BRAND_WIZARD_VISIBLE_STEP_COUNT ? initialStep : migrateLegacyBrandWizardStep(initialStep);
  const [step, setStep] = useState(clampBrandVisibleStep(migrated));
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const budget = estimateBudgetRange(initialData.project.budget_range);
  const deliveryTimelineId = resolveDeliveryTimelineFromProject(initialData.project);
  const delivery = estimateDeliveryDays(
    initialData.project.deadline,
    deliveryTimelineLabel(deliveryTimelineId, locale)
  );

  const briefInitial = useMemo(
    (): BriefFormState => ({
      productName: "",
      productUrl: "",
      productDescription: "",
      objective: "launch",
      audienceDescription: "",
      platforms: [],
      extraNotes: "",
      rawSummary: "",
      refined: null,
      budgetRange: defaultBrandBudget(),
      deliveryTimeline: defaultBrandTimeline(),
      aspectRatio: defaultBrandAspectRatio(),
      ...readStoredQuestionnaire(initialData.project)
    }),
    [initialData.project]
  );

  const meta = brandWizardStepMeta(locale, step);
  const productImageUrl = useMemo(() => {
    const asset = initialData.assets.find(
      (item) => item.type === "product_image_original" || item.type === "product_image"
    );
    return asset?.file_url ?? null;
  }, [initialData.assets]);

  function goStep(next: number) {
    const clamped = clampBrandVisibleStep(next);
    router.push(withLocale(`/brand/projects/new?project=${projectId}&step=${clamped}`, locale));
    setStep(clamped);
  }

  async function saveDraft(state: BriefFormState) {
    setIsSavingDraft(true);
    setError(null);

    const fd = new FormData();
    fd.set("lang", locale);
    fd.set("project_id", projectId);
    appendBriefForm(fd, state);

    try {
      const result = await saveBrandCampaignDraftAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(withLocale("/brand?draft=saved#my-ads", locale));
    } catch {
      setError(locale === "zh" ? "保存失败，请重试" : "Save failed — try again");
    } finally {
      setIsSavingDraft(false);
    }
  }

  async function saveSetup(state: BriefFormState) {
    setIsSaving(true);
    setError(null);

    const fd = new FormData();
    fd.set("lang", locale);
    fd.set("project_id", projectId);
    appendBriefForm(fd, state);

    try {
      const result = await saveBrandCampaignSetupAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      goStep(2);
    } catch {
      setError(locale === "zh" ? "保存失败，请重试" : "Save failed — try again");
    } finally {
      setIsSaving(false);
    }
  }

  const maxWidth = step === 1 || step === 2 ? "max-w-6xl" : "max-w-3xl";

  return (
    <div className={cn("mx-auto w-full", maxWidth)}>
      <div className="mb-8">
        <WizardStepper locale={locale} currentStep={step} variant="brand" />
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className={cn("max-w-2xl", step === 3 && "mx-auto text-center lg:mx-0 lg:text-left")}>
            <h1 className="flex items-center justify-center gap-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-[32px] lg:justify-start">
              {step === 2 ? <Sparkles className="h-7 w-7 text-violet-600" /> : null}
              {meta.headline[locale]}
              {step === 3 ? <Sparkles className="h-7 w-7 text-violet-600" /> : null}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-zinc-500">{meta.subtitle[locale]}</p>
          </div>
          {step === 1 ? (
            <div className="relative hidden h-36 w-44 shrink-0 lg:block" aria-hidden>
              <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-violet-100 via-indigo-50 to-white shadow-[0_20px_60px_rgba(99,102,241,0.18)]" />
              <div className="absolute left-5 top-6 h-24 w-16 rounded-2xl bg-white shadow-lg ring-1 ring-violet-100" />
              <div className="absolute left-8 top-9 h-14 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500" />
              <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-white shadow-md">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="absolute bottom-5 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-white shadow-md">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            </div>
          ) : step === 2 ? (
            <div className="relative hidden h-44 w-52 shrink-0 lg:block" aria-hidden>
              <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-violet-100 via-indigo-50 to-white shadow-[0_20px_60px_rgba(99,102,241,0.18)]" />
              <div className="absolute left-7 top-8 h-28 w-24 rotate-[-6deg] rounded-2xl bg-white shadow-lg ring-1 ring-violet-100" />
              <div className="absolute left-10 top-12 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-md">
                <Check className="h-8 w-8" />
              </div>
              <div className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white shadow-md">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="absolute bottom-7 right-8 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/90 text-white shadow-md">
                <span className="ml-0.5 text-xs font-bold">▶</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {step === 1 ? (
        <BrandCampaignStepBrief
          locale={locale}
          projectId={projectId}
          initial={briefInitial}
          initialProductImageUrl={productImageUrl}
          initialReferences={initialData.references}
          stepMode="all"
          hideTopBar
          isPending={isSaving}
          error={error}
          onProductUploaded={() => router.refresh()}
          onReferencesUpdated={() => router.refresh()}
          onContinue={saveSetup}
          onSaveDraft={saveDraft}
          isSavingDraft={isSavingDraft}
        />
      ) : null}

      {step === 2 ? (
        <BrandCampaignStep2Review
          locale={locale}
          project={initialData.project}
          budget={budget}
          delivery={delivery}
          error={error}
          onBack={() => goStep(1)}
          onConfirmed={() => {
            router.refresh();
            goStep(3);
          }}
        />
      ) : null}

      {step === 3 ? (
        <BrandCampaignStep3Publish
          locale={locale}
          projectId={projectId}
          error={error}
          onBack={() => goStep(2)}
        />
      ) : null}
    </div>
  );
}
