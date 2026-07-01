import Link from "next/link";
import {
  BadgeCheck,
  Headphones,
  LayoutDashboard,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingUp,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import {
  creatorDepositSidebarCopyFor,
  depositBenefitIconTones,
  parseDepositBenefit
} from "@/lib/studioos/creator-deposit-ui";
import { tCertified } from "@/lib/studioos/deposit-copy";
import { cn } from "@/lib/utils";

const benefitIcons = [Sparkles, TrendingUp, Zap, BadgeCheck, LayoutDashboard];

export function CreatorDepositSidebar({ locale }: { locale: Locale }) {
  const t = tCertified(locale);
  const help = creatorDepositSidebarCopyFor(locale);
  const badge = locale === "zh" ? "零风险保障" : "Risk-free guarantee";

  return (
    <aside className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-zinc-950">{t.refundSection}</h2>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
              {badge}
            </span>
          </div>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <RefreshCw className="h-4 w-4" />
            </span>
            <p className="pt-1 text-sm font-medium leading-7 text-zinc-800">
              {locale === "zh" ? (
                <>
                  连续 <span className="font-semibold text-emerald-700">30 天</span>
                  未获得任何有效订单，可申请
                  <span className="font-semibold text-emerald-700">全额退款</span>。
                </>
              ) : (
                <>
                  If you receive no valid orders for{" "}
                  <span className="font-semibold text-emerald-700">30 consecutive days</span>, you may apply for a{" "}
                  <span className="font-semibold text-emerald-700">full refund</span>.
                </>
              )}
            </p>
          </div>
          <p className="rounded-xl bg-zinc-50 px-3.5 py-3 text-xs leading-5 text-zinc-500">{t.refundNote}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="text-base font-semibold tracking-tight text-zinc-950">{t.benefitsSection}</h2>
        </div>
        <ul className="divide-y divide-zinc-100">
          {t.benefits.map((benefit, index) => {
            const Icon = benefitIcons[index] ?? Shield;
            const { title, detail } = parseDepositBenefit(benefit);
            return (
              <li key={benefit} className="flex gap-3 px-5 py-4">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    depositBenefitIconTones[index] ?? "bg-zinc-100 text-zinc-600"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-medium text-zinc-900">{title}</p>
                  {detail ? <p className="mt-1 text-xs leading-5 text-zinc-500">{detail}</p> : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="overflow-hidden rounded-2xl border border-sky-100 bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_100%)] p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900">{help.helpTitle}</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{help.helpBody}</p>
        <Button
          asChild
          variant="outline"
          className="mt-4 h-10 w-full rounded-xl border-sky-200 bg-white text-sm text-zinc-800 hover:bg-sky-50"
        >
          <Link href="mailto:support@studioos.com">
            <Headphones className="h-4 w-4" />
            {help.helpCta}
          </Link>
        </Button>
      </section>
    </aside>
  );
}
