import Link from "next/link";
import { OpenMarketingLucienButton } from "@/components/marketing/docs/open-marketing-lucien-button";
import {
  buildKnowledgeArticlePath,
  type KnowledgePathPrefix
} from "@/features/knowledge-center/knowledge-center.constants";
import type { KnowledgeHomeArticleCardDto } from "@/features/knowledge-center/knowledge-center.types";
import { knowledgeCenterHomeCopy } from "@/lib/knowledge/knowledge-center-home-copy";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

function formatShortDate(locale: Locale, value: string) {
  return new Date(value).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

function latestTagClass(category: string | null) {
  const normalized = (category ?? "").toLowerCase();
  if (normalized.includes("help")) return "bg-sky-50 text-sky-700";
  if (normalized.includes("workflow") || normalized.includes("guide")) return "bg-violet-50 text-violet-700";
  if (normalized.includes("case") || normalized.includes("brand")) return "bg-amber-50 text-amber-700";
  return "bg-zinc-100 text-zinc-600";
}

export function KnowledgeCenterSidebar({
  locale,
  pathPrefix,
  articles
}: {
  locale: Locale;
  pathPrefix: KnowledgePathPrefix;
  articles: KnowledgeHomeArticleCardDto[];
}) {
  const copy = knowledgeCenterHomeCopy(locale);
  const latest = [...articles]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  return (
    <aside id="latest" className="w-full shrink-0 space-y-3 sm:space-y-4 lg:w-[300px]">
      <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm sm:rounded-2xl sm:p-4">
        <h2 className="text-base font-semibold text-zinc-950 sm:text-lg">{copy.latestTitle}</h2>
        {latest.length ? (
          <ul className="mt-3 space-y-2.5 sm:space-y-3">
            {latest.map((article) => (
              <li key={article.id}>
                <Link
                  href={buildKnowledgeArticlePath(pathPrefix, article.slug)}
                  className="group block rounded-xl px-1 py-1 transition hover:bg-zinc-50"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-5 text-zinc-900 group-hover:text-violet-700">
                        {article.title}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-xs text-zinc-400">{formatShortDate(locale, article.updated_at)}</span>
                        {article.category_name ? (
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              latestTagClass(article.category_slug ?? article.category_name)
                            )}
                          >
                            {article.category_name}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">{copy.emptyLatest}</p>
        )}
      </div>

      <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-3.5 shadow-sm sm:rounded-2xl sm:p-4">
        <p className="text-xs leading-5 text-zinc-600 sm:text-sm sm:leading-6">{copy.supportTitle}</p>
        <OpenMarketingLucienButton className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl bg-violet-600 text-sm font-semibold text-white transition hover:bg-violet-700 sm:mt-4">
          {copy.supportLucienButton}
        </OpenMarketingLucienButton>
      </div>
    </aside>
  );
}
