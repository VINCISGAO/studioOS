import Link from "next/link";
import {
  buildKnowledgeCategoryPath,
  type KnowledgePathPrefix
} from "@/features/knowledge-center/knowledge-center.constants";
import { knowledgeCenterHomeCopy } from "@/lib/knowledge/knowledge-center-home-copy";
import type { MarketingLocale } from "@/lib/i18n";

type KnowledgeCenterTopicsProps = {
  locale: MarketingLocale;
  pathPrefix: KnowledgePathPrefix;
  counts: Record<string, number>;
};

export function KnowledgeCenterTopics({ locale, pathPrefix, counts }: KnowledgeCenterTopicsProps) {
  const copy = knowledgeCenterHomeCopy(locale);

  return (
    <section className="px-3 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-zinc-950 sm:text-2xl">{copy.topicsTitle}</h2>
          <Link
            href={buildKnowledgeCategoryPath(pathPrefix, copy.topics[0]?.slug ?? "ai")}
            className="shrink-0 text-xs font-medium text-violet-700 transition hover:text-violet-900 sm:text-sm"
          >
            {copy.topicsViewAll} →
          </Link>
        </div>

        {/* Mobile: 2×3 readable grid. sm+: strict 3×2 */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-6 sm:grid-cols-3 sm:gap-4">
          {copy.topics.map((topic) => {
            const Icon = topic.icon;
            const count = counts[topic.slug] ?? 0;
            return (
              <Link
                key={topic.slug}
                href={buildKnowledgeCategoryPath(pathPrefix, topic.slug)}
                className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:border-violet-200 hover:shadow-md sm:rounded-2xl sm:p-5"
              >
                <div className="flex items-start gap-2 sm:items-center sm:gap-3">
                  <div
                    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11 sm:rounded-xl ${topic.iconClassName}`}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="min-w-0 text-[13px] font-semibold leading-[1.35] text-zinc-950 group-hover:text-violet-700 sm:text-lg sm:leading-snug">
                    {topic.title}
                  </h3>
                </div>
                <p className="mt-2 line-clamp-2 text-[11px] leading-[1.45] text-zinc-500 sm:mt-3 sm:line-clamp-none sm:text-sm sm:leading-6">
                  {topic.description}
                </p>
                <p className="mt-2 text-[10px] font-medium text-zinc-400 sm:mt-4 sm:text-xs">
                  {copy.articlesCount(count)}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
