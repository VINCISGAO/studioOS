import Link from "next/link";
import { ArrowLeft, Calendar, CircleDollarSign, Clapperboard, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import {
  brandCommercialPhaseLabel,
  type BrandCommercialContext,
  type BrandCommercialStep
} from "@/lib/studioos/commercial-lifecycle";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import {
  localizeBrandCategoryLabel,
  localizeBrandProjectTitle
} from "@/lib/studioos/brand-locale-display";
import type { StoredProject } from "@/lib/project-types";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    back: "Back to my projects",
    budget: "Budget",
    deadline: "Delivery date",
    category: "Project type",
    stage: "Current stage",
    daysLeft: (n: number) => `${n} day${n === 1 ? "" : "s"} left`
  },
  zh: {
    back: "返回我的项目",
    budget: "预算",
    deadline: "交付日期",
    category: "项目类型",
    stage: "当前阶段",
    daysLeft: (n: number) => `剩余 ${n} 天`
  }
};

function daysUntilDeadline(deadline: string): number | null {
  const parsed = Date.parse(deadline);
  if (Number.isNaN(parsed)) return null;
  return Math.max(0, Math.ceil((parsed - Date.now()) / 86400000));
}

function formatDeadlineDisplay(deadline: string): string {
  const iso = deadline.split("T")[0] ?? deadline;
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : deadline;
}

function HeaderStat({
  icon: Icon,
  label,
  value,
  sublabel
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
  sublabel?: string | null;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-zinc-100 bg-zinc-50/50 px-4 py-3">
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <Icon className="h-3.5 w-3.5 shrink-0 text-violet-500" />
        <span>{label}</span>
      </div>
      <p className="mt-1.5 truncate text-sm font-semibold text-zinc-950">{value}</p>
      {sublabel ? <p className="mt-0.5 text-xs text-zinc-400">{sublabel}</p> : null}
    </div>
  );
}

export function BrandProjectOverviewHeader({
  locale,
  project,
  brandCommercialStep,
  commercialContext
}: {
  locale: Locale;
  project: StoredProject;
  brandCommercialStep: BrandCommercialStep;
  commercialContext: BrandCommercialContext;
}) {
  const t = copy[locale];
  const displayTitle = localizeBrandProjectTitle(project.title, locale);
  const categoryDisplay = project.category ? localizeBrandCategoryLabel(project.category, locale) : null;
  const daysLeft = project.deadline ? daysUntilDeadline(project.deadline) : null;
  const stageLabel = brandCommercialPhaseLabel(brandCommercialStep, locale, commercialContext);
  const isProduction = ["production", "in_review", "delivered", "completed"].includes(project.status);

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <Link
          href={withLocale(brandPortalRoutes.dashboard, locale)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Link>

        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <Badge
              className={cn(
                "rounded-full border-0 px-2.5 py-0.5 text-xs font-medium",
                isProduction ? "bg-violet-100 text-violet-700" : "bg-violet-50 text-violet-600"
              )}
            >
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-violet-500" />
              {stageLabel}
            </Badge>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-[1.75rem]">
              {displayTitle}
            </h1>
            {project.campaign_goal ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">{project.campaign_goal}</p>
            ) : null}

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {project.budget_range ? (
                <HeaderStat icon={CircleDollarSign} label={t.budget} value={project.budget_range.replace(/\s*总预算.*$/i, "").trim()} />
              ) : null}
              {project.deadline ? (
                <HeaderStat
                  icon={Calendar}
                  label={t.deadline}
                  value={formatDeadlineDisplay(project.deadline)}
                  sublabel={daysLeft !== null ? t.daysLeft(daysLeft) : null}
                />
              ) : null}
              {categoryDisplay ? (
                <HeaderStat
                  icon={Layers}
                  label={t.category}
                  value={categoryDisplay.value}
                  sublabel={categoryDisplay.sublabel}
                />
              ) : null}
              <HeaderStat icon={Clapperboard} label={t.stage} value={stageLabel} />
            </div>
          </div>

          <div className="hidden shrink-0 lg:flex lg:h-28 lg:w-28 xl:h-32 xl:w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-100 to-violet-50">
            <Clapperboard className="h-14 w-14 text-violet-500 xl:h-16 xl:w-16" strokeWidth={1.25} />
          </div>
        </div>
      </div>
    </section>
  );
}
