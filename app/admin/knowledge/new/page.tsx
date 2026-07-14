import { AdminKnowledgeEditorPanel } from "@/components/studioos/admin-knowledge-editor-panel";
import { getAppUiLocale } from "@/lib/app-language";
import { KNOWLEDGE_EDITOR_MAX_WIDTH } from "@/lib/knowledge/knowledge-editor.constants";
import { cn } from "@/lib/utils";

export default async function AdminKnowledgeNewPage() {
  const locale = await getAppUiLocale();
  return (
    <div className={cn(KNOWLEDGE_EDITOR_MAX_WIDTH, "mx-auto w-full px-4 sm:px-6")}>
      <AdminKnowledgeEditorPanel locale={locale} />
    </div>
  );
}
