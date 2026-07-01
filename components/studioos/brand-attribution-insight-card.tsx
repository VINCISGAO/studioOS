import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { insightToQueryParams } from "@/lib/studioos/insight-engine";
import type { StoredCreativeInsight } from "@/lib/studioos/creative-performance-types";
import { ArrowRight } from "lucide-react";

const copy = {
  en: { apply: "Apply to new campaign" },
  zh: { apply: "应用到新 Campaign" }
};

export function BrandAttributionInsightCard({
  locale,
  insight
}: {
  locale: Locale;
  insight: StoredCreativeInsight;
}) {
  const t = copy[locale];
  const params = insightToQueryParams(insight);
  const href = withLocale(`/brand/projects/new?${new URLSearchParams(params).toString()}`, locale);
  const liftLabel = `+${String(insight.lift_pct).padStart(2, "0")}% LIFT`;

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_220px] lg:items-center">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">{liftLabel}</p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-950">{insight.title[locale]}</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{insight.body[locale]}</p>
          <Button asChild variant="link" className="mt-3 h-auto p-0 text-sm font-medium text-indigo-600">
            <Link href={href}>
              {t.apply}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="relative hidden h-28 overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50 via-violet-50 to-sky-50 lg:block" aria-hidden>
          <div className="absolute inset-x-4 bottom-4 top-6 rounded-lg bg-white/70 shadow-sm ring-1 ring-indigo-100/80">
            <svg viewBox="0 0 160 80" className="h-full w-full text-indigo-400" fill="none">
              <path
                d="M8 58 L36 46 L64 52 L92 28 L120 34 L152 18"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="92" cy="28" r="3.5" fill="#6366F1" />
              <circle cx="152" cy="18" r="3.5" fill="#818CF8" />
            </svg>
          </div>
          <div className="absolute right-3 top-3 h-14 w-14 rounded-full bg-white/80 shadow-sm ring-1 ring-violet-100">
            <svg viewBox="0 0 56 56" className="h-full w-full">
              <circle cx="28" cy="28" r="18" fill="#EEF2FF" />
              <path d="M28 10 A18 18 0 0 1 46 28 L28 28 Z" fill="#6366F1" />
              <path d="M28 28 A18 18 0 0 1 10 28 L28 28 Z" fill="#818CF8" />
              <path d="M28 28 A18 18 0 0 1 28 46 L28 28 Z" fill="#A5B4FC" />
            </svg>
          </div>
        </div>
      </div>
    </article>
  );
}
