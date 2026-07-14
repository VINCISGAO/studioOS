import { AdminPageShell } from "@/components/studioos/admin-page-shell";
import { AdminKnowledgeSeoDashboardPanel } from "@/components/studioos/admin-knowledge-seo-dashboard-panel";
import { getAppUiLocale } from "@/lib/app-language";
import { KNOWLEDGE_EDITOR_MAX_WIDTH } from "@/lib/knowledge/knowledge-editor.constants";
import { cn } from "@/lib/utils";

export default async function AdminKnowledgeSeoDashboardPage() {
  const locale = await getAppUiLocale();
  const zh = locale === "zh";
  return (
    <AdminPageShell
      locale={locale}
      title={zh ? "AI SEO Dashboard" : "AI SEO Dashboard"}
      subtitle={zh ? "实时查看 Knowledge Center 的 SEO、AI 可读性与分发健康状态。" : "Live SEO, AI-readability, and distribution health for the Knowledge Center."}
      className={cn(KNOWLEDGE_EDITOR_MAX_WIDTH)}
    >
      <AdminKnowledgeSeoDashboardPanel locale={locale} />
    </AdminPageShell>
  );
}
