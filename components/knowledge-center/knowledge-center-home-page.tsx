import { KnowledgeCenterFeatured } from "@/components/knowledge-center/knowledge-center-featured";
import { KnowledgeCenterHero } from "@/components/knowledge-center/knowledge-center-hero";
import { KnowledgeCenterSearchResults } from "@/components/knowledge-center/knowledge-center-search-results";
import { KnowledgeCenterSidebar } from "@/components/knowledge-center/knowledge-center-sidebar";
import { KnowledgeCenterTopics } from "@/components/knowledge-center/knowledge-center-topics";
import type { KnowledgePathPrefix } from "@/features/knowledge-center/knowledge-center.constants";
import type {
  KnowledgeArticleListItemDto,
  KnowledgeHomeArticleCardDto
} from "@/features/knowledge-center/knowledge-center.types";
import type { MarketingLocale } from "@/lib/i18n";
import { knowledgeCenterHomeCopy } from "@/lib/knowledge/knowledge-center-home-copy";

export function KnowledgeCenterHomePage({
  locale,
  pathPrefix,
  languageCode,
  articles,
  categoryCounts,
  searchQuery,
  searchResults
}: {
  locale: MarketingLocale;
  pathPrefix: KnowledgePathPrefix;
  languageCode: string;
  articles: KnowledgeHomeArticleCardDto[];
  categoryCounts: Record<string, number>;
  searchQuery?: string;
  searchResults?: KnowledgeArticleListItemDto[];
}) {
  const hasSearch = Boolean(searchQuery?.trim());

  return (
    <>
      <KnowledgeCenterHero locale={locale} languageCode={languageCode} />
      {hasSearch && searchResults ? (
        <KnowledgeCenterSearchResults
          locale={locale}
          pathPrefix={pathPrefix}
          query={searchQuery ?? ""}
          results={searchResults}
        />
      ) : null}
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
