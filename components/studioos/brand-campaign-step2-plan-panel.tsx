"use client";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { formatStoredBudgetRange } from "@/lib/money/display-money";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Lock,
  Monitor,
  Ratio,
  Sparkles,
  Target,
  Wallet
} from "lucide-react";

const copy = {
  en: {
    backStep: "Back to previous step",
    analyzedProduct: "Product analyzed",
    analyzedRef: "References analyzed",
    planReady: "Creative plan ready",
    budget: "Estimated budget",
    delivery: "Delivery time",
    summaryTitle: "Plan summary",
    formId: "Form ID",
    budgetRange: "Budget range",
    videoRatio: "Video ratio",
    platforms: "Platforms"
  },
  zh: {
    backStep: "返回上一步",
    analyzedProduct: "产品已分析",
    analyzedRef: "参考已分析",
    planReady: "创意方案就绪",
    budget: "预估预算",
    delivery: "交付时间",
    summaryTitle: "方案摘要",
    formId: "表单编号",
    budgetRange: "预算范围",
    videoRatio: "视频比例",
    platforms: "投放平台"
  }
} as const;

function formatFormId(projectId: string) {
  const raw = (projectId.split("_").pop() ?? projectId).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const padded = raw.padEnd(6, "0").slice(0, 6);
  return `${padded.slice(0, 3)}_${padded.slice(3)}`;
}

function SummaryRow({
  icon: Icon,
  label,
  value
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-zinc-900">{value}</p>
      </div>
    </div>
  );
}

export function BrandCampaignStep2PlanPanel({
  locale,
  projectId,
  budget,
  deliveryLabel,
  aspectRatio,
  platforms,
  disabled,
  onBack
}: {
  locale: Locale;
  projectId: string;
  budget: string;
  deliveryLabel: string;
  aspectRatio: string;
  platforms: string;
  disabled?: boolean;
  onBack: () => void;
}) {
  const t = copy[locale];
  const checklist = [t.analyzedProduct, t.analyzedRef, t.planReady];
  const budgetLabel = formatStoredBudgetRange(budget, locale);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_272px]">
      <div className="space-y-5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-xl border-zinc-200 bg-white text-zinc-700 shadow-sm"
          onClick={onBack}
          disabled={disabled}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.backStep}
        </Button>

        <ul className="space-y-3">
          {checklist.map((label) => (
            <li key={label} className="flex items-center gap-3 text-sm font-medium text-zinc-800">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-white shadow-sm">
                <Check className="h-4 w-4" />
              </span>
              {label}
            </li>
          ))}
        </ul>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Wallet className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm text-zinc-500">{t.budget}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">{budgetLabel}</p>
            <div className="pointer-events-none absolute -right-1 bottom-2 hidden h-20 w-24 sm:block" aria-hidden>
              <div className="absolute right-2 top-3 h-9 w-9 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 shadow-inner" />
              <div className="absolute right-10 top-8 h-7 w-7 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 opacity-90" />
              <div className="absolute right-3 top-9 h-11 w-11 rounded-xl bg-violet-100/90 ring-1 ring-violet-200" />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <CalendarDays className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm text-zinc-500">{t.delivery}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">{deliveryLabel}</p>
            <div className="pointer-events-none absolute -right-1 bottom-2 hidden h-20 w-24 sm:block" aria-hidden>
              <div className="absolute right-2 top-2 h-16 w-14 rounded-xl bg-white shadow-md ring-1 ring-zinc-200" />
              <div className="absolute right-4 top-4 h-2 w-8 rounded bg-violet-500" />
              <div className="absolute right-4 top-8 grid grid-cols-3 gap-1">
                {Array.from({ length: 6 }).map((_, index) => (
                  <span key={index} className="h-1.5 w-1.5 rounded-sm bg-zinc-200" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-violet-100 bg-gradient-to-b from-violet-50 via-violet-50/40 to-white p-5 shadow-sm">
        <div className="mb-1 flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-violet-600" />
          <h3 className="text-sm font-semibold text-zinc-950">{t.summaryTitle}</h3>
          <Sparkles className="h-3.5 w-3.5 text-violet-500/80" />
        </div>
        <div className="divide-y divide-violet-100/80">
          <SummaryRow icon={Monitor} label={t.formId} value={formatFormId(projectId)} />
          <SummaryRow icon={Lock} label={t.budgetRange} value={budgetLabel} />
          <SummaryRow icon={CalendarDays} label={t.delivery} value={deliveryLabel} />
          <SummaryRow icon={Ratio} label={t.videoRatio} value={aspectRatio} />
          <SummaryRow icon={Target} label={t.platforms} value={platforms} />
        </div>
      </div>
    </div>
  );
}
