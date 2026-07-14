import { AdminKnowledgeEditorPanel } from "@/components/studioos/admin-knowledge-editor-panel";
import { KNOWLEDGE_EDITOR_MAX_WIDTH } from "@/lib/knowledge/knowledge-editor.constants";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function AdminKnowledgeNewEditorPage({ locale }: { locale: Locale }) {
  return (
    <div className={cn(KNOWLEDGE_EDITOR_MAX_WIDTH, "mx-auto w-full px-4 sm:px-6")}>
      <AdminKnowledgeEditorPanel locale={locale} />
    </div>
  );
}
