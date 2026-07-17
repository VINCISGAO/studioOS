"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useMarketingDocsLucien } from "@/components/marketing/docs/marketing-docs-lucien-context";
import { FaqLucienCtaGraphic } from "@/components/marketing/faq/faq-cta-graphic";
import type { MarketingLocale } from "@/lib/i18n";

export function FaqLucienCtaBlock({
  locale,
  title,
  buttonLabel,
  className
}: {
  locale: MarketingLocale;
  title: string;
  buttonLabel: string;
  className?: string;
}) {
  const { openLucien } = useMarketingDocsLucien();

  return (
    <section
      className={
        className ??
        "relative mt-10 overflow-visible rounded-[1.75rem] border border-violet-100/70 bg-white shadow-[0_18px_60px_-48px_rgba(76,29,149,0.35)]"
      }
    >
      <div className="flex flex-col items-stretch sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1 p-6 sm:p-8">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-zinc-950">{title}</h2>
          <div className="mt-5">
            <button
              type="button"
              onClick={openLucien}
              className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700"
            >
              <Sparkles className="h-4 w-4" strokeWidth={1.75} />
              {buttonLabel}
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
        <FaqLucienCtaGraphic locale={locale} />
      </div>
    </section>
  );
}
