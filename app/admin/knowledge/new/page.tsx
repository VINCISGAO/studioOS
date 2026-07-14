import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { AdminKnowledgeEditorPanel } from "@/components/studioos/admin-knowledge-editor-panel";
import { getAppUiLocale } from "@/lib/app-language";

const copy = {
  en: { title: "New Article", subtitle: "Create official VINCIS knowledge content." },
  zh: { title: "新建文章", subtitle: "创建 VINCIS 官方知识内容。" }
};

export default async function AdminKnowledgeNewPage() {
  const locale = await getAppUiLocale();
  const t = copy[locale];
  return (
    <AdminPageShell locale={locale} title={t.title} subtitle={t.subtitle}>
      <AdminKnowledgeEditorPanel locale={locale} />
    </AdminPageShell>
  );
}
