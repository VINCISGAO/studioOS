import Link from "next/link";
import { BadgeCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { CreatorDepositHero } from "@/components/studioos/creator-deposit-hero";
import { CreatorDepositPaymentSection } from "@/components/studioos/creator-deposit-payment-section";
import { CreatorDepositSidebar } from "@/components/studioos/creator-deposit-sidebar";
import { tCertified } from "@/lib/studioos/deposit-copy";
import { tCertificationExperience } from "@/lib/studioos/certification-experience-copy";
import { CertificationBenefitCard } from "@/components/studioos/certification/certified-partner-badge";
import type { CreatorDepositSnapshot } from "@/lib/studioos/deposit-types";
import { formatSettlementUsd } from "@/lib/money/display-money";

type Props = {
  locale: Locale;
  creatorId: string;
  snapshot: CreatorDepositSnapshot;
  mode: "optional" | "required" | "certified";
  completedOrders: number;
  submitted?: boolean;
  error?: string;
  profileComplete?: boolean;
  scrollToPayment?: boolean;
  stripeCheckoutEnabled?: boolean;
  embeddedCheckoutEnabled?: boolean;
};

const requiredCopy = {
  en: {
    title: "Your free order is complete",
    body: "Become a certified service provider to accept new projects. Order management, invitations, and review are locked until you certify — income and withdrawals stay available."
  },
  zh: {
    title: "你的免费首单已完成",
    body: "成为认证服务商后可继续接新单。订单管理、审片、消息等功能已锁定，但收益管理与提现仍可正常使用。"
  }
};

export function CreatorCertificationHub({
  locale,
  creatorId,
  snapshot,
  mode,
  completedOrders,
  submitted,
  error,
  profileComplete = true,
  scrollToPayment = false,
  stripeCheckoutEnabled = false,
  embeddedCheckoutEnabled = false
}: Props) {
  const t = tCertified(locale);

  if (mode === "certified" || snapshot.deposit_status === "paid") {
    const experience = tCertificationExperience(locale);
    return (
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_100%)] p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                {t.programName}
              </span>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <BadgeCheck className="h-5 w-5" />
                </span>
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">{t.certifiedTitle}</h1>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600">{t.certifiedBody}</p>
              <p className="mt-3 text-sm text-zinc-500">
                {formatSettlementUsd(snapshot.amount_usd, locale)} · {t.certifiedSince}{" "}
                {snapshot.paid_at
                  ? new Date(snapshot.paid_at).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US")
                  : "—"}
              </p>
              <Button asChild variant="outline" className="mt-4 h-10 rounded-xl border-emerald-200 bg-white">
                <Link href={withLocale("/studio/messages", locale)}>
                  {locale === "zh" ? "查看入驻表单消息" : "View onboarding message"}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {!profileComplete ? (
          <section className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-zinc-950">{t.setupProfile}</p>
                <p className="mt-1.5 text-sm leading-6 text-zinc-500">{t.setupProfileBody}</p>
              </div>
              <Button asChild className="h-10 shrink-0 rounded-xl px-5">
                <Link href={withLocale("/studio/works?onboarding=1", locale)}>{t.setupProfileCta}</Link>
              </Button>
            </div>
          </section>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <section className="overflow-hidden rounded-2xl border border-violet-200/80 bg-white shadow-sm">
            <div className="border-b border-violet-100 bg-violet-50/60 px-5 py-4">
              <h2 className="text-base font-semibold text-zinc-950">{experience.modalTitle}</h2>
              <p className="mt-1 text-sm text-zinc-600">{experience.modalSubtitle}</p>
            </div>
            <div className="grid gap-2.5 p-5">
              {experience.benefits.map((benefit) => (
                <CertificationBenefitCard key={benefit.title} title={benefit.title} body={benefit.body} />
              ))}
            </div>
          </section>
          <CreatorDepositSidebar locale={locale} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {mode === "required" ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 sm:p-6">
          <div className="flex gap-3">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <h2 className="text-lg font-semibold text-amber-950">{requiredCopy[locale].title}</h2>
              <p className="mt-2 text-sm leading-6 text-amber-900/90">{requiredCopy[locale].body}</p>
            </div>
          </div>
        </section>
      ) : (
        <CreatorDepositHero
          locale={locale}
          completedOrders={completedOrders}
          certifyHref="#deposit-payment"
        />
      )}

      {error ? (
        <div className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <CreatorDepositPaymentSection
          locale={locale}
          creatorId={creatorId}
          snapshot={snapshot}
          submitted={submitted}
          scrollToPayment={scrollToPayment}
          stripeCheckoutEnabled={stripeCheckoutEnabled}
          embeddedCheckoutEnabled={embeddedCheckoutEnabled}
        />
        <CreatorDepositSidebar locale={locale} />
      </div>
    </div>
  );
}
