import { getAppUiLocale } from "@/lib/app-language";
import { AdminAnalyticsDashboard } from "@/components/studioos/admin-analytics-dashboard";
import { AdminPageActionLink, AdminPageShell } from "@/components/studioos/admin-page-shell";
import { adminDashboardService } from "@/features/admin/dashboard/admin-dashboard.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";

const copy = {
  en: {
    title: "Analytics dashboard",
    subtitle: "Database-backed platform metrics with review and settlement timing.",
    back: "Back to overview",
    signInRequired: "Sign in as admin to view metrics."
  },
  zh: {
    title: "分析仪表盘",
    subtitle: "数据库驱动的平台指标，含审片与结算时长。",
    back: "返回总览",
    signInRequired: "请先登录管理员账号查看指标。"
  }
} as const;

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const user = await getAdminSessionUser();
  const metrics = user ? await adminDashboardService.getMetrics(user) : null;

  return (
    <AdminPageShell
      locale={locale}
      title={t.title}
      subtitle={t.subtitle}
      actions={
        <AdminPageActionLink href={withLocale(adminPortalRoutes.dashboard, locale)}>
          ← {t.back}
        </AdminPageActionLink>
      }
    >
      {metrics ? (
        <AdminAnalyticsDashboard locale={locale} metrics={metrics} />
      ) : (
        <p className="text-sm text-zinc-500">{t.signInRequired}</p>
      )}
    </AdminPageShell>
  );
}
