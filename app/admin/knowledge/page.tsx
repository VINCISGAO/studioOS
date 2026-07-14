import { AdminKnowledgeListPanel } from "@/components/studioos/admin-knowledge-list-panel";
import { getAppUiLocale } from "@/lib/app-language";

export default async function AdminKnowledgePage() {
  const locale = await getAppUiLocale();
  return (
    <div className="w-full min-w-0">
      <AdminKnowledgeListPanel locale={locale} />
    </div>
  );
}
