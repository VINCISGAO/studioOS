import type { PublicKnowledgeArticleDto } from "@/features/knowledge-center/knowledge-center.types";
import { extractKnowledgeToc, renderKnowledgeMarkdown } from "@/lib/knowledge/knowledge-markdown";
import type { Locale } from "@/lib/i18n";
import { KnowledgeArticleFaqSection } from "@/components/knowledge/knowledge-article-faq-section";
import { KnowledgeArticleRelatedSection } from "@/components/knowledge/knowledge-article-related-section";
import { KnowledgeCoverImage } from "@/components/knowledge/knowledge-cover-image";

export function KnowledgeArticlePage({
  locale,
  article
}: {
  locale: Locale;
  article: PublicKnowledgeArticleDto;
}) {
  const zh = locale === "zh";
  const toc = extractKnowledgeToc(article.body_markdown);
  const updated = new Date(article.updated_at).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-4">
        {article.category_name ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">{article.category_name}</p>
        ) : null}
        <h1 className="text-4xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-5xl">{article.title}</h1>
        {article.subtitle ? <p className="text-xl leading-8 text-zinc-500">{article.subtitle}</p> : null}
        <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
          <span>{zh ? "更新于" : "Updated"} {updated}</span>
          <span>{article.reading_time_minutes} {zh ? "分钟阅读" : "min read"}</span>
          <span>{article.author_name}</span>
        </div>
      </header>

      {article.cover_image_url ? (
        <div className="mt-8 overflow-hidden rounded-[28px] bg-zinc-100">
          <KnowledgeCoverImage
            coverUrl={article.cover_image_url}
            fallbackUrl={article.seo?.og_image_url}
            alt={article.title}
            className="aspect-[16/9] w-full object-cover"
          />
        </div>
      ) : null}

      {toc.length ? (
        <nav className="mt-10 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5">
          <p className="text-sm font-semibold text-zinc-900">{zh ? "目录" : "Table of Contents"}</p>
          <ol className="mt-3 space-y-2 text-sm text-zinc-600">
            {toc.map((item) => (
              <li key={item.id} className={item.level === 3 ? "pl-4" : undefined}>
                <a href={`#${item.id}`} className="hover:text-zinc-950">
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <div
        className="prose-vincis mt-10"
        dangerouslySetInnerHTML={{ __html: renderKnowledgeMarkdown(article.body_markdown) }}
      />

      <KnowledgeArticleFaqSection locale={locale} faqs={article.faqs} />
      <KnowledgeArticleRelatedSection locale={locale} related={article.related} />
    </article>
  );
}
