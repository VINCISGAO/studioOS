import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingDocsShell } from "@/components/marketing/docs/marketing-docs-shell";
import {
  buildKnowledgeArticlePath,
  knowledgeCodeForPathPrefix
} from "@/features/knowledge-center/knowledge-center.constants";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import { toUiLocale } from "@/lib/app-language.shared";

type Props = { params: Promise<{ lang: string; categorySlug: string }> };

export default async function KnowledgeCategoryPage({ params }: Props) {
  const { lang, categorySlug } = await params;
  const languageCode = knowledgeCodeForPathPrefix(lang);
  const locale = toUiLocale(languageCode);
  const categories = await knowledgeCenterService.listCategorySummaries(languageCode);
  const category = categories.find((item) => item.slug === categorySlug);
  if (!category) notFound();

  const articles = await knowledgeCenterService.listPublishedByCategory(languageCode, categorySlug);

  return (
    <MarketingDocsShell locale={locale} active="resources">
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href={`/${lang}/resources`} className="text-sm text-zinc-500 hover:text-zinc-800">
          {locale === "zh" ? "← 返回知识中心" : "← Back to Knowledge Center"}
        </Link>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-zinc-950">{category.name}</h1>
        <p className="mt-3 text-lg text-zinc-500">
          {locale === "zh" ? `${category.count} 篇文章` : `${category.count} articles`}
        </p>
        <div className="mt-10 space-y-3">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={buildKnowledgeArticlePath(lang as "en" | "zh", article.slug)}
              className="block rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm transition hover:border-zinc-300"
            >
              <h2 className="text-lg font-semibold text-zinc-950">{article.title}</h2>
              <p className="mt-1 text-sm text-zinc-500">{article.author_name}</p>
            </Link>
          ))}
        </div>
      </main>
    </MarketingDocsShell>
  );
}
