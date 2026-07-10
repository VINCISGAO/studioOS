import Link from "next/link";
import { ArrowLeft, Calendar, CircleDollarSign, Clapperboard, Pencil, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import {
  creatorUserPhaseLabel,
  mapCreatorStepToPhase,
  userCommercialPhaseIndex,
  type CreatorCommercialContext,
  type CreatorCommercialStep
} from "@/lib/studioos/commercial-lifecycle";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import type { StoredOrder } from "@/lib/order-types";
import type { StoredProject } from "@/lib/project-types";

const copy = {
  en: {
    back: "Back to my projects",
    official: "Official project",
    projectId: "Project ID",
    created: "Created",
    brand: "Brand",
    budget: "Budget",
    deadline: "Delivery date",
    duration: "Duration",
    currentStage: "Current stage",
    uploadVersion: "Upload new version",
    reviewCenter: "Go to review center"
  },
  zh: {
    back: "返回我的项目",
    official: "正式项目",
    projectId: "项目编号",
    created: "创建于",
    brand: "品牌方",
    budget: "预算",
    deadline: "交付日期",
    duration: "项目时长",
    currentStage: "当前阶段",
    uploadVersion: "上传新版本",
    reviewCenter: "前往审片中心"
  }
};

function formatDate(raw?: string | null) {
  if (!raw) return "—";
  const iso = raw.split("T")[0] ?? raw;
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : raw;
}

function progressPercent(step: CreatorCommercialStep, context: CreatorCommercialContext) {
  const phase = mapCreatorStepToPhase(step, context);
  const index = userCommercialPhaseIndex(phase);
  return Math.min(100, Math.round(((index + 1) / 4) * 100));
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

export function CreatorProjectOverviewHeader({
  locale,
  order,
  project,
  creatorCommercialStep,
  commercialContext,
  canUpload
}: {
  locale: Locale;
  order: StoredOrder;
  project: StoredProject | null;
  creatorCommercialStep: CreatorCommercialStep;
  commercialContext: CreatorCommercialContext;
  canUpload: boolean;
}) {
  const t = copy[locale];
  const title = project?.title || order.title || "Campaign";
  const stageLabel = creatorUserPhaseLabel(mapCreatorStepToPhase(creatorCommercialStep, commercialContext), locale);
  const percent = progressPercent(creatorCommercialStep, commercialContext);
  const formId = (project?.id ?? order.id).replace(/[^a-zA-Z0-9]/g, "").slice(-10).toUpperCase();
  const duration =
    project?.video_format ||
    project?.aspect_ratios?.join(" / ") ||
    (locale === "zh" ? "15s / 30s / 60s" : "15s / 30s / 60s");
  const reviewHref = withLocale(creatorPortalRoutes.review(order.id), locale);

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
        <Link
          href={withLocale(creatorPortalRoutes.projects, locale)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Link>
      </div>

      <div className="flex flex-row items-start gap-4 p-5 sm:gap-6 sm:p-6">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-100 via-zinc-100 to-violet-50 sm:h-32 sm:w-32 lg:h-44 lg:w-56 lg:rounded-2xl">
          <Clapperboard className="h-7 w-7 text-violet-400/80 sm:h-10 sm:w-10 lg:h-12 lg:w-12" strokeWidth={1.25} />
          <Badge className="absolute left-2 top-2 border-0 bg-emerald-600 px-1.5 py-0 text-[10px] text-white hover:bg-emerald-600 sm:left-3 sm:top-3 sm:px-2.5 sm:py-0.5 sm:text-xs">
            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-white sm:mr-1.5" />
            {t.official}
          </Badge>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-lg font-semibold text-zinc-950 sm:text-2xl">{title}</h1>
                <Pencil className="h-4 w-4 shrink-0 text-zinc-300" aria-hidden />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:mt-4 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-3">
                <MetaItem label={t.projectId} value={formId} />
                <MetaItem label={t.created} value={formatDate(order.created_at)} />
                <MetaItem label={t.brand} value={order.company_name || project?.company_name || "—"} />
                <MetaItem label={t.budget} value={order.budget_range || project?.budget_range || "—"} />
                <MetaItem label={t.deadline} value={formatDate(project?.deadline)} />
                <MetaItem label={t.duration} value={duration} />
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
              {canUpload ? (
                <Button asChild variant="outline" className="h-9 w-full rounded-xl sm:h-10 sm:w-auto">
                  <Link href={reviewHref}>
                    <Upload className="mr-2 h-4 w-4" />
                    {t.uploadVersion}
                  </Link>
                </Button>
              ) : null}
              <Button asChild className="h-9 w-full rounded-xl bg-violet-600 hover:bg-violet-700 sm:h-10 sm:w-auto">
                <Link href={reviewHref}>
                  {t.reviewCenter}
                  <Clapperboard className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-4 sm:mt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">{t.currentStage}</span>
              <span className="font-semibold text-violet-700">{stageLabel}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-violet-100">
              <div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
