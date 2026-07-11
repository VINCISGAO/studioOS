import Link from "next/link";
import {
  BadgePercent,
  Building2,
  ChevronRight,
  CircleDollarSign,
  LineChart,
  Link2,
  Share2,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Wallet
} from "lucide-react";
import { PartnersEarningsCalculator } from "@/components/marketing/partners/partners-earnings-calculator";
import type { PartnerCommissionTier } from "@/features/partner-program/partner-program.constants";
import { PARTNER_REFERRAL_SHARE_OF_PLATFORM_FEE } from "@/features/partner-program/partner-program.constants";
import { formatPartnerStatValue, partnersText } from "@/lib/marketing/partners-copy";
import { buildLocalizedHref } from "@/lib/marketing/localized-href";
import { appPath, type Locale } from "@/lib/i18n";

const BENEFIT_ICONS = [BadgePercent, TrendingUp, LineChart, Wallet] as const;
const STEP_ICONS = [UserPlus, Share2, CircleDollarSign, Sparkles, Wallet] as const;
const TIER_ICONS = [Building2, Users, Building2] as const;
const STAT_ICONS = [Users, CircleDollarSign, UserPlus, TrendingUp] as const;

type PartnerStats = {
  activePartners: number;
  totalPaidCommission: number;
  referredCustomers: number;
  satisfactionRate: number;
};

export function PartnersHeroSection({ locale }: { locale: Locale }) {
  const t = partnersText(locale);

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-violet-100/70 bg-white p-6 shadow-[0_18px_60px_-48px_rgba(76,29,149,0.35)] sm:p-8 lg:p-10">
      <h1 className="max-w-4xl text-3xl font-semibold tracking-[-0.035em] text-zinc-950 sm:text-4xl lg:text-[2.7rem] lg:leading-[1.08]">
        {t.hero.titleLead}
        <span className="text-violet-600"> {t.hero.titleAccent}</span>
      </h1>
      <p className="mt-5 max-w-4xl text-sm leading-7 text-zinc-600">{t.hero.body}</p>
      <div className="mt-6 flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
        {t.hero.links.map((link, index) => {
          const href = link.href.startsWith("#")
            ? link.href
            : link.href.startsWith("/login")
              ? appPath(link.href)
              : buildLocalizedHref(link.href, locale);
          return (
            <span key={link.label} className="inline-flex items-center">
              {index > 0 ? <span className="mx-2 text-zinc-300">·</span> : null}
              <Link href={href} className="font-medium text-violet-700 transition hover:text-violet-900">
                {link.label}
              </Link>
            </span>
          );
        })}
      </div>
    </section>
  );
}

export function PartnersBenefitsSection({ locale }: { locale: Locale }) {
  const t = partnersText(locale);

  return (
    <section className="mt-6">
      <h2 className="text-center text-2xl font-semibold tracking-[-0.03em] text-zinc-950">{t.benefitsTitle}</h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {t.benefits.map((item, index) => {
          const Icon = BENEFIT_ICONS[index] ?? BadgePercent;
          return (
            <article
              key={item.title}
              className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-5 shadow-[0_10px_30px_-28px_rgba(0,0,0,0.12)]"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-violet-100 bg-white text-violet-700">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-zinc-950">{item.title}</h3>
              <p className="mt-2 text-xs leading-6 text-zinc-500">{item.body}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function PartnersStepsSection({ locale }: { locale: Locale }) {
  const t = partnersText(locale);

  return (
    <section className="mt-8 rounded-[1.75rem] border border-zinc-200/80 bg-white p-6 sm:p-8">
      <h2 className="text-center text-2xl font-semibold tracking-[-0.03em] text-zinc-950">{t.stepsTitle}</h2>
      <div className="mt-8 grid gap-4 lg:grid-cols-5">
        {t.steps.map((step, index) => {
          const Icon = STEP_ICONS[index] ?? Link2;
          return (
            <article key={step.title} className="relative text-center">
              <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-zinc-950">{step.title}</h3>
              <p className="mt-2 text-xs leading-6 text-zinc-500">{step.body}</p>
              {index < t.steps.length - 1 ? (
                <ChevronRight
                  aria-hidden
                  className="absolute -right-2 top-5 hidden h-4 w-4 text-zinc-300 lg:block"
                />
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function PartnersCommissionSection({
  locale,
  tiers,
  stats
}: {
  locale: Locale;
  tiers: PartnerCommissionTier[];
  stats: PartnerStats;
}) {
  const t = partnersText(locale);

  return (
    <section
      id="commission"
      className="mt-6 grid scroll-mt-24 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-stretch"
    >
      <div className="rounded-[1.75rem] border border-zinc-200/80 bg-white p-5 shadow-[0_14px_40px_-32px_rgba(0,0,0,0.18)] sm:p-6">
        <h2 className="text-base font-semibold text-zinc-950">{t.commissionTitle}</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-100">
          <div className="grid grid-cols-[1.1fr_0.7fr_1.4fr] gap-3 border-b border-zinc-100 bg-zinc-50/80 px-4 py-3 text-xs font-semibold text-zinc-500">
            {t.commissionColumns.map((column) => (
              <span key={column}>{column}</span>
            ))}
          </div>
          {tiers.map((tier, index) => {
            const Icon = TIER_ICONS[index] ?? Building2;
            return (
              <div
                key={tier.id}
                className="grid grid-cols-[1.1fr_0.7fr_1.4fr] gap-3 border-b border-zinc-100 px-4 py-4 text-sm last:border-b-0"
              >
                <span className="inline-flex items-center gap-2 font-medium text-zinc-900">
                  <Icon className="h-4 w-4 text-violet-600" strokeWidth={1.75} />
                  {locale === "zh" ? tier.labelZh : tier.labelEn}
                </span>
                <span className="font-semibold text-violet-700">{tier.platformServiceFeeRate}%</span>
                <span className="text-zinc-600">
                  {locale === "zh"
                    ? `平台服务费的 ${PARTNER_REFERRAL_SHARE_OF_PLATFORM_FEE}%`
                    : `${PARTNER_REFERRAL_SHARE_OF_PLATFORM_FEE}% of platform service fee`}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-8 border-t border-zinc-100 pt-8">
          <h3 className="text-base font-semibold text-zinc-950">{t.statsTitle}</h3>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {t.stats.map((item, index) => {
              const Icon = STAT_ICONS[index] ?? Users;
              return (
                <article key={item.label} className="text-center">
                  <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <p className="mt-4 text-2xl font-bold tracking-[-0.03em] text-zinc-950">
                    {formatPartnerStatValue(index, stats, locale)}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">{item.label}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      <PartnersEarningsCalculator locale={locale} tiers={tiers} className="lg:h-full" />
    </section>
  );
}

export function PartnersFaqSection({ locale }: { locale: Locale }) {
  const t = partnersText(locale);

  return (
    <section className="mt-6 rounded-[1.75rem] border border-zinc-200/80 bg-white p-6 sm:p-8">
      <h2 className="text-center text-2xl font-semibold tracking-[-0.03em] text-zinc-950">{t.faqTitle}</h2>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {t.faq.map((item) => (
          <details
            key={item.question}
            className="group rounded-2xl border border-zinc-200/80 bg-zinc-50/50 px-4 py-4 open:bg-white"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-zinc-950">
              {item.question}
              <span className="text-lg text-zinc-400 transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-7 text-zinc-600">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
