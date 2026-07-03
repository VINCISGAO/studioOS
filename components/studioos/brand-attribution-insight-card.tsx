import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { insightToQueryParams } from "@/lib/studioos/insight-engine";
import type { StoredCreativeInsight } from "@/lib/studioos/creative-performance-types";
import { ArrowRight, BarChart3, MousePointer2, Target } from "lucide-react";

const copy = {
  en: {
    apply: "Apply to new Campaign",
    attributedAds: "Attributed ads",
    ugcCtr: "UGC CTR",
    liftVsBaseline: "Above baseline",
    baseline: "Baseline"
  },
  zh: {
    apply: "应用到新 Campaign",
    attributedAds: "已归因广告",
    ugcCtr: "UGC CTR",
    liftVsBaseline: "高于基线",
    baseline: "基线"
  }
};

function extractPercent(text: string) {
  return text.match(/(\d+(?:\.\d+)?)%/)?.[1] ?? "3.2";
}

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
  const liftLabel = `+${insight.lift_pct}% ${locale === "zh" ? "提升" : "Lift"}`;
  const ctrValue = extractPercent(insight.body[locale]);

  return (
    <article className="overflow-hidden rounded-[26px] border border-zinc-200/80 bg-white shadow-[0_18px_55px_rgba(109,76,255,0.08)]">
      <div className="grid gap-8 p-7 lg:grid-cols-[1fr_340px] lg:items-center">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <span className="text-[10px]">▲</span>
            {liftLabel}
          </span>
          <h3 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-950">{insight.title[locale]}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600">{insight.body[locale]}</p>

          <div className="mt-6 grid max-w-2xl grid-cols-3 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
            <div className="flex items-center gap-3 px-5 py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50 text-[#6d4cff]">
                <Target className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs text-zinc-500">{t.attributedAds}</p>
                <p className="mt-1 text-xl font-semibold text-zinc-950">{insight.sample_size} {locale === "zh" ? "条" : ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 border-l border-zinc-100 px-5 py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50 text-[#6d4cff]">
                <MousePointer2 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs text-zinc-500">{t.ugcCtr}</p>
                <p className="mt-1 text-xl font-semibold text-zinc-950">{ctrValue}%</p>
              </div>
            </div>
            <div className="flex items-center gap-3 border-l border-zinc-100 px-5 py-4">
              <div>
                <p className="text-xs text-zinc-500">{t.liftVsBaseline}</p>
                <p className="mt-1 text-xl font-semibold text-emerald-600">{insight.lift_pct}%</p>
              </div>
            </div>
          </div>

          <Button asChild variant="ghost" className="mt-6 -ml-3 rounded-full text-[#6d4cff] hover:bg-violet-50 hover:text-[#5d3df0]">
            <Link href={href}>
              {t.apply}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="relative hidden h-[260px] overflow-hidden rounded-[24px] bg-[#f5f1ff] p-6 lg:block" aria-hidden>
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6d4cff] text-white shadow-lg">
              <BarChart3 className="h-4 w-4" />
            </span>
            CTR {locale === "zh" ? "表现对比" : "performance"}
          </div>
          <div className="absolute right-9 top-[92px] rounded-lg bg-[#6d4cff] px-3 py-2 text-sm font-semibold text-white shadow-lg">
            {ctrValue}%
          </div>
          <svg viewBox="0 0 320 180" className="absolute bottom-7 left-0 h-[170px] w-full text-[#6d4cff]">
            <defs>
              <linearGradient id={`insight-fill-${insight.id}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 122 C34 96 55 104 80 118 S124 124 150 86 S198 70 226 91 S270 106 320 58 L320 180 L0 180 Z" fill={`url(#insight-fill-${insight.id})`} />
            <path d="M0 122 C34 96 55 104 80 118 S124 124 150 86 S198 70 226 91 S270 106 320 58" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
            <path d="M0 132 H320" stroke="#A1A1AA" strokeDasharray="6 8" strokeWidth="2" />
            <circle cx="292" cy="66" r="6" fill="#F5F1FF" stroke="currentColor" strokeWidth="4" />
          </svg>
          <div className="absolute bottom-14 right-8 text-sm font-medium text-zinc-700">
            {t.baseline} {ctrValue}%
          </div>
        </div>
      </div>
    </article>
  );
}
