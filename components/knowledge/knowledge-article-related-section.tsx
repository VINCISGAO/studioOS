import type { PublicKnowledgeArticleDto } from "@/features/knowledge-center/knowledge-center.types";
import type { Locale } from "@/lib/i18n";
import Link from "next/link";

export function KnowledgeArticleRelatedSection({
  locale,
  related
}: {
  locale: Locale;
  related: PublicKnowledgeArticleDto["related"];
}) {
  if (!related.length) return null;

  const zh = locale === "zh";

  return (
    <section className="mt-14" aria-labelledby="knowledge-related-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
        {zh ? "延伸阅读" : "Keep Reading"}
      </p>
      <h2 id="knowledge-related-heading" className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
        {zh ? "相关阅读" : "Related Articles"}
      </h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {related.map((item) => (
          <Link
            key={item.slug}
            href={item.path}
            className="group rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-violet-200 hover:bg-violet-50/30"
          >
            <p className="text-base font-medium text-zinc-900 group-hover:text-violet-700">{item.title}</p>
            {item.excerpt ? (
              <p className="mt-2 text-sm leading-6 text-zinc-500">{item.excerpt}</p>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
