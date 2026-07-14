import Link from "next/link";
import type { PublicKnowledgeArticleDto } from "@/features/knowledge-center/knowledge-center.types";
import { extractKnowledgeHtmlToc, resolveKnowledgeBodyHtml } from "@/lib/knowledge/knowledge-html";
import { KnowledgeArticleRenderer } from "@/components/knowledge/knowledge-article-renderer";
import type { Locale } from "@/lib/i18n";
import { KnowledgeArticleFaqSection } from "@/components/knowledge/knowledge-article-faq-section";
import { KnowledgeArticleRelatedSection } from "@/components/knowledge/knowledge-article-related-section";
import { KnowledgeCoverImage } from "@/components/knowledge/knowledge-cover-image";
import { buildKnowledgeIndexPath } from "@/features/knowledge-center/knowledge-center.constants";

function KnowledgeArticleToc({
  locale,
  items
}: {
  locale: Locale;
  items: Array<{ id: string; label: string; level: number }>;
}) {
  const zh = locale === "zh";
  if (!items.length) return null;

  return (
    <nav className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
      <p className="text-sm font-semibold text-zinc-900">{zh ? "目录" : "Table of Contents"}</p>
      <ol className="mt-3 space-y-2 text-sm text-zinc-600">
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? "pl-4" : undefined}>
            <a href={`#${item.id}`} className="transition hover:text-violet-700">
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function KnowledgeArticlePage({
  locale,
  article
}: {
  locale: Locale;
  article: PublicKnowledgeArticleDto;
}) {
  const zh = locale === "zh";
  const bodyHtml = resolveKnowledgeBodyHtml({
    body_html: article.body_html,
    body_markdown: article.body_markdown
  });
  const toc = extractKnowledgeHtmlToc(bodyHtml);
  const updated = new Date(article.updated_at).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <article className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
      <Link
        href={buildKnowledgeIndexPath(article.path_prefix)}
        className="text-sm font-medium text-zinc-500 transition hover:text-violet-700"
      >
        {zh ? "← 返回知识中心" : "← Back to Knowledge Center"}
      </Link>

      <header className="mt-6 space-y-4 lg:mt-8">
        {article.category_name ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">{article.category_name}</p>
        ) : null}
        <h1 className="max-w-5xl text-3xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]">
          {article.title}
        </h1>
        {article.subtitle ? (
          <p className="max-w-4xl text-lg leading-8 text-zinc-500 sm:text-xl">{article.subtitle}</p>
        ) : null}
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-500">
          <span>
            {zh ? "更新于" : "Updated"} {updated}
          </span>
          <span>
            {article.reading_time_minutes} {zh ? "分钟阅读" : "min read"}
          </span>
          <span>{article.author_name}</span>
        </div>
      </header>

      {article.cover_image_url ? (
        <div className="mt-8 overflow-hidden rounded-[28px] bg-zinc-100 lg:mt-10">
          <KnowledgeCoverImage
            coverUrl={article.cover_image_url}
            fallbackUrl={article.seo?.og_image_url}
            alt={article.title}
            className="aspect-[16/9] w-full object-cover"
          />
        </div>
      ) : null}

      <div
        className={
          toc.length
            ? "mt-10 grid grid-cols-1 gap-8 lg:mt-12 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[minmax(0,260px)_minmax(0,1fr)]"
            : "mt-10 lg:mt-12"
        }
      >
        {toc.length ? (
          <aside className="min-w-0">
            <KnowledgeArticleToc locale={locale} items={toc} />
          </aside>
        ) : null}

        <div className="min-w-0">
          <KnowledgeArticleRenderer html={bodyHtml} />
          <KnowledgeArticleFaqSection locale={locale} faqs={article.faqs} />
          <KnowledgeArticleRelatedSection locale={locale} related={article.related} />
        </div>
      </div>
    </article>
  );
}
