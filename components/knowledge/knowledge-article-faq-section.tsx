import type { KnowledgeFaqDto } from "@/features/knowledge-center/knowledge-center.types";
import type { Locale } from "@/lib/i18n";

export function KnowledgeArticleFaqSection({
  locale,
  faqs
}: {
  locale: Locale;
  faqs: KnowledgeFaqDto[];
}) {
  if (!faqs.length) return null;

  const zh = locale === "zh";

  return (
    <section className="mt-14 rounded-[28px] border border-zinc-200 bg-gradient-to-b from-white to-zinc-50/80 p-6 sm:p-8" aria-labelledby="knowledge-faq-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
        {zh ? "常见问题" : "Frequently Asked Questions"}
      </p>
      <h2 id="knowledge-faq-heading" className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
        FAQ
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
        {zh
          ? "这些问题帮助品牌快速理解 AI 广告的核心概念、成本与落地路径。"
          : "Quick answers on what AI advertising is, what it costs, and how brands can start."}
      </p>
      <div className="mt-6 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white">
        {faqs.map((faq) => (
          <details key={faq.id} className="group px-5 py-4">
            <summary className="cursor-pointer list-none text-base font-medium text-zinc-900 marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-start justify-between gap-4">
                <span>{faq.question}</span>
                <span className="mt-0.5 text-sm text-zinc-400 transition group-open:rotate-45">+</span>
              </span>
            </summary>
            <p className="mt-3 text-[17px] leading-8 text-zinc-600">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
