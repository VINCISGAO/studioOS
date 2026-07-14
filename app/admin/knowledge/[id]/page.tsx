import { notFound } from "next/navigation";
import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { AdminKnowledgeEditorPanel } from "@/components/studioos/admin-knowledge-editor-panel";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import { getAppUiLocale } from "@/lib/app-language";

type Props = { params: Promise<{ id: string }> };

export default async function AdminKnowledgeEditPage({ params }: Props) {
  const [{ id }, locale] = await Promise.all([params, getAppUiLocale()]);
  const article = await knowledgeCenterService.getById(id);
  if (!article) notFound();

  const zh = locale === "zh";
  return (
    <AdminPageShell
      locale={locale}
      title={article.translations[0]?.title ?? article.slug}
      subtitle={zh ? "编辑官方知识文章。" : "Edit official knowledge article."}
    >
      <AdminKnowledgeEditorPanel locale={locale} articleId={id} initial={article} />
    </AdminPageShell>
  );
}
