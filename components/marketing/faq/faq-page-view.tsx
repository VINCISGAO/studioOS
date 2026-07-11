"use client";

import { useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Clapperboard,
  CreditCard,
  Handshake,
  Megaphone,
  Minus,
  Plus,
  Sparkles,
  UserRound
} from "lucide-react";
import { useMarketingDocsLucien } from "@/components/marketing/docs/marketing-docs-lucien-host";
import { faqText, formatFaqCount, type FaqCategoryId } from "@/lib/marketing/faq-copy";
import { FaqLucienCtaGraphic } from "@/components/marketing/faq/faq-cta-graphic";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

const CATEGORY_ICONS: Record<FaqCategoryId, typeof UserRound> = {
  account: UserRound,
  publish: Megaphone,
  creators: Clapperboard,
  ai: Sparkles,
  payment: CreditCard,
  partners: Handshake
};

const CATEGORY_ICON_STYLES: Record<FaqCategoryId, string> = {
  account: "bg-violet-50 text-violet-600",
  publish: "bg-sky-50 text-sky-600",
  creators: "bg-indigo-50 text-indigo-600",
  ai: "bg-violet-50 text-violet-700",
  payment: "bg-sky-50 text-sky-700",
  partners: "bg-indigo-50 text-indigo-700"
};

function FaqAnswer({
  answer,
  bullets
}: {
  answer: string;
  bullets?: string[];
}) {
  return (
    <div className="space-y-2 text-sm leading-7 text-zinc-600">
      <p>{answer}</p>
      {bullets?.length ? (
        <ul className="space-y-1.5">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-violet-500" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function FaqPageView({ locale }: { locale: Locale }) {
  const t = faqText(locale);
  const { openLucien } = useMarketingDocsLucien();
  const [activeCategory, setActiveCategory] = useState<FaqCategoryId>("account");
  const [openQuestion, setOpenQuestion] = useState(0);

  return (
    <>
      <section className="overflow-hidden rounded-[1.75rem] border border-violet-100/70 bg-gradient-to-br from-violet-50/30 via-white to-sky-50/20 p-6 shadow-[0_18px_60px_-48px_rgba(76,29,149,0.35)] sm:p-8 lg:p-10">
        <p className="text-sm font-semibold text-violet-700">{t.hero.eyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-[-0.035em] text-zinc-950 sm:text-4xl lg:text-[2.65rem] lg:leading-[1.08]">
          {t.hero.title}
        </h1>
        <p className="mt-5 max-w-4xl text-sm leading-7 text-zinc-600">{t.hero.subtitle}</p>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
        {t.categories.map((category) => {
          const Icon = CATEGORY_ICONS[category.id];
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                setActiveCategory(category.id);
                setOpenQuestion(0);
              }}
              className={cn(
                "rounded-2xl border bg-white p-4 text-left shadow-[0_10px_30px_-28px_rgba(0,0,0,0.12)] transition",
                isActive
                  ? "border-violet-200 border-t-[3px] border-t-violet-600 shadow-[0_16px_40px_-28px_rgba(124,58,237,0.35)]"
                  : "border-zinc-200/80 hover:border-violet-200"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-xl",
                  CATEGORY_ICON_STYLES[category.id]
                )}
              >
                {category.id === "ai" ? (
                  <span className="text-xs font-bold">AI</span>
                ) : (
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                )}
              </span>
              <p className="mt-3 text-sm font-semibold text-zinc-950">{category.title}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {formatFaqCount(t.labels.questionCount, category.items.length)}
              </p>
            </button>
          );
        })}
      </section>

      <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-white shadow-[0_14px_40px_-32px_rgba(0,0,0,0.12)]">
        {t.categories.map((category, categoryIndex) => {
          const Icon = CATEGORY_ICONS[category.id];
          const isExpanded = category.id === activeCategory;

          return (
            <div key={category.id} className={categoryIndex > 0 ? "border-t border-zinc-100" : undefined}>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory(category.id);
                  setOpenQuestion(0);
                }}
                className="flex w-full items-center gap-4 px-5 py-5 text-left sm:px-6"
              >
                <span
                  className={cn(
                    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                    CATEGORY_ICON_STYLES[category.id]
                  )}
                >
                  {category.id === "ai" ? (
                    <span className="text-xs font-bold">AI</span>
                  ) : (
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold text-zinc-950">{category.title}</span>
                </span>
                <span className="hidden text-sm text-zinc-500 sm:block">
                  {formatFaqCount(t.labels.totalQuestions, category.items.length)}
                </span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-zinc-400 transition",
                    isExpanded ? "rotate-180" : "rotate-0"
                  )}
                />
              </button>

              {isExpanded ? (
                <div className="border-t border-zinc-100 px-5 pb-5 sm:px-6 sm:pb-6">
                  {category.items.map((item, index) => {
                    const isOpen = openQuestion === index;
                    const number = String(index + 1).padStart(2, "0");

                    return (
                      <div
                        key={item.question}
                        className={cn(index > 0 && "mt-3 border-t border-zinc-100 pt-3")}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenQuestion(openQuestion === index ? -1 : index)}
                          className="flex w-full items-start gap-4 text-left"
                        >
                          <span className="w-8 shrink-0 text-sm font-semibold text-violet-600">{number}</span>
                          <span className="min-w-0 flex-1 pt-0.5 text-sm font-semibold text-zinc-950">
                            {item.question}
                          </span>
                          <span
                            className={cn(
                              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                              isOpen ? "bg-violet-600 text-white" : "bg-zinc-100 text-zinc-500"
                            )}
                          >
                            {isOpen ? (
                              <Minus className="h-4 w-4" strokeWidth={2.25} />
                            ) : (
                              <Plus className="h-4 w-4" strokeWidth={2.25} />
                            )}
                          </span>
                        </button>
                        {isOpen ? (
                          <div className="mt-3 pl-12">
                            <FaqAnswer answer={item.answer} bullets={item.bullets} />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </section>

      <section className="relative mt-10 overflow-visible rounded-[1.75rem] border border-violet-100/70 bg-white shadow-[0_18px_60px_-48px_rgba(76,29,149,0.35)]">
        <div className="relative z-[1] p-6 pr-[min(36%,132px)] sm:p-8 sm:pr-[min(38%,168px)] lg:pr-[min(42%,280px)]">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-zinc-950">{t.cta.title}</h2>
          <div className="mt-5">
            <button
              type="button"
              onClick={openLucien}
              className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700"
            >
              <Sparkles className="h-4 w-4" strokeWidth={1.75} />
              {t.cta.contactLabel}
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
        <FaqLucienCtaGraphic locale={locale} />
      </section>
    </>
  );
}
