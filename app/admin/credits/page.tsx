import Link from "next/link";
import { getAppUiLocale } from "@/lib/app-language";
import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { adminCreditService } from "@/features/admin/credits/admin-credit.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { withLocale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

const copy = {
  en: {
    title: "Credits overview",
    subtitle: "Platform liability, recharge volume, and consumption.",
    liability: "Total liability",
    todayPurchase: "Today purchase",
    todaySold: "Today credits sold",
    todayCaptured: "Today captured",
    bonus: "Lifetime bonus",
    refunded: "Lifetime refunded",
    conversion: "Today earning conversion",
    wallets: "Active wallets",
    recentOrders: "Recent purchase orders",
    recentTransactions: "Recent credit transactions",
    packages: "Manage packages",
    userWallets: "User wallets"
  },
  zh: {
    title: "Credits 总览",
    subtitle: "平台积分负债、充值与消耗概览。",
    liability: "平台总负债",
    todayPurchase: "今日充值金额",
    todaySold: "今日售出 Credits",
    todayCaptured: "今日消耗 Credits",
    bonus: "累计赠送",
    refunded: "累计退款",
    conversion: "今日收益兑换",
    wallets: "活跃钱包数",
    recentOrders: "最近充值订单",
    recentTransactions: "最近积分流水",
    packages: "套餐管理",
    userWallets: "用户钱包"
  }
} as const;

export default async function AdminCreditsOverviewPage() {
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const user = await getAdminSessionUser();
  const [overview, orders, transactions] = user
    ? await Promise.all([
        adminCreditService.getOverview(user),
        adminCreditService.listRecentOrders(user, 10),
        adminCreditService.listRecentTransactions(user, 12)
      ])
    : [
        {
          todayPurchaseMinor: 0,
          todayCreditsSold: 0,
          todayCreditsCaptured: 0,
          totalLiability: 0,
          totalBonus: 0,
          totalRefunded: 0,
          conversionMinorToday: 0,
          walletCount: 0
        },
        [],
        []
      ];

  const stats = [
    { label: t.liability, value: overview.totalLiability.toLocaleString() },
    { label: t.todayPurchase, value: formatCurrency(overview.todayPurchaseMinor / 100, locale) },
    { label: t.todaySold, value: overview.todayCreditsSold.toLocaleString() },
    { label: t.todayCaptured, value: overview.todayCreditsCaptured.toLocaleString() },
    { label: t.bonus, value: overview.totalBonus.toLocaleString() },
    { label: t.refunded, value: overview.totalRefunded.toLocaleString() },
    { label: t.conversion, value: formatCurrency(overview.conversionMinorToday / 100, locale) },
    { label: t.wallets, value: overview.walletCount.toLocaleString() }
  ];

  return (
    <AdminPageShell locale={locale} title={t.title} subtitle={t.subtitle}>
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href={withLocale(adminPortalRoutes.creditsPackages, locale)}
          className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700"
        >
          {t.packages}
        </Link>
        <Link
          href={withLocale(adminPortalRoutes.creditsPricing, locale)}
          className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700"
        >
          {locale === "zh" ? "模型计费规则" : "Pricing rules"}
        </Link>
        <Link
          href={withLocale(adminPortalRoutes.creditsAiModels, locale)}
          className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700"
        >
          {locale === "zh" ? "AI 模型商城" : "AI models"}
        </Link>
        <Link
          href={withLocale(adminPortalRoutes.creditsWallets, locale)}
          className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700"
        >
          {t.userWallets}
        </Link>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-zinc-200/80 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-950">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-0">
            <div className="border-b border-zinc-100 px-4 py-3 text-sm font-medium text-zinc-900">
              {t.recentOrders}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="text-xs">{order.user.email}</TableCell>
                    <TableCell className="text-xs">{order.status}</TableCell>
                    <TableCell className="text-xs tabular-nums">
                      {order.credits + order.bonusCredits}
                    </TableCell>
                    <TableCell className="text-xs tabular-nums">
                      {formatCurrency(order.amountMinor / 100, locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-0">
            <div className="border-b border-zinc-100 px-4 py-3 text-sm font-medium text-zinc-900">
              {t.recentTransactions}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-xs">{tx.user.email}</TableCell>
                    <TableCell className="text-xs">{tx.type}</TableCell>
                    <TableCell className="text-xs tabular-nums">{tx.amount}</TableCell>
                    <TableCell className="text-xs tabular-nums">{tx.balanceAfter}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminPageShell>
  );
}
