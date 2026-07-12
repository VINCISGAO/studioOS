import { getAppUiLocale } from "@/lib/app-language";
import { Database, LineChart } from "lucide-react";
import { AdminOverviewLoader } from "@/components/studioos/admin-overview-loader";
import { AdminPageActionLink, AdminPageShell } from "@/components/studioos/admin-page-shell";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";

const copy = {
  en: {
    title: "Platform overview",
    subtitle: "Operations snapshot across campaigns, escrow, settlements, and platform bindings.",
    analytics: "Analytics",
    database: "Database"
  },
  zh: {
    title: "平台总览",
    subtitle: "活动、托管、结算与平台绑定关系的运营快照。",
    analytics: "分析",
    database: "数据库"
  }
} as const;

export default async function AdminPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();
  const t = copy[locale];

  return (
    <AdminPageShell
      locale={locale}
      title={t.title}
      subtitle={t.subtitle}
      actions={
        <>
          <AdminPageActionLink href="/admin/database">
            <Database className="h-4 w-4" />
            {t.database}
          </AdminPageActionLink>
          <AdminPageActionLink href={withLocale(adminPortalRoutes.analytics, locale)} variant="primary">
            <LineChart className="h-4 w-4" />
            {t.analytics}
          </AdminPageActionLink>
        </>
      }
    >
      <AdminOverviewLoader locale={locale} />
    </AdminPageShell>
  );
}
