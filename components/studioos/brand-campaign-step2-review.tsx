"use client";

import { useEffect, useState, useTransition } from "react";
import {
  approveBrandCreativeDirectionAction,
  generateBrandCreativeDirectionsAction
} from "@/app/brand-campaign-actions";
import {
  BrandCampaignStep2CompactScheme,
  BrandCampaignStep2FeaturedScheme
} from "@/components/studioos/brand-campaign-step2-scheme-cards";
import { BrandCampaignStep2SchemeSidebar } from "@/components/studioos/brand-campaign-step2-scheme-sidebar";
import { BrandCampaignStep2Footer } from "@/components/studioos/brand-campaign-step2-footer";
import { WizardStepper } from "@/components/studioos/ui/wizard-stepper";
import type { CreativeDirection } from "@/features/ai/creative-direction.types";
import type { StoredProject } from "@/lib/project-types";
import { buildSchemeDisplayMetrics } from "@/lib/studioos/brand-campaign-scheme-metrics";
import type { Locale } from "@/lib/i18n";
import {
  Brain,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  Zap
} from "lucide-react";

const copy = {
  en: {
    generated: "schemes generated",
    headline: "AI generated 3 high-conversion creative schemes for you",
    subtitle:
      "Each scheme is tailored to your brief, product strengths, and audience — pick one to freeze into your Production Brief.",
    tagInsight: "Deep product insight",
    tagAudience: "Audience psychology",
    tagPlatform: "Platform algorithm fit",
    tagPerformance: "Performance forecast",
    generating: "Generating creative schemes…",
    chooseError: "Choose one creative direction"
  },
  zh: {
    generated: "套方案已生成",
    headline: "AI 已为你生成 3 套高转化创意方案",
    subtitle: "每套方案均基于你的需求、产品卖点与目标受众定制 — 选择一套后将冻结为 Production Brief。",
    tagInsight: "深度洞察产品卖点",
    tagAudience: "匹配受众心理",
    tagPlatform: "平台算法偏好",
    tagPerformance: "预测投放效果",
    generating: "AI 正在生成创意方案…",
    chooseError: "请先选择一个创意方向"
  }
} as const;

function parseBudgetFallback(budget: string) {
  const match = budget.replace(/,/g, "").match(/\d+/);
  return match ? Number(match[0]) : 300;
}

export function BrandCampaignStep2Review({
  locale,
  project,
  budget,
  productImageUrl,
  error,
  onBack,
  onSaveDraft,
  isSavingDraft,
  onConfirmed
}: {
  locale: Locale;
  project: StoredProject;
  budget: string;
  productImageUrl?: string | null;
  delivery: string;
  error?: string | null;
  onBack: () => void;
  onSaveDraft?: () => void;
  isSavingDraft?: boolean;
  onConfirmed: () => void;
}) {
  const t = copy[locale];
  const [localError, setLocalError] = useState<string | null>(null);
  const [directions, setDirections] = useState<CreativeDirection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingDirections, setLoadingDirections] = useState(true);
  const [isPending, startTransition] = useTransition();

  const platforms =
    project.target_platform?.split(",").map((item) => item.trim()).filter(Boolean) ??
    ((project.settings_json?.brand_questionnaire as { platforms?: string[] } | undefined)?.platforms ?? [
      "TikTok",
      "Instagram",
      "YouTube"
    ]);

  const fallbackBudget = parseBudgetFallback(budget);
  const displayError = localError || error;
  const schemeCount = directions.length || 3;

  useEffect(() => {
    let cancelled = false;
    setLoadingDirections(true);
    setLocalError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("project_id", project.id);
      const result = await generateBrandCreativeDirectionsAction(fd);
      if (cancelled) return;
      if (!result.ok) {
        setLocalError(result.error);
        setLoadingDirections(false);
        return;
      }
      setDirections(result.directions);
      setSelectedId(result.directions[0]?.id ?? null);
      setLoadingDirections(false);
    });
    return () => {
      cancelled = true;
    };
  }, [locale, project.id, startTransition]);

  function handleConfirm() {
    if (!selectedId) {
      setLocalError(t.chooseError);
      return;
    }

    startTransition(async () => {
      setLocalError(null);
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("project_id", project.id);
      fd.set("direction_id", selectedId);
      const result = await approveBrandCreativeDirectionAction(fd);
      if (!result.ok) {
        setLocalError(result.error);
        return;
      }
      onConfirmed();
    });
  }

  const featureTags = [
    { icon: Brain, label: t.tagInsight },
    { icon: Target, label: t.tagAudience },
    { icon: Zap, label: t.tagPlatform },
    { icon: TrendingUp, label: t.tagPerformance }
  ];

  const featured = directions[0];
  const compact = directions.slice(1);

  return (
    <div className="pb-28">
      <div className="mb-6 space-y-4">
        <WizardStepper locale={locale} currentStep={2} variant="brand" />
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
          <span>
            {locale === "zh" ? "已生成" : ""} {schemeCount} {t.generated}
          </span>
          <span>{locale === "zh" ? "67% 完成" : "67% complete"}</span>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <h1 className="flex items-start gap-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-[28px]">
            <Sparkles className="mt-1 h-7 w-7 shrink-0 text-violet-600" />
            {t.headline}
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500 sm:text-base">{t.subtitle}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {featureTags.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50/80 px-3 py-1.5 text-xs font-medium text-violet-700"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="relative hidden h-36 w-44 shrink-0 lg:block" aria-hidden>
          <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-violet-100 via-indigo-50 to-white shadow-[0_20px_60px_rgba(99,102,241,0.18)]" />
          <div className="absolute left-7 top-8 h-24 w-20 rotate-[-6deg] rounded-2xl bg-white shadow-lg ring-1 ring-violet-100" />
          <div className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white shadow-md">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="absolute bottom-6 right-7 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-white shadow-md">
            <span className="ml-0.5 text-xs font-bold">▶</span>
          </div>
        </div>
      </div>

      {loadingDirections ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white py-20 text-sm text-zinc-600">
          <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
          {t.generating}
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            {featured ? (
              <BrandCampaignStep2FeaturedScheme
                locale={locale}
                direction={featured}
                metrics={buildSchemeDisplayMetrics(featured, 0, locale, fallbackBudget)}
                selected={selectedId === featured.id}
                productImageUrl={productImageUrl ?? null}
                platforms={platforms}
                onSelect={() => {
                  setSelectedId(featured.id);
                  setLocalError(null);
                }}
              />
            ) : null}

            {compact.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {compact.map((direction, index) => (
                  <BrandCampaignStep2CompactScheme
                    key={direction.id}
                    locale={locale}
                    direction={direction}
                    metrics={buildSchemeDisplayMetrics(direction, index + 1, locale, fallbackBudget)}
                    selected={selectedId === direction.id}
                    productImageUrl={productImageUrl ?? null}
                    onSelect={() => {
                      setSelectedId(direction.id);
                      setLocalError(null);
                    }}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <BrandCampaignStep2SchemeSidebar
            locale={locale}
            directions={directions}
            selectedId={selectedId}
            platforms={platforms}
            fallbackBudget={fallbackBudget}
          />
        </div>
      )}

      {displayError ? <p className="mt-4 text-sm text-red-600">{displayError}</p> : null}

      <BrandCampaignStep2Footer
        locale={locale}
        isPending={isPending}
        loadingDirections={loadingDirections}
        selectedId={selectedId}
        isSavingDraft={isSavingDraft}
        onBack={onBack}
        onSaveDraft={onSaveDraft}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
