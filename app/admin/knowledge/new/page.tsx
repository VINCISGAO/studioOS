import { AdminKnowledgeNewEditorPage } from "@/components/studioos/admin-knowledge-new-editor-page";
import { getAppUiLocale } from "@/lib/app-language";

export default async function AdminKnowledgeNewPage() {
  const locale = await getAppUiLocale();
  return <AdminKnowledgeNewEditorPage locale={locale} />;
}
