import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { AdminKnowledgeListPanel } from "@/components/studioos/admin-knowledge-list-panel";
import { getAppUiLocale } from "@/lib/app-language";

const copy = {
  en: {
    title: "Knowledge Center",
    subtitle: "Official VINCIS knowledge for SEO, AI assistants, Help Center, and Lucien."
  },
  zh: {
    title: "知识中心",
    subtitle: "VINCIS 官方知识库 — 服务 Google / 百度 SEO、AI 助手、帮助中心与 Lucien。"
  }
};

export default async function AdminKnowledgePage() {
  const locale = await getAppUiLocale();
  const t = copy[locale];
  return (
    <AdminPageShell locale={locale} title={t.title} subtitle={t.subtitle}>
      <AdminKnowledgeListPanel locale={locale} />
    </AdminPageShell>
  );
}
