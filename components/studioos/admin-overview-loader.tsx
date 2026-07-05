import { Suspense } from "react";
import Link from "next/link";
import { Database, Languages, LineChart } from "lucide-react";
import { AdminOverviewDashboard } from "@/components/studioos/admin-overview-dashboard";
import { AdminOverviewSkeleton } from "@/components/studioos/admin-overview-skeleton";
import { validateAdminSession } from "@/features/admin/auth/admin-auth.service";
import { adminDashboardService } from "@/features/admin/dashboard/admin-dashboard.service";
import type { AuthUser } from "@/features/auth/permission.service";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";

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

export function AdminPageHeader({
  locale,
  title,
  analyticsLabel
}: {
  locale: Locale;
  title: string;
  analyticsLabel: string;
}) {
  const eyebrow = locale === "zh" ? "StudioOS 管理后台" : "StudioOS Admin";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
      </div>
      <div className="flex gap-2">
        <Link
          href="/admin/database"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium hover:bg-zinc-50"
        >
          <Database className="h-4 w-4" /> DB
        </Link>
        <Link
          href={withLocale(adminPortalRoutes.languages, locale)}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium hover:bg-zinc-50"
        >
          <Languages className="h-4 w-4" /> i18n
        </Link>
        <Link
          href={withLocale(adminPortalRoutes.analytics, locale)}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium hover:bg-zinc-50"
        >
          <LineChart className="h-4 w-4" /> {analyticsLabel}
        </Link>
      </div>
    </div>
  );
}
