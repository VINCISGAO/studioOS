import Link from "next/link";
import { MarketingDocsShell } from "@/components/marketing/docs/marketing-docs-shell";
import {
  buildKnowledgeArticlePath,
  knowledgeCodeForPathPrefix
} from "@/features/knowledge-center/knowledge-center.constants";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import { toUiLocale } from "@/lib/app-language.shared";
import type { Metadata } from "next";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const locale = toUiLocale(lang === "zh" ? "zh-CN" : "en");
  return {
    title: locale === "zh" ? "VINCIS 知识中心" : "VINCIS Knowledge Center",
    description:
      locale === "zh"
        ? "VINCIS 官方知识中心 — SEO、帮助中心、学院与 Lucien 共用内容。"
        : "Official VINCIS knowledge for SEO, Help Center, Academy, and Lucien."
  };
}

export default async function KnowledgeIndexPage({ params }: Props) {
  const { lang } = await params;
  const languageCode = knowledgeCodeForPathPrefix(lang);
  const locale = toUiLocale(languageCode);
  const [rows, categories] = await Promise.all([
    knowledgeCenterService.listPublishedPublic(languageCode),
    knowledgeCenterService.listCategorySummaries(languageCode)
  ]);

  if (!rows.length) {
    return (
      <MarketingDocsShell locale={locale} active="resources">
        <main className="mx-auto max-w-3xl px-4 py-16 text-center text-zinc-500">
          {locale === "zh" ? "知识中心文章即将发布。" : "Knowledge Center articles are coming soon."}
        </main>
      </MarketingDocsShell>
    );
  }

  return (
    <MarketingDocsShell locale={locale} active="resources">
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold tracking-[-0.03em] text-zinc-950">
          {locale === "zh" ? "知识中心" : "Knowledge Center"}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-zinc-500">
          {locale === "zh"
            ? "官方指南、学院内容与帮助文档 — 一篇内容，多处使用。"
            : "Official guides, academy content, and help docs — one article, many surfaces."}
        </p>

        {categories.length ? (
          <div className="mt-8 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/${lang}/resources/category/${category.slug}`}
                className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300"
              >
                {category.name} · {category.count}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-10 space-y-3">
          {rows.map((article) => (
            <Link
              key={article.id}
              href={buildKnowledgeArticlePath(lang as "en" | "zh", article.slug)}
              className="block rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm transition hover:border-zinc-300"
            >
              <h2 className="text-lg font-semibold text-zinc-950">{article.title}</h2>
              <p className="mt-1 text-sm text-zinc-500">{article.category}</p>
            </Link>
          ))}
        </div>
      </main>
    </MarketingDocsShell>
  );
}
