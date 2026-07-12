import Link from "next/link";
import { ArrowRight, Building2, Link2, Megaphone, Scale, Users, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AdminBindingStats } from "@/lib/studioos/admin-metrics";
import { adminBindings } from "@/lib/studioos/admin-metrics";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";

function BindingStat({
  icon: Icon,
  label,
  value,
  href,
  locale
}: {
  icon: typeof Building2;
  label: string;
  value: number;
  href: string;
  locale: Locale;
}) {
  return (
    <Link
      href={withLocale(href, locale)}
      className="group flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-white px-4 py-3 transition hover:border-violet-200 hover:bg-violet-50/40"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="text-lg font-semibold tabular-nums text-zinc-950">{value}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-zinc-300 transition group-hover:text-violet-500" />
    </Link>
  );
}

export function AdminBindingSummary({
  locale,
  stats
}: {
  locale: Locale;
  stats: AdminBindingStats;
}) {
  const t = adminBindings(locale);

  return (
    <Card className="border-violet-200/60 bg-gradient-to-br from-violet-50/40 via-white to-white shadow-none">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <Link2 className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-semibold text-zinc-950">{t.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">{t.subtitle}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <BindingStat icon={Building2} label={t.brands} value={stats.brandCount} href={adminPortalRoutes.brands} locale={locale} />
          <BindingStat icon={Users} label={t.creators} value={stats.creatorCount} href={adminPortalRoutes.studios} locale={locale} />
          <BindingStat icon={Megaphone} label={t.campaigns} value={stats.campaignCount} href={adminPortalRoutes.campaigns} locale={locale} />
          <BindingStat icon={Link2} label={t.linked} value={stats.linkedCampaigns} href={adminPortalRoutes.campaigns} locale={locale} />
          <BindingStat icon={Wallet} label={t.escrowFunded} value={stats.escrowFundedCampaigns} href={adminPortalRoutes.payments} locale={locale} />
          <BindingStat icon={Scale} label={t.openDisputes} value={stats.openDisputes} href={adminPortalRoutes.disputes} locale={locale} />
        </div>
      </CardContent>
    </Card>
  );
}
