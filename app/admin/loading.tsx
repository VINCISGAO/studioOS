import { AdminOverviewLoader } from "@/components/studioos/admin-overview-loader";
import { AdminOverviewSkeleton } from "@/components/studioos/admin-overview-skeleton";
import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { getAppUiLocale } from "@/lib/app-language";

const copy = {
  en: { title: "Platform overview", subtitle: "Loading operations snapshot…" },
  zh: { title: "平台总览", subtitle: "正在加载运营快照…" }
};

export default async function AdminLoading() {
  const locale = await getAppUiLocale();
  const t = copy[locale];

  return (
    <AdminPageShell locale={locale} title={t.title} subtitle={t.subtitle}>
      <AdminOverviewSkeleton />
    </AdminPageShell>
  );
}
