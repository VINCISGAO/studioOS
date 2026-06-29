"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  prepareBrandCampaignAction,
  publishBrandCampaignAction,
  saveBrandCampaignBriefAction,
  saveBrandCampaignProductAction,
  saveBrandCampaignReferencesAction
} from "@/app/brand-campaign-actions";
import { BrandCampaignConfirmation } from "@/components/studioos/brand-campaign-confirmation";
import { BrandCreatorMatchRadar } from "@/components/studioos/brand-creator-match-radar";
import {
  BrandCampaignStepBrief,
  type BriefFormState
} from "@/components/studioos/brand-campaign-step-brief";
import { WizardProgressPanel } from "@/components/studioos/ui/wizard-progress-panel";
import { WizardStepper } from "@/components/studioos/ui/wizard-stepper";
import { Button } from "@/components/ui/button";
import { useWizardProgress } from "@/hooks/use-wizard-progress";
import {
  clampWizardStep,
  migrateLegacyBrandWizardStep,
  wizardStepMeta
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
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

type WizardData = {
  project: StoredProject;
  assets: StoredProjectAsset[];
  references: StoredProjectReference[];
  brief: StoredCreativeBrief | null;
  pack: StoredCreativePackItem[];
};

const copy = {
  en: {
    packTitle: "Your creative pack is ready",
    analyzedProduct: "Product analyzed",
    analyzedRef: "Reference analyzed",
    planReady: "Creative plan ready",
    budget: "Estimated Budget",
    delivery: "Delivery",
    continue: "Continue",
    back: "Back",
    matching: "Matching creators…",
    matchFailed: "Matching failed — try again"
  },
  zh: {
    packTitle: "创意方案已就绪",
    analyzedProduct: "产品已分析",
    analyzedRef: "参考已分析",
    planReady: "创意方案就绪",
    budget: "预估预算",
    delivery: "交付时间",
    continue: "继续",
    back: "返回",
    matching: "正在匹配创作者…",
    matchFailed: "匹配失败，请重试"
  }
};

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
  const t = copy[locale];
  const router = useRouter();
  const projectId = initialData.project.id;
  const migrated = migrateLegacyBrandWizardStep(initialStep);
  const [step, setStep] = useState(clampWizardStep(migrated));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [prepared, setPrepared] = useState(initialData.project.wizard_completed_steps.includes(5));
  const [isMatching, setIsMatching] = useState(step === 7);
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const matchStartedRef = useRef(false);

  const { draft: progressDraft } = useWizardProgress(projectId, step === 4 || step === 7);

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

  const meta = wizardStepMeta(locale, step);
  const productImageUrl = useMemo(() => {
    const asset = initialData.assets.find(
      (item) => item.type === "product_image_original" || item.type === "product_image"
    );
    return asset?.file_url ?? null;
  }, [initialData.assets]);

  function goStep(next: number) {
    const clamped = clampWizardStep(next);
    router.push(withLocale(`/brand/projects/new?project=${projectId}&step=${clamped}`, locale));
    setStep(clamped);
  }

  function runPrepare() {
    setAnalysisStarted(true);
    startTransition(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("project_id", projectId);
      const result = await prepareBrandCampaignAction(fd);
      if (!result.ok) {
        setError(result.error);
        setAnalysisStarted(false);
        return;
      }
      setPrepared(true);
      setAnalysisStarted(false);
      router.refresh();
    });
  }

  useEffect(() => {
    if (step !== 4 || prepared || analysisStarted) return;
    runPrepare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, prepared]);

  useEffect(() => {
    if (step !== 7 || matchStartedRef.current) return;
    matchStartedRef.current = true;
    setIsMatching(true);
    setError(null);
    runPublish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function runPublish() {
    startTransition(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("project_id", projectId);
      const result = await publishBrandCampaignAction(fd);
      if (result && !result.ok) {
        setIsMatching(false);
        matchStartedRef.current = false;
        setError(result.error);
      }
    });
  }

  function saveBrief(state: BriefFormState) {
    startTransition(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("project_id", projectId);
      appendBriefForm(fd, state);
      const result = await saveBrandCampaignBriefAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      goStep(2);
    });
  }

  function saveProduct(state: BriefFormState) {
    startTransition(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("project_id", projectId);
      fd.set("product_name", state.productName);
      fd.set("product_url", state.productUrl);
      const result = await saveBrandCampaignProductAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      goStep(3);
    });
  }

  function saveReferences(state: BriefFormState) {
    startTransition(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("project_id", projectId);
      appendBriefForm(fd, state);
      const result = await saveBrandCampaignReferencesAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      goStep(4);
    });
  }

  const maxWidth =
    step === 1 ? "max-w-6xl" : step === 7 ? "max-w-lg" : step === 4 && !prepared ? "max-w-2xl" : "max-w-3xl";

  return (
    <div className={cn("mx-auto w-full", maxWidth)}>
      <div className="mb-8">
        <WizardStepper locale={locale} currentStep={step} compact={step === 7} />
        <h1 className="mt-6 text-title text-foreground">{meta.headline[locale]}</h1>
        <p className="mt-2 text-body text-muted-foreground">{meta.subtitle[locale]}</p>
      </div>

      {step > 1 && step !== 4 ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mb-6 gap-2 text-muted-foreground"
          onClick={() => goStep(step - 1)}
          disabled={isPending || (step === 7 && isMatching)}
        >
          <ArrowLeft className="h-4 w-4" /> {t.back}
        </Button>
      ) : null}

      {step === 1 ? (
        <BrandCampaignStepBrief
          locale={locale}
          projectId={projectId}
          initial={briefInitial}
          stepMode="brief"
          hideTopBar
          isPending={isPending}
          error={error}
          onContinue={saveBrief}
        />
      ) : null}

      {step === 2 ? (
        <BrandCampaignStepBrief
          locale={locale}
          projectId={projectId}
          initial={briefInitial}
          initialProductImageUrl={productImageUrl}
          stepMode="product"
          hideTopBar
          isPending={isPending}
          error={error}
          onProductUploaded={() => router.refresh()}
          onContinue={saveProduct}
        />
      ) : null}

      {step === 3 ? (
        <BrandCampaignStepBrief
          locale={locale}
          projectId={projectId}
          initial={briefInitial}
          initialReferences={initialData.references}
          stepMode="references"
          hideTopBar
          isPending={isPending}
          error={error}
          onReferencesUpdated={() => router.refresh()}
          onContinue={saveReferences}
        />
      ) : null}

      {step === 4 ? (
        <section className="space-y-6">
          <WizardProgressPanel
            locale={locale}
            draft={progressDraft}
            fallbackMessage={locale === "zh" ? "正在分析…" : "Analyzing your inputs…"}
          />
          {prepared ? (
            <>
              <ul className="space-y-3 rounded-card border bg-card p-6">
                {[t.analyzedProduct, t.analyzedRef, t.planReady].map((label) => (
                  <li key={label} className="flex items-center gap-3 text-sm font-medium">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-success">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="button" size="lg" className="w-full" disabled={isPending} onClick={() => goStep(5)}>
                {t.continue} <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          ) : null}
        </section>
      ) : null}

      {step === 5 ? (
        <section className="space-y-8">
          <ul className="space-y-3 rounded-card border bg-card p-6">
            {[t.analyzedProduct, t.analyzedRef, t.planReady].map((label) => (
              <li key={label} className="flex items-center gap-3 text-sm font-medium">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-success">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {label}
              </li>
            ))}
          </ul>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-card border bg-card p-5">
              <p className="text-label text-muted-foreground">{t.budget}</p>
              <p className="mt-2 text-2xl font-semibold">{budget}</p>
            </div>
            <div className="rounded-card border bg-card p-5">
              <p className="text-label text-muted-foreground">{t.delivery}</p>
              <p className="mt-2 text-2xl font-semibold">{delivery}</p>
            </div>
          </div>
          <Button type="button" size="lg" className="w-full" onClick={() => goStep(6)}>
            {t.continue} <ArrowRight className="h-4 w-4" />
          </Button>
        </section>
      ) : null}

      {step === 6 ? (
        <BrandCampaignConfirmation
          locale={locale}
          project={initialData.project}
          onConfirmed={() => {
            matchStartedRef.current = false;
            router.refresh();
            goStep(7);
          }}
        />
      ) : null}

      {step === 7 ? (
        <section className="space-y-6">
          <WizardProgressPanel locale={locale} draft={progressDraft} fallbackMessage={t.matching} />
          {isMatching && !error ? (
            <BrandCreatorMatchRadar locale={locale} />
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {locale === "zh" ? "匹配未完成，请点击继续重试。" : "Matching did not complete — tap continue to retry."}
              </p>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button
                type="button"
                size="lg"
                className="w-full"
                disabled={isPending}
                onClick={() => {
                  matchStartedRef.current = false;
                  setIsMatching(true);
                  runPublish();
                }}
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t.continue}
                {!isPending ? <ArrowRight className="h-4 w-4" /> : null}
              </Button>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
