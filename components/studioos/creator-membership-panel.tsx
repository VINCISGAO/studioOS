import { BadgeCheck, Crown, TrendingUp } from "lucide-react";
import { CreatorMembershipUpgradeDialog } from "@/components/studioos/creator-membership-upgrade-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CreatorMembershipStatusView, MembershipPlanView } from "@/features/membership/membership.types";
import type { Locale } from "@/lib/i18n";
import { formatCurrency, formatDate } from "@/lib/utils";

const copy = {
  en: {
    title: "Creator membership",
    plan: "Current plan",
    commission: "Platform commission",
    revenue: "Settled revenue",
    threshold: "Verified upgrade threshold",
    expires: "Membership expires",
    verified: "Verified Creator",
    default: "Default Creator",
    benefits: "Your benefits"
  },
  zh: {
    title: "创作者会员",
    plan: "当前方案",
    commission: "平台佣金",
    revenue: "已结算收入",
    threshold: "Verified 升级门槛",
    expires: "会员到期",
    verified: "Verified Creator",
    default: "Default Creator",
    benefits: "当前权益"
  }
};

export function CreatorMembershipPanel({
  locale,
  status,
  verifiedPlan,
  stripeConfigured
}: {
  locale: Locale;
  status: CreatorMembershipStatusView;
  verifiedPlan: MembershipPlanView;
  stripeConfigured: boolean;
}) {
  const t = copy[locale];
  const progress = Math.min(100, status.earnings.progressPercent);

  return (
    <>
      <Card className="border-zinc-200/80 shadow-none">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{t.title}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{status.plan.name}</h2>
                <Badge variant={status.isVerified ? "success" : "outline"}>
                  {status.isVerified ? (
                    <span className="inline-flex items-center gap-1">
                      <BadgeCheck className="h-3.5 w-3.5" /> {t.verified}
                    </span>
                  ) : (
                    t.default
                  )}
                </Badge>
              </div>
            </div>
            <div className="rounded-xl bg-zinc-50 px-4 py-3 text-sm ring-1 ring-zinc-200/60">
              <p className="text-zinc-500">{t.commission}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{status.commissionRate}%</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border p-4">
              <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                <TrendingUp className="h-3.5 w-3.5" /> {t.revenue}
              </p>
              <p className="mt-2 text-lg font-semibold tabular-nums">
                {formatCurrency(status.earnings.totalSettledRevenue, locale)}
              </p>
            </div>
            <div className="rounded-xl border p-4 sm:col-span-2">
              <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Crown className="h-3.5 w-3.5" /> {t.threshold}
              </p>
              <p className="mt-2 text-lg font-semibold tabular-nums">
                {formatCurrency(status.earnings.upgradeThreshold, locale)}
              </p>
              {!status.isVerified ? (
                <div className="mt-3">
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{progress}%</p>
                </div>
              ) : null}
            </div>
          </div>

          {status.membership?.expiresAt ? (
            <p className="mt-4 text-sm text-zinc-500">
              {t.expires}: {formatDate(status.membership.expiresAt)}
            </p>
          ) : null}

          <div className="mt-5">
            <p className="text-sm font-medium text-zinc-900">{t.benefits}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {status.benefits.map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <CreatorMembershipUpgradeDialog
        locale={locale}
        open={status.earnings.shouldShowUpgradeModal}
        verifiedPlan={verifiedPlan}
        stripeConfigured={stripeConfigured}
      />
    </>
  );
}
