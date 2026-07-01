"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { confirmBrandCampaignAction } from "@/app/brand-campaign-actions";
import { BrandCampaignStep2FormPanel } from "@/components/studioos/brand-campaign-step2-form-panel";
import { BrandCampaignStep2PlanPanel } from "@/components/studioos/brand-campaign-step2-plan-panel";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { buildConfirmedBriefSnapshot } from "@/lib/studioos/confirmed-brief";
import {
  deliveryTimelineLabel,
  resolveAspectRatioFromProject,
  resolveDeliveryTimelineFromProject
} from "@/lib/studioos/brand-campaign-options";
import type { StoredProject } from "@/lib/project-types";
import { ArrowRight, CheckCircle2, Loader2, Pencil } from "lucide-react";

const copy = {
  en: { edit: "Back to edit", confirm: "Confirm and continue" },
  zh: { edit: "返回修改", confirm: "确认并继续" }
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
  const [certified, setCertified] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const snapshot = useMemo(() => buildConfirmedBriefSnapshot(project, locale), [project, locale]);
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
  const projectTitle = project.title || project.product_name || project.company_name;

  function handleConfirm() {
    if (!certified) {
      setLocalError(locale === "zh" ? "请先勾选确认项" : "Please check the certification box");
      return;
    }

    startTransition(async () => {
      setLocalError(null);
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("project_id", project.id);
      fd.set("confirmed", "1");
      const result = await confirmBrandCampaignAction(fd);
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

      <BrandCampaignStep2FormPanel
        locale={locale}
        projectTitle={projectTitle}
        fields={snapshot.fields}
        certified={certified}
        onCertifiedChange={(value) => {
          setCertified(value);
          if (value) setLocalError(null);
        }}
      />

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
            disabled={isPending || !certified}
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
