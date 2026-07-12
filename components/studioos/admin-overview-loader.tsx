import { Suspense } from "react";
import { AdminOverviewDashboard } from "@/components/studioos/admin-overview-dashboard";
import { AdminOverviewSkeleton } from "@/components/studioos/admin-overview-skeleton";
import { validateAdminSession } from "@/features/admin/auth/admin-auth.service";
import { adminDashboardService } from "@/features/admin/dashboard/admin-dashboard.service";
import type { AuthUser } from "@/features/auth/permission.service";
import type { Locale } from "@/lib/i18n";

function toAuthUser(profile: NonNullable<Awaited<ReturnType<typeof validateAdminSession>>>): AuthUser {
  return {
    id: profile.id,
    role: "ADMIN"
  };
}

async function AdminOverviewSection({ locale }: { locale: Locale }) {
  const profile = await validateAdminSession();
  if (!profile) {
    return null;
  }

  const overview = await adminDashboardService.getOverviewPage(toAuthUser(profile));
  return <AdminOverviewDashboard locale={locale} overview={overview} disputes={[]} />;
}

export function AdminOverviewLoader({ locale }: { locale: Locale }) {
  return (
    <Suspense fallback={<AdminOverviewSkeleton />}>
      <AdminOverviewSection locale={locale} />
    </Suspense>
  );
}
