import Link from "next/link";
import { ArrowLeft, Handshake, TrendingUp, Users } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { partnerAcademyAdminService } from "@/features/partner-academy/partner-academy-admin.service";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { formatCurrency } from "@/lib/utils";

const copy = {
  en: {
    back: "Back to admin",
    kicker: "Growth network",
    title: "Partner programs",
    subtitle: "Track channel partners, referrals, attributed revenue, and commission exposure from the database.",
    activePartners: "Active partners",
    attributedRevenue: "Attributed revenue",
    pendingCommission: "Pending commission",
    referredAccounts: "Referred accounts",
    status: "Status",
    tier: "Tier",
    roster: "Partner roster",
    empty: "No partner programs yet. Seed the database or create a partner program to start tracking referrals.",
    referralCode: "Referral code",
    region: "Region",
    commission: "Commission",
    paid: "Paid"
  },
  zh: {
    back: "返回管理后台",
    kicker: "增长网络",
    title: "合伙人计划",
    subtitle: "从数据库追踪渠道合伙人、推荐账号、归因收入和佣金风险。",
    activePartners: "活跃合伙人",
    attributedRevenue: "归因收入",
    pendingCommission: "待结佣金",
    referredAccounts: "推荐账号",
    status: "状态",
    tier: "等级",
    roster: "合伙人名录",
    empty: "还没有合伙人计划。运行 seed 或创建合伙人计划后，就可以开始追踪推荐。",
    referralCode: "推荐码",
    region: "区域",
    commission: "佣金",
    paid: "已支付"
  }
};

function statusBadge(status: string): BadgeProps["variant"] {
  if (status === "ACTIVE") return "success";
  if (status === "PAUSED" || status === "PENDING") return "warning";
  return "outline";
}

export default async function AdminPartnersPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = getLocale(await searchParams);
  const t = copy[locale];
  const user = await getAdminSessionUser();
  const data = user
    ? await partnerAcademyAdminService.getPartnerDashboard(user)
    : { totals: { brands: 0, creators: 0, revenue: 0, pending: 0, paid: 0 }, byStatus: [], byTier: [], partners: [] };
  const activeCount = data.byStatus.find((item) => item.status === "ACTIVE")?.count ?? 0;

  return (
    <div>
      <Button asChild variant="outline" size="sm">
        <Link href={withLocale(adminPortalRoutes.dashboard, locale)}>
          <ArrowLeft className="h-4 w-4" /> {t.back}
        </Link>
      </Button>

      <div className="mt-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t.kicker}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{t.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {[
          { label: t.activePartners, value: String(activeCount), icon: Handshake },
          { label: t.attributedRevenue, value: formatCurrency(data.totals.revenue), icon: TrendingUp },
          { label: t.pendingCommission, value: formatCurrency(data.totals.pending), icon: TrendingUp },
          { label: t.referredAccounts, value: String(data.totals.brands + data.totals.creators), icon: Users }
        ].map((item) => (
          <Card key={item.label} className="shadow-none">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold">{item.value}</p>
              </div>
              <item.icon className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="shadow-none">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold">{t.roster}</h2>
            {data.partners.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">{t.empty}</p>
            ) : (
              <div className="mt-5 space-y-4">
                {data.partners.map((partner) => (
                  <div key={partner.id} className="rounded-2xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{partner.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {t.referralCode}: {partner.referralCode}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={statusBadge(partner.status)}>{partner.status}</Badge>
                        <Badge variant="outline">{partner.tier}</Badge>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-4">
                      <p>{t.region}: {partner.region ?? "Global"}</p>
                      <p>{t.commission}: {Number(partner.commissionRate)}%</p>
                      <p>{t.attributedRevenue}: {formatCurrency(Number(partner.attributedRevenue))}</p>
                      <p>{t.paid}: {formatCurrency(Number(partner.paidCommission))}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-none">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">{t.status}</h2>
              <div className="mt-4 space-y-3">
                {data.byStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between text-sm">
                    <span>{item.status}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">{t.tier}</h2>
              <div className="mt-4 space-y-3">
                {data.byTier.map((item) => (
                  <div key={item.tier} className="flex items-center justify-between text-sm">
                    <span>{item.tier}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
