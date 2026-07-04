import Link from "next/link";
import { AdminAnalyticsDashboard } from "@/components/studioos/admin-analytics-dashboard";
import { adminDashboardService } from "@/features/admin/dashboard/admin-dashboard.service";
import { getAdminSessionUser } from "@/features/admin/auth/admin-auth.service";
import { Button } from "@/components/ui/button";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const user = await getAdminSessionUser();
  const metrics = user ? await adminDashboardService.getMetrics(user) : null;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{locale === "zh" ? "分析仪表盘" : "Analytics dashboard"}</h1>
          <p className="mt-2 text-sm text-zinc-500">
            {locale === "zh" ? "Prisma 驱动的平台指标。" : "Prisma-backed platform metrics."}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={withLocale(adminPortalRoutes.dashboard, locale)}>
            {locale === "zh" ? "返回总览" : "Back to overview"}
          </Link>
        </Button>
      </div>
      <div className="mt-8">
        {metrics ? (
          <AdminAnalyticsDashboard locale={locale} metrics={metrics} />
        ) : (
          <p className="text-sm text-zinc-500">Sign in as admin to view metrics.</p>
        )}
      </div>
    </div>
  );
}
