import { notFound, permanentRedirect } from "next/navigation";
import { AdminKnowledgeEditorPanel } from "@/components/studioos/admin-knowledge-editor-panel";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import { getAppUiLocale } from "@/lib/app-language";
import { KNOWLEDGE_EDITOR_MAX_WIDTH } from "@/lib/knowledge/knowledge-editor.constants";
import { resolveKnowledgeAdminReservedPath } from "@/lib/studioos/knowledge-admin-routes";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function AdminKnowledgeEditPage({ params }: Props) {
  const [{ id }, locale] = await Promise.all([params, getAppUiLocale()]);
  const reservedPath = resolveKnowledgeAdminReservedPath(id);
  if (reservedPath) permanentRedirect(reservedPath);

  const article = await knowledgeCenterService.getById(id);
  if (!article) notFound();

  return (
    <div className={cn(KNOWLEDGE_EDITOR_MAX_WIDTH, "mx-auto w-full px-4 sm:px-6")}>
      <AdminKnowledgeEditorPanel locale={locale} articleId={id} initial={article} />
    </div>
  );
}
