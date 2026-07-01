import Link from "next/link";
import { LineChart } from "lucide-react";
import { approveOnboardingAction, rejectOnboardingAction } from "@/app/onboarding-actions";
import { AdminOverviewDashboard } from "@/components/studioos/admin-overview-dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { adminDashboardService } from "@/features/admin/dashboard/admin-dashboard.service";
import { adminService } from "@/features/admin/admin.service";
import { getSessionUser } from "@/features/auth/session.service";
import { isPrismaAdminRole } from "@/lib/auth/route-access";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";

const copy = {
  en: {
    eyebrow: "StudioOS Admin",
    title: "Platform overview",
    analytics: "Analytics dashboard",
    onboarding: "Studio applications",
    onboardingEmpty: "No studio applications yet.",
    approve: "Approve",
    reject: "Reject",
    pendingApps: "Pending",
    signIn: "Sign in as admin to view the Prisma overview."
  },
  zh: {
    eyebrow: "StudioOS 管理后台",
    title: "平台总览",
    analytics: "分析仪表盘",
    onboarding: "创作者入驻申请",
    onboardingEmpty: "暂无入驻申请。",
    approve: "通过",
    reject: "拒绝",
    pendingApps: "待审核",
    signIn: "请使用管理员账号登录以查看 Prisma 总览。"
  }
};

async function loadPendingApplications() {
  try {
    const { listApplications } = await import("@/lib/onboarding-service");
    return await listApplications("pending");
  } catch {
    return [];
  }
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const t = copy[locale];
  const sessionUser = await getSessionUser();
  const isAdmin = sessionUser ? isPrismaAdminRole(sessionUser.role) : false;
  const overview = isAdmin && sessionUser
    ? await adminDashboardService.getOverviewPage(sessionUser)
    : null;
  const opsPreview =
    isAdmin && sessionUser
      ? await adminService.getOpsPreview(sessionUser)
      : { openDisputes: [], recentAudit: [], recentCampaigns: [] };
  const pendingApplications = await loadPendingApplications();

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{t.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t.title}</h1>
        </div>
        <Button asChild variant="outline">
          <Link href={withLocale(adminPortalRoutes.analytics, locale)}>
            <LineChart className="h-4 w-4" /> {t.analytics}
          </Link>
        </Button>
      </div>

      <div className="mt-8">
        {overview ? (
          <AdminOverviewDashboard locale={locale} overview={overview} disputes={opsPreview.openDisputes} />
        ) : (
          <p className="text-sm text-zinc-500">{t.signIn}</p>
        )}
      </div>

      {pendingApplications.length > 0 ? (
        <Card className="mt-8 border-zinc-200/80 shadow-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">{t.onboarding}</h2>
              <Badge variant="warning">
                {t.pendingApps}: {pendingApplications.length}
              </Badge>
            </div>
            <div className="mt-5 space-y-4">
              {pendingApplications.map((application) => (
                <div key={application.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium">{application.studio_name}</p>
                      <p className="mt-1 text-sm text-zinc-500">{application.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <form action={approveOnboardingAction}>
                        <input type="hidden" name="lang" value={locale} />
                        <input type="hidden" name="application_id" value={application.id} />
                        <Button type="submit" size="sm">
                          {t.approve}
                        </Button>
                      </form>
                      <form action={rejectOnboardingAction}>
                        <input type="hidden" name="lang" value={locale} />
                        <input type="hidden" name="application_id" value={application.id} />
                        <Button type="submit" size="sm" variant="outline">
                          {t.reject}
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
