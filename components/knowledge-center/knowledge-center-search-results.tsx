import Link from "next/link";
import {
  buildKnowledgeArticlePath,
  type KnowledgePathPrefix
} from "@/features/knowledge-center/knowledge-center.constants";
import type { KnowledgeArticleListItemDto } from "@/features/knowledge-center/knowledge-center.types";
import { knowledgeCenterHomeCopy } from "@/lib/knowledge/knowledge-center-home-copy";
import type { MarketingLocale } from "@/lib/i18n";

export function KnowledgeCenterSearchResults({
  locale,
  pathPrefix,
  query,
  results
}: {
  locale: MarketingLocale;
  pathPrefix: KnowledgePathPrefix;
  query: string;
  results: KnowledgeArticleListItemDto[];
}) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return null;

  const copy = knowledgeCenterHomeCopy(locale);
  const heading = copy.searchResultsHeading(trimmedQuery);
  const emptyCopy = copy.searchResultsEmpty;

  return (
    <section className="border-b border-zinc-200/70 bg-white px-3 py-6 sm:px-5 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-zinc-950 sm:text-2xl">{heading}</h2>
        <p className="mt-1 text-sm text-zinc-500">{copy.searchResultsCount(results.length)}</p>

        {results.length ? (
          <div className="mt-5 space-y-3">
            {results.map((item) => (
              <Link
                key={item.id}
                href={buildKnowledgeArticlePath(pathPrefix, item.slug)}
                className="block rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm transition hover:border-violet-200 hover:shadow-md"
              >
                <h3 className="text-lg font-semibold text-zinc-950">{item.title}</h3>
                <p className="mt-1 text-sm text-zinc-500">{item.category}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm text-zinc-500">{emptyCopy}</p>
        )}
      </div>
    </section>
  );
}
