import { Card, CardContent } from "@/components/ui/card";
import type { AdminDashboardMetrics } from "@/features/admin/dashboard/admin-dashboard.service";
import type { Locale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

const copy = {
  en: {
    gmv: "GMV",
    revenue: "Platform revenue",
    platformFees: "Platform fees",
    completed: "Completed campaigns",
    avgReview: "Avg review time (hrs)",
    avgSettlement: "Avg settlement time (hrs)",
    walletTotal: "Wallet available",
    pendingWithdrawals: "Pending withdrawals",
    topBrands: "Top brands",
    topCreators: "Top studios"
  },
  zh: {
    gmv: "GMV",
    revenue: "平台收入",
    platformFees: "平台手续费",
    completed: "已完成 Campaign",
    avgReview: "平均审片时长（小时）",
    avgSettlement: "平均结算时长（小时）",
    walletTotal: "钱包可用总额",
    pendingWithdrawals: "待处理提现",
    topBrands: "Top Brand",
    topCreators: "Top Studio"
  }
};

export function AdminAnalyticsDashboard({
  locale,
  metrics
}: {
  locale: Locale;
  metrics: AdminDashboardMetrics;
}) {
  const t = copy[locale];
  const cards = [
    { label: t.gmv, value: formatCurrency(metrics.gmv, locale) },
    { label: t.revenue, value: formatCurrency(metrics.revenue, locale) },
    { label: t.platformFees, value: formatCurrency(metrics.platformFees, locale) },
    { label: t.completed, value: String(metrics.completedCampaigns) },
    { label: t.avgReview, value: metrics.avgReviewHours.toFixed(1) },
    { label: t.avgSettlement, value: metrics.avgSettlementHours.toFixed(1) },
    { label: t.walletTotal, value: formatCurrency(metrics.walletAvailable, locale) },
    { label: t.pendingWithdrawals, value: String(metrics.pendingWithdrawals) }
  ];

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value }) => (
          <Card key={label} className="border-zinc-200/80 shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-6">
            <h2 className="font-semibold">{t.topBrands}</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {metrics.topBrands.map((b) => (
                <li key={b.id} className="flex justify-between">
                  <span>{b.name}</span>
                  <span className="text-zinc-500">{b.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-6">
            <h2 className="font-semibold">{t.topCreators}</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {metrics.topCreators.map((c) => (
                <li key={c.id} className="flex justify-between">
                  <span>{c.name}</span>
                  <span className="text-zinc-500">{c.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
