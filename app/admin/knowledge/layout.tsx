import { KnowledgeAdminSubNav } from "@/components/studioos/knowledge-list/knowledge-admin-subnav";
import { getAppUiLocale } from "@/lib/app-language";

export default async function AdminKnowledgeLayout({ children }: { children: React.ReactNode }) {
  const locale = await getAppUiLocale();
  return (
    <>
      <KnowledgeAdminSubNav locale={locale} />
      {children}
    </>
  );
}
