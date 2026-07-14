import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { AdminKnowledgeCitationPanel } from "@/components/studioos/admin-knowledge-citation-panel";
import { getAppUiLocale } from "@/lib/app-language";

const copy = {
  en: { title: "AI Citation Monitor", subtitle: "Coverage, Lucien indexing, and topic gaps." },
  zh: { title: "AI 引用监控", subtitle: "覆盖度、Lucien 索引与主题空白。" }
};

export default async function AdminKnowledgeCitationsPage() {
  const locale = await getAppUiLocale();
  const t = copy[locale];
  return (
    <AdminPageShell locale={locale} title={t.title} subtitle={t.subtitle}>
      <AdminKnowledgeCitationPanel locale={locale} />
    </AdminPageShell>
  );
}
