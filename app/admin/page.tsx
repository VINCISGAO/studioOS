import { getAppUiLocale } from "@/lib/app-language";
import { AdminOverviewLoader, AdminPageHeader } from "@/components/studioos/admin-overview-loader";
import { type SearchParams } from "@/lib/i18n";

const copy = {
  en: { title: "Platform overview", analytics: "Analytics dashboard" },
  zh: { title: "平台总览", analytics: "分析仪表盘" }
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();
  const t = copy[locale];

  return (
    <div>
      <AdminPageHeader locale={locale} title={t.title} analyticsLabel={t.analytics} />
      <AdminOverviewLoader locale={locale} />
    </div>
  );
}
