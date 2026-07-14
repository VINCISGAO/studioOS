import { KnowledgeCenterFeatured } from "@/components/knowledge-center/knowledge-center-featured";
import { KnowledgeCenterHero } from "@/components/knowledge-center/knowledge-center-hero";
import { KnowledgeCenterSidebar } from "@/components/knowledge-center/knowledge-center-sidebar";
import { KnowledgeCenterTopics } from "@/components/knowledge-center/knowledge-center-topics";
import type { KnowledgePathPrefix } from "@/features/knowledge-center/knowledge-center.constants";
import type { KnowledgeHomeArticleCardDto } from "@/features/knowledge-center/knowledge-center.types";
import type { Locale } from "@/lib/i18n";

export function KnowledgeCenterHomePage({
  locale,
  pathPrefix,
  languageCode,
  articles,
  categoryCounts
}: {
  locale: Locale;
  pathPrefix: KnowledgePathPrefix;
  languageCode: string;
  articles: KnowledgeHomeArticleCardDto[];
  categoryCounts: Record<string, number>;
}) {
  return (
    <>
      <KnowledgeCenterHero locale={locale} languageCode={languageCode} />
      <KnowledgeCenterTopics locale={locale} pathPrefix={pathPrefix} counts={categoryCounts} />
      <section className="border-t border-zinc-200/70 bg-[#fafafa] px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:gap-6 lg:flex-row lg:items-start lg:gap-8">
          <KnowledgeCenterFeatured locale={locale} pathPrefix={pathPrefix} articles={articles} />
          <KnowledgeCenterSidebar locale={locale} pathPrefix={pathPrefix} articles={articles} />
        </div>
      </section>
    </>
  );
}
