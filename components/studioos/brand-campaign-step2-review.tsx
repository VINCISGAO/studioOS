"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  approveBrandCreativeDirectionAction,
  generateBrandCreativeDirectionsAction
} from "@/app/brand-campaign-actions";
import { BrandCampaignStep2PlanPanel } from "@/components/studioos/brand-campaign-step2-plan-panel";
import { Button } from "@/components/ui/button";
import type { CreativeDirection } from "@/features/ai/creative-direction.types";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import {
  deliveryTimelineLabel,
  resolveAspectRatioFromProject,
  resolveDeliveryTimelineFromProject
} from "@/lib/studioos/brand-campaign-options";
import type { StoredProject } from "@/lib/project-types";
import { ArrowRight, CheckCircle2, Loader2, Pencil, Sparkles } from "lucide-react";

const copy = {
  en: {
    edit: "Back to edit",
    confirm: "Choose and freeze Production Brief",
    generating: "AI is generating creative directions...",
    chooseTitle: "Choose one creative direction",
    chooseBody: "StudioOS will freeze the selected direction into the Production Brief. Matching will use this brief, not the draft.",
    selected: "Selected",
    choose: "Choose",
    hook: "Hook",
    story: "Story",
    tone: "Tone",
    shotList: "Shot list",
    cta: "CTA"
  },
  zh: {
    edit: "返回修改",
    confirm: "选择并冻结 Production Brief",
    generating: "AI 正在生成创意方向...",
    chooseTitle: "选择一个创意方向",
    chooseBody: "StudioOS 会把你选择的方向冻结成 Production Brief。后续匹配只读取这份 Brief，不读取草稿。",
    selected: "已选择",
    choose: "选择",
    hook: "Hook",
    story: "Story",
    tone: "Tone",
    shotList: "Shot List",
    cta: "CTA"
  }
} as const;

export function BrandCampaignStep2Review({
  locale,
  project,
  budget,
  delivery,
  error,
  onBack,
  onConfirmed
}: {
  locale: Locale;
  project: StoredProject;
  budget: string;
  delivery: string;
  error?: string | null;
  onBack: () => void;
  onConfirmed: () => void;
}) {
  const t = copy[locale];
  const [localError, setLocalError] = useState<string | null>(null);
  const [directions, setDirections] = useState<CreativeDirection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingDirections, setLoadingDirections] = useState(true);
  const [isPending, startTransition] = useTransition();

  const timelineId = resolveDeliveryTimelineFromProject(project);
  const deliveryLabel = deliveryTimelineLabel(timelineId, locale) || delivery;
  const aspectRatio = resolveAspectRatioFromProject(project);
  const platforms =
    project.target_platform ||
    ((project.settings_json?.brand_questionnaire as { platforms?: string[] } | undefined)?.platforms?.join(
      ", "
    ) ??
      "TikTok, Meta");

  const displayError = localError || error;

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
      setLocalError(locale === "zh" ? "请先选择一个创意方向" : "Choose one creative direction");
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

  return (
    <div className="space-y-8 pb-28">
      <BrandCampaignStep2PlanPanel
        locale={locale}
        projectId={project.id}
        budget={budget}
        deliveryLabel={deliveryLabel}
        aspectRatio={aspectRatio}
        platforms={platforms}
        disabled={isPending}
        onBack={onBack}
      />

      <section className="rounded-[28px] border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
              <Sparkles className="h-3.5 w-3.5" />
              CREATIVE_OPTIONS
            </p>
            <h2 className="mt-3 text-xl font-semibold text-zinc-950">{t.chooseTitle}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{t.chooseBody}</p>
          </div>
          {loadingDirections ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-sm text-zinc-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t.generating}
            </span>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {directions.map((direction, index) => {
            const selected = selectedId === direction.id;
            return (
              <button
                key={direction.id}
                type="button"
                onClick={() => {
                  setSelectedId(direction.id);
                  setLocalError(null);
                }}
                className={[
                  "rounded-2xl border p-4 text-left transition",
                  selected
                    ? "border-violet-500 bg-violet-50 shadow-[0_16px_40px_rgba(124,58,237,0.14)]"
                    : "border-zinc-200 bg-white hover:border-violet-200 hover:bg-violet-50/40"
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                    Direction {String.fromCharCode(65 + index)}
                  </p>
                  <span className={selected ? "text-xs font-semibold text-violet-700" : "text-xs text-zinc-400"}>
                    {selected ? t.selected : t.choose}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-zinc-950">{direction.title}</h3>
                <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-600">
                  <p><span className="font-semibold text-zinc-900">{t.hook}:</span> {direction.hook}</p>
                  <p><span className="font-semibold text-zinc-900">{t.story}:</span> {direction.story}</p>
                  <p><span className="font-semibold text-zinc-900">{t.tone}:</span> {direction.tone}</p>
                  <div>
                    <p className="font-semibold text-zinc-900">{t.shotList}</p>
                    <ol className="mt-1 list-decimal space-y-1 pl-5">
                      {direction.shotList.map((shot) => (
                        <li key={shot}>{shot}</li>
                      ))}
                    </ol>
                  </div>
                  <p><span className="font-semibold text-zinc-900">{t.cta}:</span> {direction.cta}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {displayError ? <p className="text-sm text-red-600">{displayError}</p> : null}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Button asChild variant="outline" className="h-11 rounded-xl border-zinc-200 bg-white">
            <Link href={withLocale(`/brand/projects/new?project=${project.id}&step=1`, locale)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t.edit}
            </Link>
          </Button>
          <Button
            type="button"
            className="h-11 rounded-xl bg-violet-600 px-8 hover:bg-violet-700 disabled:opacity-50"
            disabled={isPending || loadingDirections || !selectedId}
            onClick={handleConfirm}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            {t.confirm}
            {!isPending ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
          </Button>
        </div>
      </div>
    </div>
  );
}
