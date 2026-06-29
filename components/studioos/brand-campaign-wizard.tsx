"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  prepareBrandCampaignAction,
  publishBrandCampaignAction,
  saveBrandCampaignStep1Action
} from "@/app/brand-campaign-actions";
import { BrandCampaignConfirmation } from "@/components/studioos/brand-campaign-confirmation";
import { BrandCreatorMatchRadar } from "@/components/studioos/brand-creator-match-radar";
import {
  BrandCampaignStepBrief,
  type BriefFormState
} from "@/components/studioos/brand-campaign-step-brief";
import { Button } from "@/components/ui/button";
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
    step2Title: "We've prepared your project.",
    analyzedProduct: "Product analyzed",
    analyzedRef: "Reference analyzed",
    planReady: "Creative plan ready",
    budget: "Estimated Budget",
    delivery: "Delivery",
    continue: "Continue",
    back: "Back",
    preparing: "Analyzing your inputs…",
    matching: "Matching creators…",
    matchFailed: "Matching failed — try again"
  },
  zh: {
    step2Title: "项目已为你准备好。",
    analyzedProduct: "产品已分析",
    analyzedRef: "参考已分析",
    planReady: "创意方案就绪",
    budget: "预估预算",
    delivery: "交付时间",
    continue: "继续",
    back: "返回",
    preparing: "正在分析…",
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
  const [step, setStep] = useState(Math.min(4, Math.max(1, initialStep)));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [prepared, setPrepared] = useState(initialData.project.wizard_completed_steps.includes(5));
  const [isMatching, setIsMatching] = useState(initialStep === 4);
  const matchStartedRef = useRef(false);

  const projectId = initialData.project.id;
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
    [initialData.project, locale]
  );

  useEffect(() => {
    if (initialStep >= 2 && initialData.project.wizard_completed_steps.includes(2) && !prepared) {
      runPrepare();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runPrepare() {
    startTransition(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("project_id", projectId);
      const result = await prepareBrandCampaignAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPrepared(true);
      setStep(2);
      router.refresh();
    });
  }

  function goStep(next: number) {
    router.push(withLocale(`/brand/projects/new?project=${projectId}&step=${next}`, locale));
    setStep(next);
  }

  function handleStep1(state: BriefFormState) {
    startTransition(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("project_id", projectId);
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
      const result = await saveBrandCampaignStep1Action(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      goStep(2);
      runPrepare();
    });
  }

  const productImageUrl = useMemo(() => {
    const asset = initialData.assets.find(
      (item) => item.type === "product_image_original" || item.type === "product_image"
    );
    return asset?.file_url ?? null;
  }, [initialData.assets]);

  function handleProductUploaded() {
    router.refresh();
  }

  function runPublish() {
    startTransition(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("project_id", projectId);
      const result = await publishBrandCampaignAction(fd);
      if (result && !result.ok) {
        setIsMatching(false);
        setError(result.error);
      }
    });
  }

  useEffect(() => {
    if (step !== 4 || matchStartedRef.current) return;
    matchStartedRef.current = true;
    setIsMatching(true);
    setError(null);

    const timer = window.setTimeout(() => {
      runPublish();
    }, 3000);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <div
      className={cn(
        "mx-auto w-full",
        step === 1 ? "max-w-6xl" : step === 4 ? "max-w-lg" : "max-w-3xl"
      )}
    >
      {step > 1 ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mb-6 gap-2 text-zinc-500"
          onClick={() => goStep(step - 1)}
          disabled={isPending || step === 2 || (step === 4 && isMatching)}
        >
          <ArrowLeft className="h-4 w-4" /> {t.back}
        </Button>
      ) : null}

      {step === 1 ? (
        <BrandCampaignStepBrief
          locale={locale}
          projectId={projectId}
          initial={briefInitial}
          initialProductImageUrl={productImageUrl}
          initialReferences={initialData.references}
          isPending={isPending}
          error={error}
          onProductUploaded={handleProductUploaded}
          onReferencesUpdated={() => router.refresh()}
          onContinue={handleStep1}
        />
      ) : null}

      {step === 2 ? (
        <section className="space-y-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              {locale === "zh" ? "第 2 步 / 共 4 步" : "Step 2 / 4"}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{t.step2Title}</h1>
          </div>
          {isPending && !prepared ? (
            <div className="flex items-center gap-3 rounded-xl border bg-white p-6 text-sm text-zinc-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t.preparing}
            </div>
          ) : (
            <>
              <ul className="space-y-3 rounded-2xl border bg-white p-6">
                {[t.analyzedProduct, t.analyzedRef, t.planReady].map((label) => (
                  <li key={label} className="flex items-center gap-3 text-sm font-medium">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border bg-white p-5">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">{t.budget}</p>
                  <p className="mt-2 text-2xl font-semibold">{budget}</p>
                </div>
                <div className="rounded-xl border bg-white p-5">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">{t.delivery}</p>
                  <p className="mt-2 text-2xl font-semibold">{delivery}</p>
                </div>
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button
                type="button"
                className="h-12 w-full rounded-full"
                disabled={isPending || !prepared}
                onClick={() => {
                  router.refresh();
                  setStep(3);
                  goStep(3);
                }}
              >
                {t.continue} <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </section>
      ) : null}

      {step === 3 ? (
        <BrandCampaignConfirmation
          locale={locale}
          project={initialData.project}
          onConfirmed={() => {
            matchStartedRef.current = false;
            router.refresh();
            setStep(4);
            goStep(4);
          }}
        />
      ) : null}

      {step === 4 ? (
        <section className="space-y-6">
          {isMatching && !error ? (
            <BrandCreatorMatchRadar locale={locale} />
          ) : (
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  {locale === "zh" ? "第 4 步 / 共 4 步" : "Step 4 / 4"}
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                  {locale === "zh" ? "推荐 Studio" : "Recommended Studios"}
                </h1>
              </div>
              <p className="text-sm text-zinc-500">
                {locale === "zh"
                  ? "匹配未完成，请点击继续重试。"
                  : "Matching did not complete — tap continue to retry."}
              </p>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button
                type="button"
                className="h-12 w-full rounded-full"
                disabled={isPending}
                onClick={() => {
                  matchStartedRef.current = false;
                  setIsMatching(true);
                  setError(null);
                  window.setTimeout(() => runPublish(), 3000);
                }}
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t.continue}
                {!isPending ? <ArrowRight className="h-4 w-4" /> : null}
              </Button>
            </>
          )}
          {isMatching && isPending ? (
            <p className="text-center text-xs text-zinc-400">{t.matching}</p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
