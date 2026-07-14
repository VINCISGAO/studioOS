import { MarketingDocsLucienHost } from "@/components/marketing/docs/marketing-docs-lucien-host";
import { KnowledgeCenterHeader } from "@/components/knowledge-center/knowledge-center-header";
import type { KnowledgePathPrefix } from "@/features/knowledge-center/knowledge-center.constants";
import type { Locale } from "@/lib/i18n";

export function KnowledgeCenterShell({
  locale,
  pathPrefix,
  children
}: {
  locale: Locale;
  pathPrefix: KnowledgePathPrefix;
  children: React.ReactNode;
}) {
  return (
    <MarketingDocsLucienHost locale={locale}>
      <div className="min-h-screen bg-[#fafafa]">
        <KnowledgeCenterHeader locale={locale} pathPrefix={pathPrefix} />
        {children}
      </div>
    </MarketingDocsLucienHost>
  );
}
