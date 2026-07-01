"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  publishBrandCampaignFormAction,
  saveBrandCampaignDraftAction,
  saveBrandCampaignSetupAction
} from "@/app/brand-campaign-actions";
import { BrandCampaignConfirmation } from "@/components/studioos/brand-campaign-confirmation";
import {
  BrandCampaignStepBrief,
  type BriefFormState
} from "@/components/studioos/brand-campaign-step-brief";
import { WizardStepper } from "@/components/studioos/ui/wizard-stepper";
import { Button } from "@/components/ui/button";
import {
  brandWizardStepMeta,
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

function PublishSubmitButton({ label, publishingLabel }: { label: string; publishingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? publishingLabel : label}
      {!pending ? <ArrowRight className="h-4 w-4" /> : null}
    </Button>
  );
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

  const isPending = isSaving;

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

  const maxWidth = step === 1 ? "max-w-6xl" : step === 3 ? "max-w-lg" : "max-w-3xl";

  return (
    <div className={cn("mx-auto w-full", maxWidth)}>
      <div className="mb-8">
        <WizardStepper locale={locale} currentStep={step} variant="brand" compact={step === 3} />
        <h1 className="mt-6 text-title text-foreground">{meta.headline[locale]}</h1>
        <p className="mt-2 text-body text-muted-foreground">{meta.subtitle[locale]}</p>
      </div>

      {step > 1 ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mb-6 gap-2 text-muted-foreground"
          onClick={() => goStep(step - 1)}
          disabled={isPending}
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
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <BrandCampaignConfirmation
            locale={locale}
            project={initialData.project}
            onConfirmed={() => {
              router.refresh();
              goStep(3);
            }}
          />
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-6">
          <p className="text-sm text-muted-foreground">
            {locale === "zh"
              ? "确认无误后发布并进入托管付款。付款完成后，系统才会向匹配的 Creator 发出意向发单。"
              : "Publish when ready, then complete escrow payment. Creator invitations go out only after payment is confirmed."}
          </p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <form action={publishBrandCampaignFormAction}>
            <input type="hidden" name="lang" value={locale} />
            <input type="hidden" name="project_id" value={projectId} />
            <PublishSubmitButton label={t.publish} publishingLabel={t.publishing} />
          </form>
        </section>
      ) : null}
    </div>
  );
}
