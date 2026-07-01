import Link from "next/link";
import {
  ArrowDownToLine,
  Bell,
  CircleCheck,
  CreditCard,
  Megaphone,
  Scale,
  Upload,
  Wallet
} from "lucide-react";
import { AdminOverviewGmvChart } from "@/components/studioos/admin-overview-gmv-chart";
import { AdminStatusDonut } from "@/components/studioos/admin-status-donut";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminOverviewPageData } from "@/features/admin/dashboard/admin-dashboard.types";
import type { AdminDisputeView } from "@/features/admin/admin.types";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { formatCurrency, formatDate } from "@/lib/utils";

const copy = {
  en: {
    welcome: "Welcome back, Admin",
    dateRange: "Last 14 days",
    growth: "vs prior 14 days",
    kpis: {
      gmv: "GMV",
      revenue: "Platform revenue",
      fees: "Platform fees",
      escrowHeld: "Escrow held",
      settlementPending: "Settlement pending",
      withdrawals: "Pending withdrawals",
      disputes: "Open disputes",
      active: "Active campaigns"
    },
    gmvTrend: "GMV trend",
    recentActivity: "Recent activity",
    todos: "Operations queue",
    latestCampaigns: "Latest campaigns",
    statusDistribution: "Campaign status",
    quickActions: "Quick actions",
    todoLabels: {
      pendingReview: "Pending review",
      pendingSettlement: "Pending settlement",
      pendingWithdrawals: "Pending withdrawals",
      disputes: "Disputes",
      failedNotifications: "Failed notifications"
    },
    table: ["Campaign", "Advertiser", "Creator", "Budget", "Status", "Updated"],
    emptyActivity: "No recent activity.",
    emptyCampaigns: "No campaigns yet.",
    openDisputes: "Open disputes preview",
    viewAll: "View all"
  },
  zh: {
    welcome: "欢迎回来，Admin 👋",
    dateRange: "近 14 日",
    growth: "对比前 14 日",
    kpis: {
      gmv: "GMV",
      revenue: "平台收入",
      fees: "平台手续费",
      escrowHeld: "托管冻结",
      settlementPending: "待结算金额",
      withdrawals: "待处理提现",
      disputes: "待处理争议",
      active: "活跃活动"
    },
    gmvTrend: "GMV 趋势",
    recentActivity: "最近活动",
    todos: "运营待办",
    latestCampaigns: "最新活动",
    statusDistribution: "活动状态分布",
    quickActions: "快捷入口",
    todoLabels: {
      pendingReview: "待审片",
      pendingSettlement: "待结算",
      pendingWithdrawals: "待提现",
      disputes: "争议",
      failedNotifications: "通知失败"
    },
    table: ["活动", "广告主", "创作者", "预算", "状态", "更新"],
    emptyActivity: "暂无最近活动。",
    emptyCampaigns: "暂无活动。",
    openDisputes: "待处理争议预览",
    viewAll: "查看全部"
  }
};

const quickLinks = [
  { href: adminPortalRoutes.settlements, en: "Settlements", zh: "结算队列" },
  { href: adminPortalRoutes.withdrawals, en: "Withdrawals", zh: "提现审批" },
  { href: adminPortalRoutes.ledger, en: "Ledger", zh: "账本" },
  { href: adminPortalRoutes.campaigns, en: "Campaigns", zh: "活动" },
  { href: adminPortalRoutes.notifications, en: "Notifications", zh: "通知中心" }
];

function activityIcon(action: string) {
  if (action.includes("payment") || action.includes("escrow")) return CreditCard;
  if (action.includes("withdrawal") || action.includes("wallet")) return Wallet;
  if (action.includes("settlement")) return ArrowDownToLine;
  if (action.includes("upload") || action.includes("version")) return Upload;
  if (action.includes("review") || action.includes("approved")) return CircleCheck;
  if (action.includes("dispute")) return Scale;
  if (action.includes("invitation")) return Megaphone;
  if (action.includes("notification")) return Bell;
  return Megaphone;
}

function computeGrowthPercent(points: AdminOverviewPageData["gmvTrend"]["day"]) {
  if (points.length < 14) return 0;
  const recent = points.slice(-7).reduce((sum, p) => sum + p.gmv, 0);
  const prior = points.slice(-14, -7).reduce((sum, p) => sum + p.gmv, 0);
  if (prior === 0) return recent > 0 ? 100 : 0;
  return Math.round(((recent - prior) / prior) * 100);
}

function TodoRow({ label, count, href, locale }: { label: string; count: number; href: string; locale: Locale }) {
  return (
    <Link
      href={withLocale(href, locale)}
      className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition hover:bg-zinc-50"
    >
      <span>{label}</span>
      <Badge variant={count > 0 ? "warning" : "outline"}>{count}</Badge>
    </Link>
  );
}

