import Link from "next/link";
import { Calendar, Clock3 } from "lucide-react";
import { KnowledgeCoverImage } from "@/components/knowledge/knowledge-cover-image";
import {
  buildKnowledgeArticlePath,
  buildKnowledgeIndexPath,
  type KnowledgePathPrefix
} from "@/features/knowledge-center/knowledge-center.constants";
import type { KnowledgeHomeArticleCardDto } from "@/features/knowledge-center/knowledge-center.types";
import { knowledgeCenterHomeCopy } from "@/lib/knowledge/knowledge-center-home-copy";
import type { MarketingLocale } from "@/lib/i18n";
import { knowledgeIntlLocale, knowledgeShortMonthLocale } from "@/lib/knowledge/knowledge-intl";

function formatArticleDate(locale: MarketingLocale, value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleDateString(knowledgeShortMonthLocale(locale), {
    year: "numeric",
    month: "short",
    day: "2-digit"
  });
}

function ArticleCover({ article }: { article: KnowledgeHomeArticleCardDto }) {
  if (article.cover_image_url) {
    return (
      <KnowledgeCoverImage
        coverUrl={article.cover_image_url}
        alt={article.title}
        className="h-full w-full object-cover"
      />
    );
  }

  const label = article.category_name ?? article.title.slice(0, 2);
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-100 via-white to-sky-100 text-sm font-semibold text-violet-700">
      {label}
    </div>
  );
}

export function KnowledgeCenterFeatured({
  locale,
  pathPrefix,
  articles
}: {
  locale: MarketingLocale;
  pathPrefix: KnowledgePathPrefix;
  articles: KnowledgeHomeArticleCardDto[];
}) {
  const copy = knowledgeCenterHomeCopy(locale);
  const featured = articles.slice(0, 4);

  return (
    <section className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-zinc-950 sm:text-xl">{copy.featuredTitle}</h2>
        <Link
          href={buildKnowledgeIndexPath(pathPrefix)}
          className="text-sm font-medium text-violet-700 transition hover:text-violet-900"
        >
          {copy.featuredViewAll} →
        </Link>
      </div>

      {featured.length ? (
        <div className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
          {featured.map((article) => {
            const tags = article.tags.length
              ? article.tags.slice(0, 2)
              : article.category_name
                ? [article.category_name]
                : [];
            return (
              <Link
                key={article.id}
                href={buildKnowledgeArticlePath(pathPrefix, article.slug)}
                className="group flex gap-3 rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-violet-200 hover:shadow-sm sm:gap-4 sm:p-4"
              >
                <div className="h-[4.5rem] w-[5.5rem] shrink-0 overflow-hidden rounded-lg bg-zinc-100 sm:h-24 sm:w-32 sm:rounded-xl">
                  <ArticleCover article={article} />
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <h3 className="text-sm font-semibold leading-snug text-zinc-950 group-hover:text-violet-700 sm:text-base">
                    {article.title}
                  </h3>
                  {article.excerpt ? (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500 sm:mt-1.5 sm:text-sm sm:leading-6">
                      {article.excerpt}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 sm:px-2.5 sm:text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-zinc-400 sm:gap-4 sm:text-xs">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatArticleDate(locale, article.published_at ?? article.updated_at)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {article.reading_time_minutes} {copy.minRead}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-white px-5 py-10 text-center text-sm text-zinc-500">
          {copy.emptyFeatured}
        </p>
      )}
    </section>
  );
}
