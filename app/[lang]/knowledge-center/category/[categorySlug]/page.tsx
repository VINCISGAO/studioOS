import Link from "next/link";
import { KnowledgeCenterShell } from "@/components/knowledge-center/knowledge-center-shell";
import {
  buildKnowledgeArticlePath,
  buildKnowledgeIndexPath,
  knowledgeCodeForPathPrefix,
  type KnowledgePathPrefix
} from "@/features/knowledge-center/knowledge-center.constants";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import { knowledgeCenterHomeCopy } from "@/lib/knowledge/knowledge-center-home-copy";
import { toUiLocale } from "@/lib/app-language.shared";

type Props = { params: Promise<{ lang: string; categorySlug: string }> };

export default async function KnowledgeCategoryPage({ params }: Props) {
  const { lang, categorySlug } = await params;
  const languageCode = knowledgeCodeForPathPrefix(lang);
  const locale = toUiLocale(languageCode);
  const pathPrefix = lang as KnowledgePathPrefix;
  const copy = knowledgeCenterHomeCopy(locale);
  const categories = await knowledgeCenterService.listCategorySummaries(languageCode);
  const category = categories.find((item) => item.slug === categorySlug);
  const topic = copy.topics.find((item) => item.slug === categorySlug);
  const articles = await knowledgeCenterService.listPublishedByCategory(languageCode, categorySlug);

  const title = topic?.title ?? category?.name ?? categorySlug;
  const description = topic?.description ?? "";

  return (
    <KnowledgeCenterShell locale={locale} pathPrefix={pathPrefix}>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href={buildKnowledgeIndexPath(pathPrefix)}
          className="text-sm font-medium text-zinc-500 transition hover:text-violet-700"
        >
          {locale === "zh" ? "← 返回知识中心" : "← Back to Knowledge Center"}
        </Link>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-zinc-950">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-lg text-zinc-500">{description}</p> : null}
        <p className="mt-2 text-sm text-zinc-400">
          {copy.articlesCount(category?.count ?? articles.length)}
        </p>

        <div className="mt-10 space-y-3">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={buildKnowledgeArticlePath(pathPrefix, article.slug)}
              className="block rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm transition hover:border-violet-200 hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-zinc-950">{article.title}</h2>
              <p className="mt-1 text-sm text-zinc-500">{article.author_name}</p>
            </Link>
          ))}
        </div>
      </main>
    </KnowledgeCenterShell>
  );
}
