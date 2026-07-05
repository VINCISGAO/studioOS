"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  approveBrandCreativeDirectionAction,
  saveBrandCampaignDraftAction,
  saveBrandCampaignSetupAction
} from "@/app/brand-campaign-actions";
import { loadWizardDataAction } from "@/app/project-wizard-actions";
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
import { runInBackground, syncBrandWizardStepUrl } from "@/lib/studioos/instant-nav";
import {
  isWizardBriefReady,
  snapshotFromBriefForm,
  type WizardBriefSnapshot
} from "@/lib/studioos/brand-wizard-brief-snapshot";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

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
  const [wizardData, setWizardData] = useState(initialData);
  const migrated = initialStep <= BRAND_WIZARD_VISIBLE_STEP_COUNT ? initialStep : migrateLegacyBrandWizardStep(initialStep);
  const [step, setStep] = useState(clampBrandVisibleStep(migrated));
  const [error, setError] = useState<string | null>(null);
  const questionnaire = readStoredQuestionnaire(wizardData.project);
  const hasSavedBrief = Boolean(
    questionnaire.productName?.trim() ||
      questionnaire.rawSummary?.trim() ||
      questionnaire.productDescription?.trim() ||
      wizardData.project.campaign_goal?.trim()
  );
  const [step2Mounted, setStep2Mounted] = useState(initialStep >= 2 || hasSavedBrief);
  const [step3Mounted, setStep3Mounted] = useState(initialStep >= 3);
  const [canLoadDirections, setCanLoadDirections] = useState(initialStep >= 2 || hasSavedBrief);
  const directionsEnabled = step2Mounted && canLoadDirections;
  const [briefSnapshot, setBriefSnapshot] = useState<WizardBriefSnapshot | null>(() => {
    const initial = readStoredQuestionnaire(wizardData.project);
    const snap = snapshotFromBriefForm(initial);
    const hasProductAsset = initialData.assets.some(
      (item) => item.type === "product_image_original" || item.type === "product_image"
    );
    const hasProduct = hasProductAsset || Boolean(initial.productUrl?.trim());
    return isWizardBriefReady(snap, hasProduct) ? snap : null;
  });
  const prefetchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const scheduleBriefPrefetch = useCallback((form: BriefFormState, productReady: boolean) => {
    const snapshot = snapshotFromBriefForm(form);
    setBriefSnapshot(snapshot);
    if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current);
    prefetchTimerRef.current = setTimeout(() => {
      if (!isWizardBriefReady(snapshot, productReady)) return;
      setStep2Mounted(true);
      setCanLoadDirections(true);
    }, 600);
  }, []);

  useEffect(() => {
    return () => {
      if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current);
    };
  }, []);

  const applyProductImagePreview = useCallback((previewUrl: string) => {
    setWizardData((prev) => ({
      ...prev,
      assets: [
        ...prev.assets.filter(
          (item) => item.type !== "product_image_original" && item.type !== "product_image"
        ),
        {
          id: `product_preview_${Date.now()}`,
          project_id: projectId,
          type: "product_image_original",
          file_name: "product.jpg",
          file_url: previewUrl,
          mime_type: "image/jpeg",
          size_bytes: 0,
          created_at: new Date().toISOString()
        }
      ]
    }));
  }, [projectId]);

  const refreshWizardMedia = useCallback(() => {
    runInBackground(async () => {
      const data = await loadWizardDataAction(projectId);
      setWizardData((prev) => ({
        ...prev,
        assets: data.assets,
        references: data.references
      }));
    }, "refresh-wizard-media");
  }, [projectId]);

  useEffect(() => {
    if (initialData.assets.length && initialData.references.length) return;
    refreshWizardMedia();
  }, [initialData.assets.length, initialData.references.length, refreshWizardMedia]);

  const budget = estimateBudgetRange(wizardData.project.budget_range);
  const deliveryTimelineId = resolveDeliveryTimelineFromProject(wizardData.project);
  const delivery = estimateDeliveryDays(
    wizardData.project.deadline,
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
      ...readStoredQuestionnaire(wizardData.project)
    }),
    [wizardData.project]
  );

  const meta = brandWizardStepMeta(locale, step);
  const productImageUrl = useMemo(() => {
    const asset = wizardData.assets.find(
      (item) => item.type === "product_image_original" || item.type === "product_image"
    );
    return asset?.file_url ?? null;
  }, [wizardData.assets]);

  function goStep(next: number) {
    const clamped = clampBrandVisibleStep(next);
    setStep(clamped);
    syncBrandWizardStepUrl(projectId, clamped, locale);
  }

  async function saveDraft(state: BriefFormState) {
    setError(null);

    const fd = new FormData();
    fd.set("lang", locale);
    fd.set("project_id", projectId);
    appendBriefForm(fd, state);

    router.push(withLocale("/brand?draft=saved#my-ads", locale));

    runInBackground(async () => {
      const result = await saveBrandCampaignDraftAction(fd);
      if (!result.ok) {
        setError(result.error);
      }
    }, "save-draft");
  }

  async function saveSetup(state: BriefFormState) {
    setError(null);

    const snapshot = snapshotFromBriefForm(state);
    setBriefSnapshot(snapshot);
    setStep2Mounted(true);
    setCanLoadDirections(true);
    goStep(2);

    const fd = new FormData();
    fd.set("lang", locale);
    fd.set("project_id", projectId);
    appendBriefForm(fd, state);

    runInBackground(async () => {
      const result = await saveBrandCampaignSetupAction(fd);
      if (!result.ok) {
        setError(result.error);
      }
    }, "save-setup");
  }

  function confirmDirection(directionId: string) {
    setError(null);
    setStep3Mounted(true);
    goStep(3);

    const fd = new FormData();
    fd.set("lang", locale);
    fd.set("project_id", projectId);
    fd.set("direction_id", directionId);

    runInBackground(async () => {
      const result = await approveBrandCreativeDirectionAction(fd);
      if (!result.ok) {
        setError(result.error);
      }
    }, "approve-direction");
  }

  const maxWidth = step === 1 ? "max-w-6xl" : step === 2 ? "max-w-none" : "max-w-3xl";
  const step2FullBleed = step === 2 ? "min-h-[calc(100dvh-3.5rem)] w-full" : "";

  return (
    <div className={cn("mx-auto w-full", maxWidth, step2FullBleed)}>
      {step !== 2 ? (
      <div className="mb-8">
        <WizardStepper locale={locale} currentStep={step} variant="brand" />
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className={cn("max-w-2xl", step === 3 && "mx-auto text-center lg:mx-0 lg:text-left")}>
            <h1 className="flex items-center justify-center gap-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-[32px] lg:justify-start">
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
          ) : null}
        </div>
      </div>
      ) : null}

      {step === 1 ? (
        <BrandCampaignStepBrief
          locale={locale}
          projectId={projectId}
          initial={briefInitial}
          initialProductImageUrl={productImageUrl}
          initialReferences={wizardData.references}
          stepMode="all"
          hideTopBar
          isPending={false}
          error={error}
          onProductUploaded={(previewUrl) => {
            applyProductImagePreview(previewUrl);
          }}
          onBriefChange={scheduleBriefPrefetch}
          onReferencesUpdated={refreshWizardMedia}
          onContinue={saveSetup}
          onSaveDraft={saveDraft}
          isSavingDraft={false}
        />
      ) : null}

      {/* Mount early when draft exists so AI can load while user edits step 1 */}
      {step2Mounted ? (
        <div className={cn(step !== 2 && "hidden")} aria-hidden={step !== 2}>
          <BrandCampaignStep2Review
            locale={locale}
            project={wizardData.project}
            budget={budget}
            delivery={delivery}
            productImageUrl={productImageUrl}
            error={error}
            directionsEnabled={directionsEnabled}
            briefSnapshot={briefSnapshot}
            awaitingBriefSave={false}
            onBack={() => goStep(1)}
            onSaveDraft={() => saveDraft(briefInitial)}
            onConfirmed={confirmDirection}
          />
        </div>
      ) : null}

      {step3Mounted ? (
        <div className={cn(step !== 3 && "hidden")} aria-hidden={step !== 3}>
          <BrandCampaignStep3Publish
            locale={locale}
            projectId={projectId}
            error={error}
            onBack={() => goStep(2)}
          />
        </div>
      ) : null}
    </div>
  );
}