export function AdminOverviewDashboard({
  locale,
  overview,
  disputes
}: {
  locale: Locale;
  overview: AdminOverviewPageData;
  disputes: AdminDisputeView[];
}) {
  const t = copy[locale];
  const growth = computeGrowthPercent(overview.gmvTrend.day);

  const kpiCards = [
    { label: t.kpis.gmv, value: formatCurrency(overview.kpis.gmv) },
    { label: t.kpis.revenue, value: formatCurrency(overview.kpis.platformRevenue) },
    { label: t.kpis.fees, value: formatCurrency(overview.kpis.platformFees) },
    { label: t.kpis.escrowHeld, value: formatCurrency(overview.kpis.escrowHeld) },
    { label: t.kpis.settlementPending, value: formatCurrency(overview.kpis.settlementPending) },
    { label: t.kpis.withdrawals, value: String(overview.kpis.pendingWithdrawals) },
    { label: t.kpis.disputes, value: String(overview.kpis.disputesOpen) },
    { label: t.kpis.active, value: String(overview.kpis.activeCampaigns) }
  ];

  const todoItems = [
    { key: "pendingReview", href: adminPortalRoutes.campaigns, count: overview.todos.pendingReview },
    { key: "pendingSettlement", href: adminPortalRoutes.settlements, count: overview.todos.pendingSettlement },
    { key: "pendingWithdrawals", href: adminPortalRoutes.withdrawals, count: overview.todos.pendingWithdrawals },
    { key: "disputes", href: adminPortalRoutes.disputes, count: overview.todos.disputes },
    { key: "failedNotifications", href: adminPortalRoutes.notifications, count: overview.todos.failedNotifications }
  ] as const;

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t.welcome}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {t.dateRange}
            <span className="mx-2 text-zinc-300">·</span>
            <span className={growth >= 0 ? "text-emerald-600" : "text-red-600"}>
              {growth >= 0 ? "+" : ""}
              {growth}% {t.growth}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map(({ label, value }) => (
          <Card key={label} className="border-zinc-200/80 shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-6">
            <h2 className="font-semibold">{t.gmvTrend}</h2>
            <AdminOverviewGmvChart locale={locale} trend={overview.gmvTrend} />
          </CardContent>
        </Card>
        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{t.recentActivity}</h2>
              <Link href={withLocale(adminPortalRoutes.activityLog, locale)} className="text-sm text-zinc-500 hover:underline">
                {t.viewAll}
              </Link>
            </div>
            <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto">
              {overview.recentActivity.length ? (
                overview.recentActivity.map((item) => {
                  const Icon = activityIcon(item.action);
                  return (
                    <li key={item.id} className="flex gap-3 rounded-lg border p-3 text-sm">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium">{locale === "zh" ? item.labelZh : item.labelEn}</span>
                          <span className="shrink-0 text-xs text-zinc-500">{formatDate(item.createdAt)}</span>
                        </div>
                        <p className="mt-1 truncate text-xs text-zinc-500">{item.campaignTitle ?? item.campaignId}</p>
                      </div>
                    </li>
                  );
                })
              ) : (
                <p className="text-sm text-zinc-500">{t.emptyActivity}</p>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.34fr_1fr_0.34fr]">
        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-6">
            <h2 className="font-semibold">{t.todos}</h2>
            <div className="mt-4 space-y-2">
              {todoItems.map(({ key, href, count }) => (
                <TodoRow key={key} label={t.todoLabels[key]} count={count} href={href} locale={locale} />
              ))}
            </div>
            <h3 className="mt-6 text-sm font-semibold">{t.quickActions}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={withLocale(link.href, locale)}
                  className="rounded-full border px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  {locale === "zh" ? link.zh : link.en}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80 shadow-none lg:col-span-1">
          <CardContent className="p-0">
            <div className="border-b p-6">
              <h2 className="font-semibold">{t.latestCampaigns}</h2>
            </div>
            {overview.latestCampaigns.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {t.table.map((heading) => (
                      <TableHead key={heading}>{heading}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.latestCampaigns.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        <Link href={withLocale(adminPortalRoutes.campaignDetail(row.id), locale)} className="hover:underline">
                          {row.title}
                        </Link>
                      </TableCell>
                      <TableCell>{row.brandName ?? "—"}</TableCell>
                      <TableCell>{row.creatorName ?? "—"}</TableCell>
                      <TableCell>{formatCurrency(row.budget)}</TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} locale={locale} />
                      </TableCell>
                      <TableCell className="text-zinc-500">{formatDate(row.updatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="p-6 text-sm text-zinc-500">{t.emptyCampaigns}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-6">
            <h2 className="font-semibold">{t.statusDistribution}</h2>
            <div className="mt-4">
              <AdminStatusDonut locale={locale} buckets={overview.statusDistribution} />
            </div>
            {disputes.length ? (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-sm font-semibold">{t.openDisputes}</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {disputes.slice(0, 3).map((dispute) => (
                    <li key={dispute.id}>
                      <Link
                        href={withLocale(adminPortalRoutes.disputeDetail(dispute.id), locale)}
                        className="text-zinc-700 hover:underline"
                      >
                        {dispute.campaignTitle}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
