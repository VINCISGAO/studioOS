import { Suspense } from "react";
import { AdminOverviewDashboard } from "@/components/studioos/admin-overview-dashboard";
import { AdminOverviewSkeleton } from "@/components/studioos/admin-overview-skeleton";
import { validateAdminSession } from "@/features/admin/auth/admin-auth.service";
import { adminDashboardService } from "@/features/admin/dashboard/admin-dashboard.service";
import type { AuthUser } from "@/features/auth/permission.service";
import type { Locale } from "@/lib/i18n";
import { logger } from "@/lib/core/logger";

function toAuthUser(profile: NonNullable<Awaited<ReturnType<typeof validateAdminSession>>>): AuthUser {
  return {
    id: profile.id,
    role: "ADMIN"
  };
}

async function AdminOverviewSection({ locale }: { locale: Locale }) {
  try {
    const profile = await validateAdminSession();
    if (!profile) {
      return null;
    }

    const overview = await adminDashboardService.getOverviewPage(toAuthUser(profile));
    return <AdminOverviewDashboard locale={locale} overview={overview} disputes={[]} />;
  } catch (error) {
    logger.error("admin.overview.load_failed", {
      service: "AdminOverviewLoader",
      error: error instanceof Error ? error.message : String(error)
    });
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        {locale === "zh"
          ? "平台总览暂时无法加载。请检查数据库连接后重试。"
          : "Overview is temporarily unavailable. Check the database connection and retry."}
      </div>
    );
  }
}

export function AdminOverviewLoader({ locale }: { locale: Locale }) {
  return (
    <Suspense fallback={<AdminOverviewSkeleton />}>
      <AdminOverviewSection locale={locale} />
    </Suspense>
  );
}
