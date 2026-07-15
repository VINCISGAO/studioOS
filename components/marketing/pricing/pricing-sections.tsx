import {
  BrainCircuit,
  Check,
  Cpu,
  Globe2,
  Lock,
  PieChart,
  ShieldCheck,
  TrendingUp,
  Users
} from "lucide-react";
import { PricingBudgetTierCard } from "@/components/marketing/pricing/pricing-budget-tier-card";
import { PricingLucienCtaButton } from "@/components/marketing/pricing/pricing-lucien-cta-button";
import { PLATFORM_SERVICE_INCLUDES } from "@/features/pricing/platform-service-fee.constants";
import { pricingText } from "@/lib/marketing/pricing-copy";
import type { Locale } from "@/lib/i18n";

const PRINCIPLE_ICONS = [BrainCircuit, ShieldCheck, Lock, Globe2] as const;
const TRUST_ICONS = [PieChart, Cpu, Users, TrendingUp] as const;
const TRUST_ICON_STYLES = [
  "bg-violet-50 text-violet-600",
  "bg-violet-50 text-violet-700",
  "bg-sky-50 text-sky-600",
  "bg-indigo-50 text-indigo-600"
] as const;

export function PricingHeroSection({ locale }: { locale: Locale }) {
  const t = pricingText(locale);

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-violet-100/70 bg-gradient-to-br from-violet-50/40 via-white to-sky-50/30 p-6 shadow-[0_18px_60px_-48px_rgba(76,29,149,0.35)] sm:p-8 lg:p-10">
      <p className="text-sm font-semibold text-violet-700">{t.eyebrow}</p>
      <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-[-0.035em] text-zinc-950 sm:text-4xl lg:text-[2.65rem] lg:leading-[1.08]">
        {t.title}
        <span className="text-violet-600">{t.titleAccent}</span>
      </h1>
      <p className="mt-5 max-w-4xl text-sm leading-7 text-zinc-600">{t.intro}</p>
      <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50/80 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-violet-700 shadow-sm">
            <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <p className="text-sm font-medium leading-7 text-violet-950">{t.philosophy}</p>
        </div>
      </div>
    </section>
  );
}

export function PricingPrinciplesSection({ locale }: { locale: Locale }) {
  const t = pricingText(locale);

  return (
    <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {t.principles.map((item, index) => {
        const Icon = PRINCIPLE_ICONS[index] ?? BrainCircuit;
        return (
          <article
            key={item.title}
            className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_14px_40px_-32px_rgba(0,0,0,0.18)]"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-violet-50 text-violet-700">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <h2 className="mt-4 text-sm font-semibold text-zinc-950">{item.title}</h2>
            <p className="mt-2 text-xs leading-6 text-zinc-500">{item.body}</p>
          </article>
        );
      })}
    </section>
  );
}

export function PricingServiceFeeSection({ locale }: { locale: Locale }) {
  const t = pricingText(locale);
  const includes = PLATFORM_SERVICE_INCLUDES[locale];

  return (
    <section className="mt-6 rounded-[1.75rem] border border-violet-100/70 bg-white p-6 shadow-[0_18px_60px_-48px_rgba(76,29,149,0.35)] sm:p-8">
      <h2 className="text-2xl font-semibold tracking-[-0.03em] text-zinc-950">{t.serviceFeeTitle}</h2>
      <p className="mt-2 text-sm font-medium text-violet-700">{t.serviceFeeSubtitle}</p>
      <p className="mt-4 max-w-4xl text-sm leading-7 text-zinc-600">{t.serviceFeeIntro}</p>

      <h3 className="mt-8 text-sm font-semibold text-zinc-950">{t.serviceFeeIncludesTitle}</h3>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {includes.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm leading-6 text-zinc-600">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" strokeWidth={2.5} />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-5">
          <h3 className="text-sm font-semibold text-zinc-950">{t.serviceFeeSplitTitle}</h3>
          <div className="mt-4 space-y-3">
            {t.serviceFeeSplit.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">{item.label}</span>
                <span className="font-semibold text-zinc-950">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-5">
          <h3 className="text-sm font-semibold text-zinc-950">{t.serviceFeeTierTitle}</h3>
          <div className="mt-4 overflow-hidden rounded-xl border border-zinc-100 bg-white">
            <div className="grid grid-cols-[1fr_0.7fr_1.2fr] gap-2 border-b border-zinc-100 bg-zinc-50/80 px-3 py-2 text-xs font-semibold text-zinc-500">
              {t.serviceFeeTierColumns.map((column) => (
                <span key={column}>{column}</span>
              ))}
            </div>
            {t.serviceFeeTiers.map((tier) => (
              <div
                key={tier.title}
                className="grid grid-cols-[1fr_0.7fr_1.2fr] gap-2 border-b border-zinc-100 px-3 py-3 text-sm last:border-b-0"
              >
                <span className="font-medium text-zinc-900">{tier.title}</span>
                <span className="font-semibold text-violet-700">{tier.rate}</span>
                <span className="text-xs leading-5 text-zinc-500">{tier.note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm leading-7 text-zinc-500">{t.serviceFeeNote}</p>
    </section>
  );
}

export function PricingBudgetSection({ locale }: { locale: Locale }) {
  const t = pricingText(locale);

  return (
    <section className="mt-6 rounded-[1.75rem] border border-zinc-200/80 bg-white p-6 shadow-[0_18px_60px_-32px_rgba(0,0,0,0.18)] sm:p-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-zinc-950">{t.budgetTitle}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-zinc-500">{t.budgetSubtitle}</p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {t.budgetTiers.map((tier, index) => (
          <PricingBudgetTierCard
            key={tier.title}
            title={tier.title}
            subtitle={tier.subtitle}
            badge={tier.badge}
            audience={tier.audience}
            features={tier.features}
            theme={tier.theme}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}

export function PricingTrustSection({ locale }: { locale: Locale }) {
  const t = pricingText(locale);

  return (
    <section className="mt-6 rounded-[1.75rem] border border-zinc-200/80 bg-white px-6 py-8 sm:px-8">
      <h2 className="text-2xl font-semibold tracking-[-0.03em] text-zinc-950">{t.trustTitle}</h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {t.trustPoints.map((point, index) => {
          const Icon = TRUST_ICONS[index] ?? PieChart;
          const iconStyle = TRUST_ICON_STYLES[index] ?? TRUST_ICON_STYLES[0];
          return (
            <article key={point.title} className="flex items-start gap-3">
              <span
                className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 pt-0.5">
                <h3 className="text-sm font-semibold text-zinc-950">{point.title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-zinc-500">{point.body}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function PricingClosingSection({ locale }: { locale: Locale }) {
  const t = pricingText(locale);

  return (
    <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-violet-100/80 bg-gradient-to-br from-violet-50/80 via-white to-indigo-50/50 p-6 sm:p-8 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-10 lg:p-10">
      <div>
        <h2 className="max-w-xl text-2xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-[1.85rem] sm:leading-[1.2]">
          {t.closingTitleLead}
          <span className="relative inline-block">
            {t.closingTitleAccent}
            <span className="absolute -bottom-1 left-0 h-0.5 w-10 rounded-full bg-violet-600" />
          </span>
        </h2>
        <div className="mt-4 max-w-xl space-y-2 text-sm leading-7 text-zinc-600">
          {t.closingBody.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      </div>
      <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4 lg:mt-0 lg:flex-col lg:items-end lg:justify-center">
        <PricingLucienCtaButton label={t.closingCta} />
        <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
          <Check className="h-4 w-4" strokeWidth={2.5} />
          {t.closingNote}
        </span>
      </div>
    </section>
  );
}
